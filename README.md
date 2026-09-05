# Northstar Exam Lab

A local practice facility for two Microsoft certifications, with 598 original questions and 24 complete case studies.

- **AI-103 — Developing AI Apps and Agents on Azure.** 350 questions across the core bank, a Foundry SDK track, a Copilot Studio track, and 12 case studies.
- **AB-100 — Agentic AI Business Solutions Architect.** 248 architecture and judgment questions across Dynamics 365, Power Platform, Copilot Studio, Microsoft 365 Copilot, and Microsoft Foundry, with 12 case studies.

Switch exams with the **AI-103 / AB-100** control in the top bar. Each exam keeps its own domains, weighting, case studies, session history, and analytics.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local address printed in the terminal (normally `http://localhost:3000`).

## Practice modes

- **Real** delays all correctness feedback until the exam is submitted.
- **Review** explains each answer immediately after it is checked.
- **Full** runs 50 questions in 100 minutes with two case studies.
- **Short** runs 25 questions in 50 minutes with one case study.
- **Case Studies · Full** runs six complete scenario sections (24 questions) in 90 minutes.
- **Case Studies · Short** runs three complete scenario sections (12 questions) in 45 minutes.
- **Foundry SDK · Full** selects 40 of 80 dedicated questions in 70 minutes.
- **Foundry SDK · Short** selects 20 of 80 dedicated questions in 35 minutes.
- **Copilot Studio · Full** selects 24 of 48 dedicated questions in 40 minutes.
- **Copilot Studio · Short** selects 12 of 48 dedicated questions in 20 minutes.

## AB-100 track

AB-100 is a solution-architect exam, so its questions ask for recommendations and design judgment rather than implementation detail: agent suitability, grounding readiness, build-versus-buy, return on investment, Dynamics 365 and Microsoft 365 Copilot configuration, extensibility, application lifecycle management, and governance.

Sessions are weighted to the published domains — Plan 25–30%, Design 25–30%, Deploy 40–45% — and the nine case studies are business scenarios (manufacturing, insurance, retail, health, logistics, banking, public sector, professional services, and utilities) with the same locked-section behavior as the AI-103 cases.

Every one of the 74 published bullets has at least two questions behind it and most have three or more, averaging 3.4, so repeated sessions keep drawing fresh items. Session composition is controlled by the per-domain targets in `components/exam-app.tsx`, not by the bank's own domain split, which is deliberately deeper in Design where the outline has the most bullets.

## Learn Map — open-book navigation

