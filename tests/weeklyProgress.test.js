// Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyChange, computeWeeklyProgress, describeWeeklyProgress, weekStartOf } from '../src/utils/weeklyProgress.js';

const entries = (rows) => rows.map(([date, weightKg]) => ({ date, weightKg }));

test('weeks start on Monday', () => {
  assert.equal(weekStartOf('2026-11-02'), '2026-11-02'); // Monday
  assert.equal(weekStartOf('2026-11-08'), '2026-11-02'); // Sunday
  assert.equal(weekStartOf('2026-11-09'), '2026-11-09');
});

test('losing weight is improvement only when the goal is to lose', () => {
  assert.equal(classifyChange(-0.5, 'lose'), 'improved');
  assert.equal(classifyChange(-0.5, 'gain'), 'regressed');
  assert.equal(classifyChange(0.5, 'lose'), 'regressed');
  assert.equal(classifyChange(0.5, 'gain'), 'improved');
});

test('tiny changes are steady; maintain uses a band', () => {
  assert.equal(classifyChange(0.05, 'lose'), 'steady');
  assert.equal(classifyChange(0.2, 'maintain'), 'improved');
  assert.equal(classifyChange(-0.6, 'maintain'), 'regressed');
});

test('weekly averages and streaks', () => {
  const p = computeWeeklyProgress(entries([
    ['2026-10-05', 80], ['2026-10-07', 79.6], // avg 79.8
    ['2026-10-12', 79.2], ['2026-10-19', 78.7], ['2026-10-26', 78.1],
  ]), 'lose');
  assert.equal(p.weeks.length, 4);
  assert.ok(Math.abs(p.weeks[0].avgKg - 79.8) < 1e-9);
  assert.deepEqual(p.segments.map((s) => s.status), ['improved', 'improved', 'improved']);
  assert.equal(p.improvedStreak, 3);
  assert.match(describeWeeklyProgress(p, 'metric').body, /3 weeks in a row/);
});

test('skipped weeks are reported as weeks apart', () => {
  const p = computeWeeklyProgress(entries([['2026-10-05', 80], ['2026-10-26', 79]]), 'lose');
  assert.equal(p.latest.weeksApart, 3);
  assert.match(describeWeeklyProgress(p, 'metric').body, /3 weeks ago/);
});

test('needs two weeks before judging', () => {
  assert.equal(computeWeeklyProgress(entries([['2026-10-05', 80]]), 'lose').latest, null);
  assert.equal(describeWeeklyProgress(computeWeeklyProgress([], 'gain'), 'metric').status, 'insufficient');
});

test('ignores bad entries and unknown goals fall back to maintain', () => {
  const p = computeWeeklyProgress([{ date: '2026-10-05', weightKg: 'x' }, { weightKg: 70 }, { date: '2026-10-05', weightKg: 70 }], 'bulk');
  assert.equal(p.goal, 'maintain');
  assert.equal(p.weeks.length, 1);
});
