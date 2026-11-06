# OneHealth

Expo / React Native health app: meal logging, workouts, steps, weight and an AI coach (Eugene).

## Run it

```bash
npm install
cp .env.example .env     # add your OPENAI_API_KEY
npm start                # starts the API server + Expo
npm test                 # unit tests for the progress math (no install needed beyond Node 22)
```

## Progress features

- **Weekly progress** (Progress tab): each week's average weigh-in, graded against the goal chosen at
  onboarding — losing is good for *Lose weight*, gaining is good for *Gain muscle*, staying within
  ~0.5 lb is good for *Maintain*. Green = toward goal, red = away, grey = little change.
- **Strength progress**: add lifts (exercise, weight, reps, sets) when logging a workout. The chart shows
  your best set each week as an estimated 1-rep max (Epley), and new personal records are celebrated.
- **Notifications** (toggle: Settings → *Progress alerts*): one notice when a week is an improvement and
  one when it slips (at most once each per week), plus a notice for new PRs.

## Where things live

| Path | What |
| --- | --- |
| `src/utils/weeklyProgress.js` | weekly weight grading + messages |
| `src/utils/strengthProgress.js` | lift history, e1RM, PR detection |
| `src/utils/progressMath.js` | calories/day, activity level, maintenance, projection |
| `src/utils/stepCounter.js` | steps on iOS and Android |
| `src/utils/notifications.js` | local notifications + reminder scheduling |
| `src/components/progress/` | the Progress tab's cards |
| `tests/` | `node:test` unit tests for the pure utils |

## Known limits

- **Data stays on the device** (AsyncStorage). There's no account, sync or backup yet.
- **Android steps** are only counted while the app is open; all-day steps need Health Connect
  (`react-native-health-connect` + a development build).
- **Notifications are local**, so weekly progress notices go out when the app is opened, not on a
  server schedule.
