#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { json2csv } from 'json-2-csv';
import path from 'path';

const file = readFileSync(path.resolve('./src/lib/lang/locales/en.json'), 'utf-8');

const locales = JSON.parse(file);

const data = Object.entries(locales).map(([key, value]) => ({
  VARIABLE: key,
  DEFAULT_VALUE: value,
  CUSTOM_VALUE: '',
}));

const headers = ['VARIABLE', 'DEFAULT_VALUE', 'CUSTOM_VALUE'];

const result = json2csv(data, {
  sortHeader: (a, b) => headers.indexOf(a) - headers.indexOf(b),
});

writeFileSync('dist/translation-template.csv', result);
