import test from 'node:test';
import assert from 'node:assert/strict';
import { collectLiftHistory, computeStrengthProgress, estimateOneRepMax, findPersonalRecords, formatLiftSet } from '../src/utils/strengthProgress.js';

const workout = (date, lifts) => ({ date, title: 'Push', durationMin: 45, lifts });

test('Epley estimated 1RM', () => {
  assert.equal(estimateOneRepMax(100, 1), 100);
  assert.ok(Math.abs(estimateOneRepMax(100, 5) - 116.667) < 0.01);
  assert.equal(estimateOneRepMax(0, 10), 0);
});

test('groups lifts by exercise name, case-insensitively, keeping the best set per day', () => {
  const history = collectLiftHistory([
    workout('2026-10-05', [{ name: 'Bench Press', weightKg: 80, reps: 5 }, { name: 'bench press ', weightKg: 85, reps: 3 }]),
    workout('2026-10-12', [{ name: 'Bench press', weightKg: 82.5, reps: 5 }, { name: 'Pull-up', weightKg: 0, reps: 10 }]),
  ]);
  assert.equal(history[0].key, 'bench press');
  assert.equal(history[0].sessions.length, 2);
  assert.equal(history[0].sessions[0].best.weightKg, 85); // 85×3 beats 80×5
  const pullups = history.find((e) => e.key === 'pull-up');
  assert.equal(pullups.mode, 'reps');
});

test('weekly strength trend marks improvement and dips', () => {
  const [bench] = collectLiftHistory([
    workout('2026-10-05', [{ name: 'Bench', weightKg: 80, reps: 5 }]),
    workout('2026-10-12', [{ name: 'Bench', weightKg: 85, reps: 5 }]),
    workout('2026-10-19', [{ name: 'Bench', weightKg: 80, reps: 5 }]),
    workout('2026-10-26', [{ name: 'Bench', weightKg: 80, reps: 5 }]),
  ]);
  const p = computeStrengthProgress(bench);
  assert.deepEqual(p.segments.map((s) => s.status), ['improved', 'regressed', 'steady']);
  assert.equal(p.best.best.weightKg, 85);
});

test('personal records only when beating every past session', () => {
  const past = [workout('2026-10-05', [{ name: 'Squat', weightKg: 100, reps: 5 }])];
  assert.equal(findPersonalRecords(past, workout('2026-10-12', [{ name: 'Squat', weightKg: 100, reps: 5 }])).length, 0);
  const prs = findPersonalRecords(past, workout('2026-10-12', [{ name: 'squat', weightKg: 100, reps: 6 }]));
  assert.equal(prs.length, 1);
  assert.equal(prs[0].name, 'squat');
  // first time ever logging a lift isn't a PR
  assert.equal(findPersonalRecords(past, workout('2026-10-12', [{ name: 'Deadlift', weightKg: 140, reps: 3 }])).length, 0);
});

test('formats sets in the user units', () => {
  assert.equal(formatLiftSet({ weightKg: 102.058, reps: 5 }, 'imperial'), '225 lb × 5');
  assert.equal(formatLiftSet({ weightKg: 100, reps: 5 }, 'metric'), '100 kg × 5');
  assert.equal(formatLiftSet({ weightKg: 0, reps: 12 }, 'metric'), '12 reps');
});