Both exams are associate/expert role-based, so [Microsoft Learn is available during them](https://learn.microsoft.com/credentials/support/exam-duration-exam-experience#accessing-microsoft-learn-during-your-certification-exam) — but **no extra time is added**, the pane opens at the Learn home page every time, and Ctrl+F searches only the current page. At roughly two minutes per question that is a budget of five to eight lookups for the whole exam.

The **Learn Map** screen turns that into something usable. It is generated from the citations the questions already carry, so it cannot drift from the banks:

- **Rules of engagement** and a stated lookup budget.
- **Triage** — look up tables, not concepts. Exact names, limits, and availability are worth the clock; design-judgment questions and anything inside a case study are not.
- **Fast paths** — for each lookup worth making, the page and the exact Ctrl+F term to use on arrival.
- **Documentation trees** ordered by citation count. AI-103 concentrates into 4 trees covering 94% of its citations; AB-100 into 6 covering 87%. Clicking through these while studying is what makes the paths automatic on exam day.

`docs/learn-map.md` is the per-exam study document, and **`docs/exam-reference-map.md`** is the merged master map covering both exams in one structure — the two shared trees first, then each exam's branch, then the tail. That merged view is the one to memorise: both exams start in the same two places.

Regenerate all three with:

```bash
npm run build:learn-map
```

## Glossary

**Glossary** in the nav holds 133 terms, grouped by the documentation tree each belongs to so it and the Learn Map reinforce the same mental model. Each definition is the shortest thing that separates the term from what it gets confused with, and 41 carry an explicit **Not:** line naming that neighbour — `AIProjectClient` against the OpenAI-compatible client, phrase lists against custom speech, Content Understanding pro mode against reasoning-model pro mode.

A filter box searches terms and definitions together, so "residency" finds both `Data residency` and the residency clause inside `Developer deployment`.

`docs/glossary.md` is the same content as a printable reference. The source is `lib/glossary.ts`, maintained by hand.

## Skills-measured references

Every question in every bank cites the objective it tests: the study-guide domain, sub-skill, and bullet, verbatim, plus a Microsoft Learn link for the feature under test. The citation appears once the answer is revealed, never before it, so it cannot narrow the choices while the question is open.

The published outlines are held as data in `lib/ai103-syllabus.ts` (64 bullets) and `lib/ab100-syllabus.ts` (74 bullets). AI-103 citations live in `lib/question-references.ts`; AB-100 citations are inline in `lib/ab100-questions.ts`. **All 64 AI-103 bullets and all 74 AB-100 bullets are covered by at least one question.** The content audit fails if any question lacks a citation, if a cited bullet no longer matches the published outline, if a cited sub-skill does not belong to its domain, or if a documentation link is not a Microsoft Learn URL.

## Claude questions

When AI-103 is selected, the setup screen has an opt-in **Claude questions** checkbox that adds a separate bank of 64 questions to whichever track is selected. The bank is AI-103 only, so the option is hidden for AB-100. It is off by default.

Thirteen of the questions in that bank carry a Python, JavaScript, or C# Foundry SDK listing in the prompt.

The bank targets published objectives the original banks do not reach, including accessibility alt-text generation, Content Understanding pro mode, reasoning directly from audio input, model drift monitoring, and hybrid model-plus-rules-engine orchestration.

The checkbox is unavailable in the Case Studies track because these questions are not part of a case section.

Feedback mode and session length can be combined in any way.

## Objective analytics and focused drilling

Completed sessions record the outcome of every question, so the dashboard reports mastery **per skills-measured objective**, not just per domain — it names the specific bullets you are weakest on rather than saying "Generative AI & agents 62%".

Two focused session types follow from that:

- **Drill my weakest objectives** — draws only from questions testing your eight weakest bullets.
- **Practice what I got wrong** — resurfaces questions you previously answered incorrectly.

A focused session ignores tracks and domain weighting, and says so in a banner on the setup screen with a one-click way to clear it. Focus is session intent, not a saved preference, so it never persists silently across reloads. Attempts recorded before this feature existed still appear in history and are simply excluded from the objective view. Question selection follows the published AI-103 domain weighting and always favors questions not yet selected on this device. Once a pool is exhausted, its least-recently seen questions rotate back in first. A session is reserved as soon as it starts, so leaving midway cannot produce the same batch on the next run. The complete, bounded question-ID history is retained so switching exams or tracks cannot evict useful rotation data.

The dedicated Case Studies track presents each organization as a complete four-question section with background, existing environment, requirements, and constraints. Answers can be reviewed within the current case, but a submitted case is locked and cannot be reopened during that attempt.

The core bank emphasizes Microsoft Foundry, Azure AI Search, Foundry Models deployment types, managed identity and RBAC, Application Insights/OpenTelemetry, Azure AI Content Safety, Azure Speech, Azure Translator, image and video workflows, and Azure Content Understanding. The specialty banks cover Foundry SDK 2.x clients and endpoints, the Responses API, agents, tools, evaluations, tracing, plus Copilot Studio orchestration, knowledge, topics, authentication, governance, evaluation, and ALM. Most questions require an implementation or architecture decision rather than simple service recognition.

Every question names the Azure service, SDK, resource, or configuration surface under test. Answer sets use parallel, plausible Azure configurations so that verbosity does not reveal the key. The automated content audit enforces Azure specificity, unique prompts, balanced answer positions, case completeness, correct-versus-distractor length parity, a valid skills-measured citation with a Microsoft Learn link on every question, and that every explanation engages the wrong options rather than restating the keyed answer.

## Explanations

Every explanation does two jobs: it states the principle that makes the keyed answer correct, and it says why the tempting wrong options fail. Where the options are short and parallel it distinguishes all three; where one option is the clear bait it names that one specifically.

The audit measures this as the share of questions whose explanation uses at least two terms drawn from the wrong options, reported per bank, and fails the build outright on any explanation that engages them not at all. All 598 questions currently pass the engagement gate. Questions whose distractors are permutations of the keyed answer's own words are exempt by rule rather than by allowlist, since the measure is meaningless there.

## Local data

Completed attempts, domain metrics, and recent-question history are stored only in the browser's local storage on the current device. Use **Clear local history** on the Insights dashboard to remove them.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run audit:questions
npm run audit:rotation
npm run build
```

The question bank contains original practice material. It does not contain live exam items or exam dumps.
