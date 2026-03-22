#!/usr/bin/env node

/**
 * Community Architecture MDX Submission Validator
 * Validates frontmatter, sections, and auto-detects quality tier.
 * Zero dependencies — Node.js built-ins only.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, basename, extname, join, dirname } from 'path';
import { argv, exit } from 'process';
import { fileURLToPath } from 'url';

// ─── ANSI colors ────────────────────────────────────────────────────────────

const c = {
  green:   s => `\x1b[32m${s}\x1b[0m`,
  red:     s => `\x1b[31m${s}\x1b[0m`,
  yellow:  s => `\x1b[33m${s}\x1b[0m`,
  cyan:    s => `\x1b[36m${s}\x1b[0m`,
  bold:    s => `\x1b[1m${s}\x1b[0m`,
  dim:     s => `\x1b[2m${s}\x1b[0m`,
};

const CHECK = c.green('✓');
const CROSS = c.red('✗');
const WARN  = c.yellow('⚠');

// ─── Tier definitions ───────────────────────────────────────────────────────

const TIER_META = {
  1: { name: 'Concept',      tagline: 'Enough to understand the idea' },
  2: { name: 'Documented',   tagline: 'Thorough enough to evaluate and learn from' },
  3: { name: 'Field-Tested', tagline: 'Includes real-world evidence and battle scars' },
};

// Sections required per tier (cumulative — each tier includes all previous)
const TIER_SECTIONS = {
  1: [
    'Problem & Context',
    'Technology Choices',
    'Architecture Overview',
  ],
  2: [
    'System Context',
    'Components',
    'Data Flow',
    'Architecture Decisions',
    'Trade-offs & Constraints',
  ],
  3: [
    'Failure Modes & Resilience',
    'Security Model',
    'Deployment Architecture',
    'Scale & Performance',
    'Lessons Learned',
  ],
};

// Helpful messages for missing sections (next-tier suggestions)
const SECTION_HELP = {
  'Problem & Context':
    'Describe the real problem this architecture solves and the\n' +
    '    constraints that shaped your decisions. Reviewers need context to evaluate trade-offs.',
  'Technology Choices':
    'List the key technologies and frameworks chosen, with brief\n' +
    '    rationale. This helps readers assess applicability to their own stack.',
  'Architecture Overview':
    'Provide a high-level view of the system structure. A diagram\n' +
    '    or concise description of major components and their relationships.',
  'System Context':
    'Show how the system fits into its broader environment — external\n' +
    '    systems, users, and integration points. A C4 System Context diagram works well.',
  'Components':
    'Break down the system into its major building blocks. Describe\n' +
    '    each component\'s responsibility and how they interact.',
  'Data Flow':
    'Trace how data moves through the system end-to-end. This reveals\n' +
    '    bottlenecks, latency sources, and transformation steps.',
  'Architecture Decisions':
    'Document key decisions as lightweight ADRs. Each decision should\n' +
    '    capture context, options considered, and rationale for the choice made.',
  'Trade-offs & Constraints':
    'Be honest about what you gave up and why. Every architecture\n' +
    '    has trade-offs — naming them builds trust and helps others avoid pitfalls.',
  'Failure Modes & Resilience':
    'What happens when things go wrong? Describe known failure\n' +
    '    scenarios and how the system recovers or degrades gracefully.',
  'Security Model':
    'Identify trust boundaries, authentication approach, and key\n' +
    '    threat considerations. Even a brief overview of who can access what is valuable.',
  'Deployment Architecture':
    'How does this run in production? Describe the environment,\n' +
    '    infrastructure, and deployment process.',
  'Scale & Performance':
    'Share actual or expected performance characteristics. Include\n' +
    '    load profiles, scaling strategies, and any benchmarks or targets.',
  'Lessons Learned':
    'What would you do differently? Real-world hindsight is the most\n' +
    '    valuable part of a field-tested architecture document.',
};

// ─── Metric detection regex ─────────────────────────────────────────────────

const METRIC_RE = /\d+[\s]*(req\/s|rps|ms|seconds?|minutes?|hours?|%|percent|MB|GB|TB|KB|users?|nodes?|instances?|replicas?|containers?|pods?|requests?|transactions?|ops\/s|QPS|TPS|p\d{2,3})/i;

// ─── Frontmatter parsing ────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const block = match[1];
  const fm = {};

  for (const line of block.split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (!kv) continue;
    let [, key, value] = kv;
    value = value.trim();

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle YAML arrays written as [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    }

    fm[key] = value;
  }

  // Also handle multi-line YAML arrays (- item)
  const tagBlock = block.match(/^tags:\s*\r?\n((?:\s+-\s+.*\r?\n?)+)/m);
  if (tagBlock) {
    fm.tags = tagBlock[1]
      .split(/\r?\n/)
      .filter(l => l.trim().startsWith('-'))
      .map(l => l.replace(/^\s*-\s*/, '').trim().replace(/^["']|["']$/g, ''));
  }

  return fm;
}

