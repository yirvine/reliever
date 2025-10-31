const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'other', 'API.MD');
const backupPath = filePath + '.bak';

function isRomanNumeral(str) {
  return /^[ivxlcdm]+$/i.test(str.trim());
}

function isTOCDotLeader(line) {
  return /\.{2,}\s*\d+\s*$/.test(line) || /(?:\.\s){2,}\d+\s*$/.test(line);
}

function normalizeBullets(line) {
  let out = line
    .replace(/^\s*[•●◦▪▫–—]\s*/u, '- ')
    .replace(/^\s*[–—]\s+/, '- ');
  return out;
}

function tokenIsNumeric(tok) {
  return /^\d+(?:[.,]\d+)?(?:e[+-]?\d+)?$/i.test(tok);
}

function numericDensity(line) {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length === 0) return 0;
  let nums = 0;
  for (const t of tokens) if (tokenIsNumeric(t)) nums++;
  return nums / tokens.length;
}

function looksLikeChartAxes(line) {
  const t = line.trim();
  if (/^(Key\s+[XY]|0\s+[A-Z])\b/.test(t)) return true;
  if (/(\bX\b.*\bY\b|\bY\b.*\bX\b)/.test(t) && /\d/.test(t)) return true;
  return false;
}

function looksLikeFigureOrTable(line) {
  const t = line.trim();
  return /^(Figure|Table)\b/i.test(t);
}

function isGibberishFigureLine(line) {
  // Strip leading Markdown heading markers for detection
  const t0 = line.trim();
  const t = t0.replace(/^#{1,6}\s+/, '').trim();
  if (!t) return false;
  if (looksLikeFigureOrTable(t)) return true;
  if (looksLikeChartAxes(t)) return true;
  if (/[-=]{5,}/.test(t)) return true;
  if (/[*⋅×÷∑Σ√∞≈≃≅≤≥→←⇐⇒±∆∂∫]|\uF0/ .test(t)) return true; // math-like symbols and stray glyphs
  if (/\b(\d+\s+){5,}\d+\b/.test(t)) return true;
  if (numericDensity(t) > 0.6 && t.split(/\s+/).length >= 6) return true;
  if (/^\d+(\s+\d+){4,}/.test(t)) return true;
  // Legend-like lines from figures
  if (/^\d+\s+[A-Za-z].*\((?:mm|in\.|stack|meters?|feet)\)/i.test(t)) return true;
  // Percentage or reference-number lines mis-read as headings
  if (/^\d+\s*%\b/.test(t)) return true;
  if (/^\d+\s*\[[0-9]+\]/.test(t)) return true;
  // Lone axis markers
  if (/^0\s+[XY]\b/.test(t)) return true;
  return false;
}

function shouldRemoveLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^Copyright American Petroleum Institute Provided by IHS/i.test(trimmed)) return true;
  if (/^API STANDARD 521$/i.test(trimmed)) return true;
  if (/^PRESSURE-RELIEVING AND DEPRESSURING SYSTEMS\b/i.test(trimmed)) return true;
  if (/^Page$/i.test(trimmed)) return true;
  if (isRomanNumeral(trimmed)) return true;
  if (/^\d+\s+API STANDARD 521$/i.test(trimmed)) return true;
  if (/^\d+\s*$/.test(trimmed) && Number(trimmed) > 0) return true;
  if (isGibberishFigureLine(trimmed)) return true;
  return false;
}

function headingLevelFromNumbering(text) {
  const m = text.match(/^(Annex\s+[A-Z]|\d+(?:\.\d+)*)\b/);
  if (!m) return null;
  const token = m[1];
  if (/^Annex\s+[A-Z]/.test(token)) return 1;
  const dotCount = (token.match(/\./g) || []).length;
  return Math.min(6, dotCount + 1);
}

function isLikelyHeading(line) {
  const trimmed = line.trim();
  if (/^(Contents|Foreword|Special Notes)\b/i.test(trimmed)) return true;
  if (/^(Annex\s+[A-Z]\b.*)/.test(trimmed)) return true;
  // Avoid treating unit/value lines as headings
  if (/^\d+(?:\.\d+)*\s+(?:[A-Za-z]+\/[A-Za-z0-9]+|%|kPa|psi|MJ\/m3|Btu\/Scf|kW|\(.*\))\b/.test(trimmed)) {
    return false;
  }
  if (/^\d+(?:\.\d+)*\s+/.test(trimmed)) return true;
  return false;
}

