/// <reference types="bun" />
import { expect, test } from 'bun:test';
import { parseSyncedLyrics } from './parseSyncedLyrics';

// The fraction after the dot is a decimal fraction of a second: LRC (and lrclib) write
// hundredths, some files write tenths or thousandths.
test.each([
  ['[00:12.34] hundredths', 12.34],
  ['[01:02.5] tenths', 62.5],
  ['[00:03.123] thousandths', 3.123],
  ['[00:07] whole seconds', 7],
])('%s starts at %d seconds', (raw, seconds) => {
  expect(parseSyncedLyrics(raw)[0].time).toBeCloseTo(seconds, 6);
});