// ─── Section extraction ─────────────────────────────────────────────────────

function extractSections(body) {
  const sections = {};
  const lines = body.split(/\r?\n/);
  let currentH2 = null;
  let currentContent = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      if (currentH2 !== null) {
        sections[currentH2] = currentContent.join('\n');
      }
      currentH2 = h2Match[1].trim();
      currentContent = [];
    } else if (currentH2 !== null) {
      currentContent.push(line);
    }
  }
  if (currentH2 !== null) {
    sections[currentH2] = currentContent.join('\n');
  }

  return sections;
}

function stripCommentsAndWhitespace(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(text) {
  const clean = stripCommentsAndWhitespace(text);
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

function sectionHasContent(sectionBody) {
  if (!sectionBody) return false;
  const stripped = stripCommentsAndWhitespace(sectionBody);
  return stripped.length > 0;
}

function countSubHeadings(sectionBody) {
  if (!sectionBody) return 0;
  const matches = sectionBody.match(/^###\s+.+/gm);
  return matches ? matches.length : 0;
}

// ─── Frontmatter validation ─────────────────────────────────────────────────

function validateFrontmatter(fm) {
  const errors = [];

  if (!fm) {
    errors.push('Frontmatter block missing or malformed (expected --- delimiters)');
    return errors;
  }

  // Required string fields
  const requiredStrings = ['title', 'author', 'description', 'date', 'license'];
  for (const field of requiredStrings) {
    if (!fm[field] || (typeof fm[field] === 'string' && fm[field].trim() === '')) {
      errors.push(`Missing required frontmatter field: "${field}"`);
    }
  }

  // Description length
  if (fm.description && typeof fm.description === 'string' && fm.description.length < 50) {
    errors.push(`Description must be at least 50 characters (currently ${fm.description.length})`);
  }

  // Date format (ISO 8601: YYYY-MM-DD)
  if (fm.date && !/^\d{4}-\d{2}-\d{2}$/.test(fm.date)) {
    errors.push(`Invalid date format "${fm.date}" — expected YYYY-MM-DD (ISO 8601)`);
  } else if (fm.date && isNaN(Date.parse(fm.date))) {
    errors.push(`Invalid date value "${fm.date}" — not a real date`);
  }

  // Tags
  if (!fm.tags) {
    errors.push('Missing required frontmatter field: "tags"');
  } else if (Array.isArray(fm.tags) && fm.tags.length === 0) {
    errors.push('At least one tag is required');
  } else if (typeof fm.tags === 'string' && fm.tags.trim() === '') {
    errors.push('At least one tag is required');
  }

  // License
  if (fm.license && fm.license !== 'CC-BY-4.0') {
    errors.push(`License must be "CC-BY-4.0" (found "${fm.license}")`);
  }

  return errors;
}

// ─── Tier assessment ────────────────────────────────────────────────────────

function assessTier(sections, body) {
  const results = { tier: 0, passed: {}, failed: {} };

  // Tier 1 checks
  const t1Checks = {};
  for (const sec of TIER_SECTIONS[1]) {
    if (sections[sec] !== undefined && sectionHasContent(sections[sec])) {
      if (sec === 'Problem & Context' && wordCount(sections[sec]) < 50) {
        t1Checks[sec] = false;
      } else {
        t1Checks[sec] = true;
      }
    } else {
      t1Checks[sec] = false;
    }
  }

  const t1Pass = Object.values(t1Checks).every(Boolean);
  results.passed[1] = t1Checks;
  if (!t1Pass) {
    results.tier = 0;
    results.failed[1] = Object.entries(t1Checks).filter(([, v]) => !v).map(([k]) => k);
    return results;
  }
  results.tier = 1;

  // Tier 2 checks
  const t2Checks = {};
  for (const sec of TIER_SECTIONS[2]) {
    if (sec === 'Architecture Decisions') {
      const has = sections[sec] !== undefined && sectionHasContent(sections[sec]);
      const subCount = has ? countSubHeadings(sections[sec]) : 0;
      t2Checks[sec] = has && subCount >= 2;
    } else {
      t2Checks[sec] = sections[sec] !== undefined && sectionHasContent(sections[sec]);
    }
  }

  // Quantified metric check
  t2Checks['Quantified metric'] = METRIC_RE.test(body);

  const t2Pass = Object.values(t2Checks).every(Boolean);
  results.passed[2] = t2Checks;
  if (!t2Pass) {
    results.tier = 1;
    results.failed[2] = Object.entries(t2Checks).filter(([, v]) => !v).map(([k]) => k);
    return results;
  }
  results.tier = 2;

  // Tier 3 checks
  const t3Checks = {};
  for (const sec of TIER_SECTIONS[3]) {
    t3Checks[sec] = sections[sec] !== undefined && sectionHasContent(sections[sec]);
  }

  const t3Pass = Object.values(t3Checks).every(Boolean);
  results.passed[3] = t3Checks;
  if (!t3Pass) {
    results.tier = 2;
    results.failed[3] = Object.entries(t3Checks).filter(([, v]) => !v).map(([k]) => k);
    return results;
  }
  results.tier = 3;

  return results;
}

// ─── Output formatting ──────────────────────────────────────────────────────

function printTierBox(tier) {
  const meta = TIER_META[tier];
  if (!meta) {
    console.log('');
    console.log(c.red('  No tier achieved — fix errors above first.'));
    console.log('');
    return;
  }

  const line1 = `  Tier: ${meta.name}`;
  const line2 = `  "${meta.tagline}"`;
  const width = Math.max(line1.length, line2.length) + 4;
  const pad = s => s + ' '.repeat(Math.max(0, width - s.length - 2));

  console.log('');
  console.log(c.cyan(`  ┌${'─'.repeat(width)}┐`));
  console.log(c.cyan(`  │ ${c.bold(pad(line1))} │`));
  console.log(c.cyan(`  │ ${pad(line2)} │`));
  console.log(c.cyan(`  └${'─'.repeat(width)}┘`));
  console.log('');
}

function printSuggestions(tierResults) {
  const nextTier = tierResults.tier + 1;
  if (nextTier > 3 || !tierResults.failed[nextTier]) return 0;

  const missing = tierResults.failed[nextTier];
  const tierName = TIER_META[nextTier].name;

  console.log(`  To reach ${c.bold(tierName)}, add:`);

  for (const sec of missing) {
    const help = SECTION_HELP[sec];
    if (help) {
      console.log(`    ${c.yellow('→')} ${c.bold(`"${sec}"`)} — ${help}`);
    } else if (sec === 'Quantified metric') {
      console.log(`    ${c.yellow('→')} ${c.bold('Quantified metric')} — Include at least one number with units (e.g., "200ms p99",\n      "10k req/s", "99.9%"). Concrete numbers make architectures credible.`);
    } else {
      console.log(`    ${c.yellow('→')} ${c.bold(`"${sec}"`)}`);
    }
  }

  return missing.length;
}

// ─── Warnings ───────────────────────────────────────────────────────────────

function collectWarnings(sections, body) {
  const warnings = [];

  // Empty sections (heading exists but no content)
  for (const [name, content] of Object.entries(sections)) {
    if (!sectionHasContent(content)) {
      warnings.push(`Section "${name}" exists but has no content`);
    }
  }

  // Problem & Context word count
  if (sections['Problem & Context'] !== undefined &&
      sectionHasContent(sections['Problem & Context']) &&
      wordCount(sections['Problem & Context']) < 50) {
    warnings.push(`"Problem & Context" has fewer than 50 words (${wordCount(sections['Problem & Context'])} found)`);
  }

  // No quantified metrics
  if (!METRIC_RE.test(body)) {
    warnings.push('No quantified metrics found (e.g., "200ms", "10k req/s", "99.9%")');
  }

  return warnings;
}

// ─── Duplicate slug detection ───────────────────────────────────────────────

function checkDuplicateSlugs(filePaths) {
  const slugs = new Map();
  const duplicates = [];

  for (const fp of filePaths) {
    const slug = basename(fp, extname(fp));
    if (slugs.has(slug)) {
      duplicates.push({ slug, files: [slugs.get(slug), fp] });
    } else {
      slugs.set(slug, fp);
    }
  }

  return duplicates;
}

// ─── Main validation for a single file ──────────────────────────────────────

function validateFile(filePath) {
  const fileName = basename(filePath);
  const result = { file: fileName, errors: [], warnings: [], tier: 0, suggestions: 0 };

  console.log(c.bold(`\nValidating: ${fileName}`));
  console.log('');

  // Read file
  let raw;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch (err) {
    result.errors.push(`Cannot read file: ${err.message}`);
    console.log(`  ${CROSS} Cannot read file: ${err.message}`);
    return result;
  }

  // Parse frontmatter
  const fm = parseFrontmatter(raw);
  const fmErrors = validateFrontmatter(fm);

  if (fmErrors.length === 0) {
    console.log(`  ${CHECK} Frontmatter: all required fields valid`);
  } else {
    for (const err of fmErrors) {
      console.log(`  ${CROSS} Frontmatter: ${err}`);
      result.errors.push(err);
    }
  }

  // MDX parse check (frontmatter parsed successfully)
  if (fm) {
    console.log(`  ${CHECK} MDX: parses successfully`);
  } else {
    console.log(`  ${CROSS} MDX: frontmatter block could not be parsed`);
    result.errors.push('MDX frontmatter could not be parsed');
  }

  // Extract body (everything after frontmatter)
  const bodyMatch = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1] : raw;
  const sections = extractSections(body);

  // Tier assessment
  console.log('');
  console.log('  Tier Assessment:');

  const tierResults = assessTier(sections, body);

  // Print tier 1 results
  for (const sec of TIER_SECTIONS[1]) {
    const passed = tierResults.passed[1]?.[sec];
    if (passed) {
      console.log(`    ${CHECK} Concept: "${sec}" present`);
    } else if (passed === false) {
      if (sec === 'Problem & Context' && sections[sec] !== undefined) {
        console.log(`    ${CROSS} Concept: "${sec}" needs ≥50 words of content`);
      } else {
        console.log(`    ${CROSS} Concept: missing "${sec}"`);
      }
    }
  }

  if (tierResults.tier >= 1) {
    console.log(`    ${CHECK} ${c.bold('Concept requirements met')}`);

    // Print tier 2 results
    if (tierResults.passed[2]) {
      for (const [sec, passed] of Object.entries(tierResults.passed[2])) {
        if (passed) {
          console.log(`    ${CHECK} Documented: "${sec}" present`);
        } else {
          if (sec === 'Architecture Decisions') {
            console.log(`    ${CROSS} Documented: "${sec}" needs ≥2 sub-headings (### Decision)`);
          } else {
            console.log(`    ${CROSS} Documented: missing "${sec}"`);
          }
        }
      }
    }

    if (tierResults.tier >= 2) {
      console.log(`    ${CHECK} ${c.bold('Documented requirements met')}`);

      // Print tier 3 results
      if (tierResults.passed[3]) {
        for (const [sec, passed] of Object.entries(tierResults.passed[3])) {
          if (passed) {
            console.log(`    ${CHECK} Field-Tested: "${sec}" present`);
          } else {
            console.log(`    ${CROSS} Field-Tested: missing "${sec}"`);
          }
        }
      }

      if (tierResults.tier >= 3) {
        console.log(`    ${CHECK} ${c.bold('Field-Tested requirements met')}`);
      }
    }
  }

  result.tier = tierResults.tier;

  // Tier box
  printTierBox(tierResults.tier);

  // Suggestions for next tier
  result.suggestions = printSuggestions(tierResults);

  // Warnings
  const warnings = collectWarnings(sections, body);
  result.warnings = warnings;

  if (warnings.length > 0) {
    console.log('');
    console.log('  Warnings:');
    for (const w of warnings) {
      console.log(`    ${WARN} ${w}`);
    }
  }

  // Summary line
  const errCount = result.errors.length;
  const suggCount = result.suggestions;
  const status = errCount === 0 ? c.green('PASS') : c.red('FAIL');
  console.log('');
  console.log(`  Result: ${status} (${errCount} error${errCount !== 1 ? 's' : ''}, ${suggCount} suggestion${suggCount !== 1 ? 's' : ''})`);

  return result;
}

// ─── CLI entry point ────────────────────────────────────────────────────────

function main() {
  const args = argv.slice(2);
  let files = [];

  if (args.length === 0) {
    // Auto-discover .mdx files in community/architectures/
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const architecturesDir = resolve(__dirname, '..', 'architectures');

    if (existsSync(architecturesDir)) {
      files = readdirSync(architecturesDir)
        .filter(f => extname(f) === '.mdx')
        .map(f => join(architecturesDir, f));
    }

    if (files.length === 0) {
      console.log(c.yellow('No .mdx files found in community/architectures/'));
      console.log(c.dim('Usage: node validate.mjs [file1.mdx] [file2.mdx] ...'));
      exit(0);
    }
  } else {
    files = args.map(f => resolve(f));
  }

  // Check for duplicate slugs
  const dupes = checkDuplicateSlugs(files);

  console.log(c.bold(`\n━━━ Community Architecture Validator ━━━`));
  console.log(c.dim(`  Validating ${files.length} file${files.length !== 1 ? 's' : ''}...\n`));

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalSuggestions = 0;

  for (const file of files) {
    const slug = basename(file, extname(file));
    const isDupe = dupes.find(d => d.slug === slug);

    const result = validateFile(file);
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
    totalSuggestions += result.suggestions;

    if (isDupe) {
      console.log(`  ${CROSS} Duplicate slug "${slug}" — also found at: ${isDupe.files.filter(f => f !== file).join(', ')}`);
      totalErrors += 1;
    }
  }

  // Final summary
  console.log('');
  console.log(c.bold('━━━ Summary ━━━'));
  console.log(`  Files:       ${files.length}`);
  console.log(`  Errors:      ${totalErrors === 0 ? c.green('0') : c.red(String(totalErrors))}`);
  console.log(`  Warnings:    ${totalWarnings === 0 ? c.green('0') : c.yellow(String(totalWarnings))}`);
  console.log(`  Suggestions: ${totalSuggestions}`);
  console.log('');

  exit(totalErrors > 0 ? 1 : 0);
}

main();
