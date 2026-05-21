# Firestore Security Rules — ARC XP

File: `firestore.rules`

## What these rules enforce

| Collection | Read | Write |
|---|---|---|
| `users/{uid}` | public (leaderboard) | owner only · `points` delta ≤ 500 · `streak`/`gmStreak` may only +1 or reset to 1 · `role`/`isAdmin`/`admin`/`claims` blocked · `uid`/`joinedAt` immutable · admins unrestricted |
| `users/{uid}/xpEvents/{id}` | owner + admin | owner create only · immutable · `points` 0–500 |
| `events/{id}` | public | admin only |
| `events/{id}/rsvps/{uid}` | public | owner only |
| `events/{id}/attendees/{uid}` | public | owner create · admin update/delete |
| `referrals/{invitedUid}` | signed-in | invited user creates once · immutable · admin override |
| `feedback/{id}` | admin | any signed-in user can create (uid must match auth) |
| `admins/{uid}` | self / admin | never writable from client (bootstrap via Firebase console) |
| `abuseLogs/{id}` | admin | append-only by signed-in users |
| anything else | denied | denied |

## How "fake XP / fake streak" is blocked

- A client can't bump `points` by more than the largest legitimate single
  award (`video_speaker = 500`) per write.
- `streak` and `gmStreak` can only stay, increment by 1, or reset to 1, so
  a client cannot jump a streak to 999.
- XP ledger docs under `users/{uid}/xpEvents/` are immutable, so claim
  history cannot be rewritten to hide abuse.
- The admin role lives in `admins/{uid}` and is unreachable from the client,
  so a malicious user cannot self-promote.

> Note: because this app writes to Firestore directly from the browser,
> rules can only *bound* abuse — they cannot prove that a given XP write
> corresponds to real user activity. For server-authoritative XP later,
> move `awardXp`/`claimGM` into a TanStack server function or Cloud
> Function and tighten `users.update` to admin-only on `points`/streak fields.

## Deploy

```bash
# one-time
npm i -g firebase-tools
firebase login
firebase use <your-project-id>

# deploy rules only
firebase deploy --only firestore:rules
```

If you don't have a `firebase.json` yet:

```bash
firebase init firestore
# choose existing project, keep firestore.rules as the rules file
```

## Bootstrap the first admin

1. Sign in to ARC XP at least once so your `users/{uid}` doc exists.
2. In Firebase console → Firestore → start collection `admins`,
   document ID = your Firebase UID, any field (e.g. `addedAt: now`).
3. Reload the app — the Admin tab appears and the rules grant you the
   admin-level write paths above.