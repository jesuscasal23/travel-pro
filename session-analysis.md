# Claude Code Session Analysis

**Scanned:** 339 sessions, 1,979 genuine user messages
**Projects:** travel-pro, superscale, next-arch-map, finance, Desktop (misc)
**Date:** 2026-03-29

---

## 1. SKILLS — Repeatable creative tasks to trigger manually

| #   | Description                                                                       | Freq           | Sessions | Source IDs                             | Recommended                                                                            |
| --- | --------------------------------------------------------------------------------- | -------------- | -------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | **Commit + push to remote** — "commit and push" is the single most common command | 92             | 68       | 70b8d515, 72709b7c, 664e7fe1, 3be18be2 | SKILL: `/ship` — commit, push, optionally create PR in one shot                        |
| 2   | **Create a pull request** — branch, push, `gh pr create` with summary             | 58             | 42       | 70b8d515, 664e7fe1, 9fdd7d29, afe4dee5 | SKILL: `/pr` (already exists, used 4x)                                                 |
| 3   | **Create Linear ticket** — file a bug/feature from context                        | 30             | 27       | 6108530a, 70b8d515, 3be18be2, 7eff0e30 | SKILL: `/ticket` — create Linear issue with project=Travel Pro, auto-link code context |
| 4   | **Investigate Linear ticket** — read ticket, explore code, propose fix            | 18             | 14       | 3be18be2, 664e7fe1, ff2dee54, 806cb216 | SKILL: `/investigate TRA-XX` — fetch ticket, grep codebase, propose plan               |
| 5   | **Simplify / refactor code** — reduce complexity in a module                      | 5+4            | 5+4      | 5a84e852, e14a5813, 102f3384, a577dab8 | SKILL: `/simplify` (already exists)                                                    |
| 6   | **Grill me on a plan** — stress-test a design decision                            | 10 invocations | 5        | 75d52c61, 9fdd7d29, 7eff0e30           | SKILL: `/grill-me` (already exists, most-used skill)                                   |
| 7   | **Bump version + changelog** — collect commits, categorize, write changelog       | 3              | 2        | b89a0c0d, da62a00a                     | SKILL: `/draft-changelog` (already exists, used 2x)                                    |
| 8   | **Generate/update API docs** — sync route handlers to docs                        | 4              | 4        | 9c535fa5, 7eff0e30, 9b090a9c, 1a7c04b0 | SKILL: `/api-docs` + `/api-overview` (already exist)                                   |
| 9   | **Implement design from Figma** — fetch Figma node, generate code                 | 5              | 5        | 767b5351, 5051f353, 13b1851b, ef6d17a4 | SKILL: `/figma-implement-design` (already exists)                                      |
| 10  | **Compare implementation to Figma** — pixel-perfect audit                         | 2              | 2        | 767b5351, 5051f353                     | SKILL: new `/figma-diff` — screenshot both, compare side-by-side                       |
| 11  | **Write a PRD** — interview + codebase exploration + Linear ticket                | 3 invocations  | 1        | 27044de7                               | SKILL: `/write-a-prd` (already exists)                                                 |

---

## 2. AGENTS — Autonomous research or action workflows

| #   | Description                                                                                | Freq | Sessions | Source IDs                             | Recommended                                                                     |
| --- | ------------------------------------------------------------------------------------------ | ---- | -------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | **Check Vercel/prod logs for errors** — pull logs, diagnose, propose fix                   | 21   | 14       | 72709b7c, 0af03d85, 56876cd2, fb109de1 | AGENT: `/diagnose-prod` — fetch Vercel logs, correlate with Sentry, propose fix |
| 2   | **Debug from screenshot** — user pastes screenshot of error/UI                             | ~50+ | 30+      | 70b8d515, e91b51a0, f79cef68           | AGENT: already works well, no change needed                                     |
| 3   | **Explore/audit entire codebase** — find improvements, dead code, simplify                 | 6+2  | 5+2      | e14a5813, 379783a0, 68562a35           | AGENT: `/audit` — run knip + architecture review + dead code scan in parallel   |
| 4   | **Fix build/type errors** — diagnose CI failure, fix types                                 | 4    | 4        | fb109de1, e91b51a0, bc662e90, 6dae0ca9 | AGENT: `/fix-build` — run `npm run typecheck`, parse errors, fix in loop        |
| 5   | **E2e test creation + debugging** — write Playwright tests, handle auth                    | 13   | 8        | 664e7fe1, 8fd343db, 4a23157e           | AGENT: `/e2e TRA-XX` — scaffold test from ticket, handle auth, run until green  |
| 6   | **List open PRs + push stale PRs** — used via `/list-open-prs` (13x) and `/push-prs` (10x) | 23   | ~15      | various                                | AGENT: already works as skills, could merge into `/pr-dashboard`                |

