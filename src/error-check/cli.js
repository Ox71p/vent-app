#!/usr/bin/env node
import { CHECK_KEYS, runChecks } from './runChecks.js';

function parseArgSettings(argv) {
  const settings = { compile: true, type: true, lint: true, test: true };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--no-')) {
      const key = arg.slice(5);
      if (CHECK_KEYS.includes(key)) settings[key] = false;
    }
  }
  return settings;
}

const run = await runChecks({ settings: parseArgSettings(process.argv) });
process.stdout.write(`${JSON.stringify(run, null, 2)}\n`);