function normalizeHeading(line) {
  let text = line.trim();
  text = removeDotLeaders(text);
  const level = headingLevelFromNumbering(text) || 2;
  if (/^#{1,6}\s/.test(text)) return text;
  return `${'#'.repeat(level)} ${text}`;
}

function removeDotLeaders(line) {
  return line
    .replace(/\s(?:\.\s){2,}\d+\s*$/,'')
    .replace(/\.{2,}\s*\d+\s*$/,'');
}

function clean() {
  const original = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync(backupPath, original, 'utf8');

  const lines = original.split(/\r?\n/);
  const out = [];
  let inTOC = false;
  let tocBudget = 0; // number of lines to treat as ToC after 'Contents'

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip lines that look like figure/table gibberish
    if (shouldRemoveLine(line)) continue;

    // Set ToC mode
    if (/^\s*##?\s*Contents\s*$/i.test(line.trim())) {
      inTOC = true;
      tocBudget = 300; // generous window to cover entire ToC block
      out.push('## Contents');
      continue;
    }

    // If ToC mode, convert entries to list items and avoid heading normalization
    if (inTOC && tocBudget > 0) {
      tocBudget--;
      if (!line.trim()) {
        out.push('');
        continue;
      }
      let t = removeDotLeaders(line).trim();
      // Strip any heading markers introduced earlier
      t = t.replace(/^#{1,6}\s+/, '');
      // Consider entries that begin with numbering or Annex
      if (/^(Annex\s+[A-Z]|\d+(?:\.\d+)*)\b/.test(t)) {
        out.push(`- ${t}`);
        continue;
      }
      // If we see something that looks like the start of real content, end ToC early
      if (/^#{1,6}\s+\d+/.test(line) || /^#{1,6}\s+Annex\b/.test(line)) {
        inTOC = false;
        // fall through to normal handling
      } else {
        out.push(t);
        continue;
      }
    }

    // Normalize bullets
    line = normalizeBullets(line);

    // Remove trailing dot leaders even outside ToC
    line = removeDotLeaders(line);

    // Normalize headings (outside ToC)
    if (isLikelyHeading(line)) {
      line = normalizeHeading(line);
    }

    line = line.replace(/\s+$/,'');
    out.push(line);
  }

  // Secondary purge for any residual gibberish lines before joining
  const filtered = [];
  for (const l of out) {
    if (!l) { filtered.push(l); continue; }
    if (isGibberishFigureLine(l)) continue;
    // Remove lines like '# 2 something' that are not real headings
    if (/^#\s+\d+\s+(?:[a-z]|\d|X\b|Y\b)/.test(l)) continue;
    filtered.push(l);
  }

  // Join wrapped paragraphs with dehyphenation
  const joined = [];
  for (let i = 0; i < filtered.length; i++) {
    const curr = filtered[i];
    const prev = joined.length ? joined[joined.length - 1] : null;

    const currIsHeading = curr && /^#{1,6}\s/.test(curr.trim());
    const currStartsList = curr && /^\s*([-*+]\s|\d+\.\s)/.test(curr);
    const currIsBlank = !curr || /^\s*$/.test(curr);

    if (!prev) {
      joined.push(curr);
      continue;
    }

    const prevIsBlank = /^\s*$/.test(prev);
    const prevEndsHyphen = /[^\s-]-$/.test(prev);
    const prevEndsSentence = /[\.;:?!)]$/.test(prev.trim());

    const safeToJoin = !prevIsBlank && !currIsBlank && !currIsHeading && !currStartsList;

    if (safeToJoin) {
      if (prevEndsHyphen) {
        joined[joined.length - 1] = prev.replace(/-$/,'') + curr.trimStart();
      } else if (!prevEndsSentence) {
        joined[joined.length - 1] = prev + ' ' + curr.trim();
      } else {
        joined.push(curr);
      }
    } else {
      joined.push(curr);
    }
  }

  // Reduce multiple blank lines
  const finalLines = [];
  for (let i = 0; i < joined.length; i++) {
    const line = joined[i];
    const prev = finalLines.length ? finalLines[finalLines.length - 1] : null;
    if (prev && /^\s*$/.test(prev) && /^\s*$/.test(line)) continue;
    finalLines.push(line);
  }

  const result = finalLines.join('\n');
  fs.writeFileSync(filePath, result, 'utf8');
  console.log('Cleaned file written. Backup at', backupPath);
}

if (require.main === module) {
  clean();
}
