// Prompt 27C, Phase 13 — CLIENT LEAKAGE tests 1-5, and Phase 11's own
// dependency-search requirement (runReading / questions/ / kanzulMikban /
// methodParser / methodVerdicts must not appear in any client component's
// source or its lib/raml imports).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', '.data'].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

const RESULT_TABS = readFileSync('components/raml/ResultTabs.tsx', 'utf-8');
const READING_TAB = readFileSync('components/raml/ReadingTab.tsx', 'utf-8');
const METHOD_PRACTICE_FLOW = readFileSync('components/raml/practice/MethodPracticeFlow.tsx', 'utf-8');

// ---------------------------------------------------------------------------
// 1. ResultTabs has no protected-corpus import.
// ---------------------------------------------------------------------------
describe('1: ResultTabs.tsx has no protected-corpus import', () => {
  it('never imports runReading, the engine registry, or the Kanzul corpus', () => {
    expect(RESULT_TABS).not.toMatch(/from ['"]@\/lib\/raml\/engine['"]/);
    expect(RESULT_TABS).not.toMatch(/QUESTION_REGISTRY\b/);
    expect(RESULT_TABS).not.toMatch(/kanzulMikban/);
    expect(RESULT_TABS).not.toMatch(/methodParser|methodVerdicts/);
  });

  it('only imports the public question metadata, never the full registry', () => {
    expect(RESULT_TABS).toMatch(/from ['"]@\/lib\/raml\/questionRegistryMeta['"]/);
  });
});

// ---------------------------------------------------------------------------
// 2. ReadingTab has no protected-corpus import.
// ---------------------------------------------------------------------------
describe('2: ReadingTab.tsx has no protected-corpus import', () => {
  it('never imports runReading, methodVerdicts/methodParser, or the Kanzul corpus', () => {
    expect(READING_TAB).not.toMatch(/from ['"]@\/lib\/raml\/engine['"]/);
    expect(READING_TAB).not.toMatch(/methodParser|methodVerdicts/);
    expect(READING_TAB).not.toMatch(/from ['"]@\/lib\/server\/content\/kanzulMikban['"]/);
  });
});

// ---------------------------------------------------------------------------
// 3. MethodPracticeFlow has no protected-corpus import (also covered from
//    the server-service side in practiceService.test.ts).
// ---------------------------------------------------------------------------
describe('3: MethodPracticeFlow.tsx has no protected-corpus import', () => {
  it('never imports runReading, the engine registry, or a MethodDefinition with a real quote', () => {
    const codeOnly = METHOD_PRACTICE_FLOW.split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');
    expect(METHOD_PRACTICE_FLOW).not.toMatch(/from ['"]@\/lib\/raml\/engine['"]/);
    expect(METHOD_PRACTICE_FLOW).not.toMatch(/QUESTION_REGISTRY\b/);
    expect(codeOnly).not.toMatch(/practicable\.method\.source/);
  });
});

// ---------------------------------------------------------------------------
// 4. runReading is not imported by any client component.
// 5. question modules (the engine's questions/*.ts registry) are not
//    imported by any client component.
// ---------------------------------------------------------------------------
describe('4-5: no client component anywhere imports runReading or the question-module registry', () => {
  it('scans every app/ and components/ client file for a direct import of the engine or its questions registry', () => {
    const offenders: string[] = [];
    for (const file of [...listFilesRecursive('app'), ...listFilesRecursive('components')]) {
      const source = readFileSync(file, 'utf-8');
      if (!source.trimStart().startsWith("'use client'")) continue;
      if (
        /from ['"]@\/lib\/raml\/engine['"]/.test(source) ||
        /from ['"]@\/lib\/raml\/engine\/questions['"]/.test(source) ||
        /from ['"]@\/lib\/raml\/engine\/questions\/index['"]/.test(source)
      ) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
