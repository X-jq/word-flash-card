import type { CustomField } from '@/types';

export interface ParsedCardData {
  word: string;
  definition?: string;
  phonetic?: string;
  example?: string;
  root?: string;
  phrases?: string;
  image_url?: string;
  audio_url?: string;
  custom_fields?: CustomField[];
}

/**
 * Parse pasted plain text into card data.
 *
 * Accepted formats:
 * 1. One word per line:
 *    abandon
 *    absolute
 *
 * 2. word|definition (pipe-separated):
 *    abandon|放弃
 *    absolute|绝对的
 *
 * 3. word,definition (comma-separated, when word has no comma):
 *    abandon,放弃
 *
 * 4. word = definition:
 *    abandon = 放弃
 *
 * 5. Multi-line with field labels (key: value):
 *    abandon
 *    释义: 放弃
 *    音标: əˈbændən
 *    例句: He abandoned the ship.
 *
 * Lines starting with # or // are treated as comments and skipped.
 */
export function parsePlainText(text: string): ParsedCardData[] {
  const lines = text.split('\n').map((l) => l.trim());

  // Detect key-value multi-line format
  const labelPattern = /^(释义|定义|meaning|definition|音标|phonetic|例句|example|词根|root|短语|phrases?|同义词|synonym|反义词|antonym)[:：]/i;
  const hasLabels = lines.some((l) => labelPattern.test(l));

  if (hasLabels) {
    return parseMultiLineFormat(lines, labelPattern);
  }

  // Single-line format
  return lines
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('//'))
    .map((line) => parseSingleLine(line))
    .filter((c) => c.word);
}

function parseSingleLine(line: string): ParsedCardData {
  // Try pipe separator first
  if (line.includes('|')) {
    const [word, ...rest] = line.split('|');
    return { word: word.trim(), definition: rest.join('|').trim() };
  }

  // Try tab separator
  if (line.includes('\t')) {
    const [word, ...rest] = line.split('\t');
    return { word: word.trim(), definition: rest.join('\t').trim() };
  }

  // Try equals separator
  const eqIdx = line.indexOf('=');
  if (eqIdx > 0) {
    const word = line.slice(0, eqIdx).trim();
    const def = line.slice(eqIdx + 1).trim();
    if (word && def) return { word, definition: def };
  }

  // Try comma (but not if word itself contains comma)
  if (line.includes(',')) {
    const parts = line.split(',');
    if (parts.length >= 2 && parts[0].trim().length < 50) {
      const word = parts[0].trim();
      const def = parts.slice(1).join(',').trim();
      if (word && def) return { word, definition: def };
    }
  }

  // Just a word
  return { word: line.trim() };
}

const labelMap: Record<string, string> = {
  '释义': 'definition',
  '定义': 'definition',
  'meaning': 'definition',
  'definition': 'definition',
  '音标': 'phonetic',
  'phonetic': 'phonetic',
  '例句': 'example',
  'example': 'example',
  '词根': 'root',
  'root': 'root',
  '短语': 'phrases',
  'phrase': 'phrases',
  'phrases': 'phrases',
  '同义词': 'synonym',
  'synonym': 'synonym',
  '反义词': 'antonym',
  'antonym': 'antonym',
};

function parseMultiLineFormat(
  lines: string[],
  labelPattern: RegExp
): ParsedCardData[] {
  const cards: ParsedCardData[] = [];
  let current: ParsedCardData | null = null;
  let customIdx = 0;

  for (const line of lines) {
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    const match = line.match(labelPattern);
    if (match) {
      if (!current) continue;
      const label = match[1].toLowerCase();
      const value = line.slice(match[0].length).trim();
      const field = labelMap[label] ?? labelMap[match[1]];

      if (field === 'definition') current.definition = value;
      else if (field === 'phonetic') current.phonetic = value;
      else if (field === 'example') current.example = value;
      else if (field === 'root') current.root = value;
      else if (field === 'phrases') current.phrases = value;
      else if (field === 'synonym' || field === 'antonym') {
        current.custom_fields = current.custom_fields ?? [];
        current.custom_fields.push({ label: match[1], value });
      } else {
        current.custom_fields = current.custom_fields ?? [];
        current.custom_fields.push({ label: match[1], value });
      }
    } else {
      // This is a new word entry
      if (current) cards.push(current);
      current = parseSingleLine(line);
      customIdx = 0;
    }
  }

  if (current) cards.push(current);
  return cards.filter((c) => c.word);
}

