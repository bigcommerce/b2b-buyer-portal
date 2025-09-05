#!/usr/bin/env -S node --experimental-strip-types --no-warnings

import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync } from 'fs';

const fileName = 'src/lib/lang/locales/en.json';

const { log } = console;

const locales = JSON.parse(readFileSync(fileName, 'utf-8'));

log('🔍', `Parsed '${fileName}' file with ${Object.keys(locales).length} entries.`);

const data = Object.entries(locales).map(([key, value]) => ({
  VARIABLE: key,
  DEFAULT_VALUE: value,
  CUSTOM_VALUE: '',
}));

const result = stringify(data, {
  columns: ['VARIABLE', 'DEFAULT_VALUE', 'CUSTOM_VALUE'],
  header: true,
});

writeFileSync('dist/translation-template.csv', result);

log('✅', `Written 'translation-template.csv' file with ${data.length} entries.`);