---

## 3. SCHEDULED TASKS — Recurring things to automate

| #   | Description                                                                      | Freq | Sessions | Evidence                     | Recommended                                                                                           |
| --- | -------------------------------------------------------------------------------- | ---- | -------- | ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | **Vercel error monitoring** — you check prod logs reactively in 14 sessions      | 21   | 14       | 72709b7c, 0af03d85, 56876cd2 | SCHEDULED: daily morning check — pull Vercel errors from last 24h, file Linear tickets for new issues |
| 2   | **Dead code / unused export scan** — triggered manually every few weeks          | 2    | 2        | 379783a0, 98181473           | SCHEDULED: weekly — run `knip`, report new unused exports                                             |
| 3   | **Linear ticket hygiene** — you frequently check if tickets are still valid      | 18   | 14       | ff2dee54, 3be18be2, 70b8d515 | SCHEDULED: weekly — list open TRA-\* tickets, flag stale ones (>2 weeks untouched)                    |
| 4   | **Dependency / security audit** — not seen explicitly but implied by build fixes | —    | —        | —                            | SCHEDULED: weekly — `npm audit`, flag critical CVEs                                                   |
| 5   | **API docs drift detection** — you update docs manually, could auto-detect       | 4    | 4        | 9c535fa5, 7eff0e30           | SCHEDULED: on-push hook — compare route handlers vs docs/api.md, warn if out of sync                  |

---

## 4. CLAUDE.MD — Repeated preferences or context to bake in

| #   | Preference / Rule                                                                                                             | Freq     | Sessions | Evidence                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | --------------------------------------------------------- |
| 1   | **Always set Linear project to "Travel Pro"**                                                                                 | 30+      | 27       | Already in memory — `feedback_linear_project.md`          |
| 2   | **"commit and push" is the default ship action** — you say this 92 times across 68 sessions; make it a single `/ship` command | 92       | 68       | Most common user message pattern                          |
| 3   | **Bottom nav must always be visible** — never scroll out of view on mobile                                                    | 1        | 1        | f79cef68: "navigation should always be visible"           |
| 4   | **Flight data should always be fetched fresh** — no caching                                                                   | 1        | 1        | b0fbf010: "remove the caching... always be fetched fresh" |
| 5   | **Activities must always have images** — don't show activities without images                                                 | 2        | 2        | de68e2c5, b2db5595                                        |
| 6   | **Never introduce hallucinations in docs** — manual review before doc changes                                                 | 1        | 1        | 7eff0e30: "never made worse... no hallucinations"         |
| 7   | **Logo aspect ratios must never be compromised** — always preserve original ratio                                             | 1        | 1        | a24ccff8 (superscale project)                             |
| 8   | **Don't summarize at end of responses** — user can read the diff                                                              | implicit | —        | You're terse; this is working                             |
| 9   | **When creating tickets, auto-link to relevant code files**                                                                   | 30       | 27       | Every ticket creation includes code investigation         |
| 10  | **Prefer one bundled commit over many small ones** for a single feature                                                       | implicit | —        | Pattern: you do all work then "commit and push" once      |

---

## Top Skills Already Installed (by usage)

| Skill                            | Invocations |
| -------------------------------- | ----------- |
| `/list-open-prs`                 | 13          |
| `/grill-me`                      | 10          |
| `/push-prs`                      | 10          |
| `/improve-codebase-architecture` | 4           |
| `/pr`                            | 4           |
| `/write-a-prd`                   | 3           |
| `/draft-changelog`               | 2           |
| `/api-overview`                  | 2           |
| `/implement-design`              | 2           |
| `/review-pr`                     | 1           |
| `/webapp-testing`                | 1           |

---

## Gaps — Things you do often but have no skill/automation for

| Gap                        | What you do now                                       | Recommendation                                                       |
| -------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| **Ship workflow**          | Type "commit and push" 92 times                       | Create `/ship` skill: commit + push + optionally create PR           |
| **Prod error triage**      | Manually ask to pull Vercel logs (14 sessions)        | Scheduled agent: daily Vercel + Sentry log scan                      |
| **Linear ticket from bug** | Describe bug → ask to create ticket (27 sessions)     | Create `/bug` skill: screenshot → diagnose → file ticket             |
| **Investigate ticket**     | "investigate TRA-XX" (14 sessions)                    | Create `/investigate` skill: fetch ticket → grep code → propose plan |
| **Figma pixel diff**       | Manually compare Figma vs implementation (2 sessions) | Create `/figma-diff` skill                                           |