/**
 * Parse CSV content. Expects at minimum a "word" column.
 * Supported columns: word, definition, phonetic, example, root, phrases
 */
export function parseCSV(text: string): ParsedCardData[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const card: ParsedCardData = { word: '' };

    headers.forEach((header, i) => {
      const value = (values[i] ?? '').trim();
      if (!value) return;

      if (header === 'word' || header === '单词') card.word = value;
      else if (header === 'definition' || header === '释义') card.definition = value;
      else if (header === 'phonetic' || header === '音标') card.phonetic = value;
      else if (header === 'example' || header === '例句') card.example = value;
      else if (header === 'root' || header === '词根') card.root = value;
      else if (header === 'phrases' || header === '短语') card.phrases = value;
      else if (header !== '') {
        card.custom_fields = card.custom_fields ?? [];
        card.custom_fields.push({ label: header, value });
      }
    });

    return card;
  }).filter((c) => c.word);
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Detect file format and parse accordingly.
 */
export function parseFileContent(content: string, fileName: string): ParsedCardData[] {
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return parseCSV(content);
  }

  // For .txt files, try CSV first (if it looks like CSV), otherwise plain text
  const firstLine = content.split('\n')[0] ?? '';
  if (firstLine.includes(',') && firstLine.toLowerCase().includes('word')) {
    return parseCSV(content);
  }

  return parsePlainText(content);
}

/**
 * Parse OCR-recognized text. OCR results may have words mixed with other text.
 * Extracts potential words (English words, or word + definition patterns).
 */
export function parseOCRText(text: string): ParsedCardData[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l);

  const cards: ParsedCardData[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    // Try to extract a word — could be "word" or "word definition" or "word 释义"
    // Remove common OCR artifacts
    const cleaned = line.replace(/[·•·]/g, ' ').replace(/\s+/g, ' ').trim();

    // If the line contains a pipe, tab, or equals, parse as single line
    if (cleaned.includes('|') || cleaned.includes('\t') || cleaned.includes('=')) {
      const card = parseSingleLine(cleaned);
      if (card.word && !seen.has(card.word.toLowerCase())) {
        seen.add(card.word.toLowerCase());
        cards.push(card);
      }
      continue;
    }

    // Try to split English word from Chinese definition
    // Pattern: "abandon 放弃" or "abandon  vt.放弃"
    const match = cleaned.match(/^([a-zA-Z][a-zA-Z\-'\s]*?[a-zA-Z])\s+([\u4e00-\u9fa5\u0400-\u04FF].*)$/);
    if (match) {
      const word = match[1].trim();
      const def = match[2].trim();
      if (word && !seen.has(word.toLowerCase())) {
        seen.add(word.toLowerCase());
        cards.push({ word, definition: def });
      }
      continue;
    }

    // Pure English word (with optional phonetic in brackets)
    const wordMatch = cleaned.match(/^([a-zA-Z][\w\-']*)\s*(?:\[([^\]]+)\])?/);
    if (wordMatch) {
      const word = wordMatch[1];
      const phonetic = wordMatch[2];
      if (word.length >= 2 && !seen.has(word.toLowerCase()) && !isCommonNonWord(word)) {
        seen.add(word.toLowerCase());
        cards.push({ word, phonetic: phonetic ?? '' });
      }
    }
  }

  return cards;
}

function isCommonNonWord(word: string): boolean {
  const lower = word.toLowerCase();
  const nonWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
    'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
    'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy',
    'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use', 'page', 'unit',
    'chapter', 'lesson', 'exercise', 'name', 'class', 'date', 'word', 'list',
    'english', 'chinese', 'vocab', 'vocabulary', 'notes',
  ]);
  return nonWords.has(lower);
}
