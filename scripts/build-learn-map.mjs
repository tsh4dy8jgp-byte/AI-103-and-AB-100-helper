// Builds the Microsoft Learn navigation map from the question banks' citations, so the
// map cannot drift from the questions. Emits lib/learn-map.ts (app data) and
// docs/learn-map.md (study document).
//
//   npm run build:learn-map
import { writeFileSync, mkdirSync } from "node:fs";
// The composed banks from lib/questions.ts, so the map covers exactly what ships.
import { AB100_QUESTIONS, CLAUDE_QUESTIONS, COPILOT_STUDIO_QUESTIONS, CORE_QUESTIONS, FOUNDRY_SDK_QUESTIONS } from "../lib/questions.ts";

const AI103 = [...CORE_QUESTIONS, ...FOUNDRY_SDK_QUESTIONS, ...COPILOT_STUDIO_QUESTIONS, ...CLAUDE_QUESTIONS];

// Friendly names for each documentation tree the banks cite.
const TREE_LABELS = {
  "azure/foundry": "Microsoft Foundry",
  "azure/ai-services": "Azure AI services and Foundry Tools",
  "azure/search": "Azure AI Search",
  "azure/cloud-adoption-framework": "Cloud Adoption Framework",
  "azure/well-architected": "Azure Well-Architected Framework",
  "azure/ai-foundry": "Foundry (classic paths)",
  "azure/storage": "Azure Storage",
  "microsoft-copilot-studio": "Microsoft Copilot Studio",
  "microsoft-365-copilot": "Microsoft 365 Copilot extensibility",
  "microsoft-copilot-service": "Microsoft 365 Copilot for Service",
  "microsoft-sales-copilot": "Microsoft 365 Copilot for Sales",
  "dynamics365": "Dynamics 365",
  "power-platform": "Power Platform",
  "power-apps": "Power Apps",
  "ai-builder": "AI Builder",
  "purview": "Microsoft Purview",
  "agent-framework": "Microsoft Agent Framework",
};

// --- Authored layer: the judgment the generator cannot derive ----------------

export const RULES = [
  "100 minutes, roughly 40 to 60 questions. That is about two minutes per question.",
  "No extra time is added for Learn, and the exam timer keeps running while you read.",
  "Microsoft states that using Learn on every question means you will not finish, by design.",
  "The Learn pane opens at the home page every time. No bookmarks, no history, no sign-in.",
  "Browsing is restricted to learn.microsoft.com. Q&A, Practice Assessments, and your profile are blocked.",
  "Ctrl+F and Command+F find text on the current page only. They are not a site search.",
  "You can open several Learn tabs and keep them open, and you can resize or maximize the pane.",
  "After a break you cannot return to any question you have already seen.",
];

export const BUDGET = "Five to eight lookups across the whole exam. Spend them on facts you cannot derive.";

export const TRIAGE = {
  lookUp: [
    "Exact names from a table: deployment types, Foundry roles, evaluator names, analyzer methods.",
    "Numeric limits: quotas, tokens per minute, service limits, page and size caps.",
    "Availability: which model, feature, or deployment type exists in which region.",
    "Strict API constraints: structured-output rules, supported models for a capability.",
    "Locale and language support for Speech and Translator.",
  ],
  dontLookUp: [
    "Design and judgment questions asking which approach is best. You know the principle or you do not.",
    "Anything inside a case study. The case text is the source and the clock is worst there.",
    "Questions where you have already eliminated two options. Answer, flag, and move on.",
    "Concepts you have never met. Reading an overview cold will cost three minutes and still not decide it.",
  ],
};

export const TAB_STRATEGY =
  "On your first lookup, open your exam's top two tree roots in separate tabs and leave them open. " +
  "Every later lookup then starts one click from the right place instead of from the Learn home page.";

export const DONT_BOTHER = [
  "Overview and 'What is' pages. They define the service without giving you the value you need.",
  "Quickstarts and tutorials. They are step-by-step and never contain the comparison table.",
  "Training modules under /training/. They are long-form learning, not reference.",
  "Anything that needs more than one screen of reading to answer the question.",
  "The certification study guides. You already know the objectives; they hold no product facts.",
];

// Ordered by how often the underlying fact is genuinely worth the clock.
export const FAST_PATHS = [
  { exams: ["ai103", "ab100"], answers: "Which deployment type, and where data is processed", url: "https://learn.microsoft.com/azure/foundry/foundry-models/concepts/deployment-types", title: "Deployment types for Foundry Models", find: "Data Zone" },
  { exams: ["ai103", "ab100"], answers: "Which Foundry role grants what", url: "https://learn.microsoft.com/azure/foundry/concepts/rbac-foundry", title: "Role-based access control for Microsoft Foundry", find: "Project Manager" },
  { exams: ["ai103"], answers: "Quota, rate limits, tokens per minute", url: "https://learn.microsoft.com/azure/foundry/foundry-models/quotas-limits", title: "Foundry Models quotas and limits", find: "tokens per minute" },
  { exams: ["ai103"], answers: "Which model is available in which region", url: "https://learn.microsoft.com/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure-region-availability", title: "Region availability for Foundry Models sold by Azure", find: "the region name" },
  { exams: ["ai103"], answers: "What a model can do, and its context limits", url: "https://learn.microsoft.com/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure", title: "Foundry Models sold by Azure", find: "the model name" },
  { exams: ["ai103"], answers: "Strict structured-output rules", url: "https://learn.microsoft.com/azure/foundry/openai/how-to/structured-outputs", title: "Structured outputs", find: "additionalProperties" },
  { exams: ["ai103"], answers: "Content Understanding limits and pro mode", url: "https://learn.microsoft.com/azure/ai-services/content-understanding/service-limits", title: "Content Understanding service limits", find: "pro mode" },
  { exams: ["ai103"], answers: "Azure AI Search tier limits", url: "https://learn.microsoft.com/azure/search/search-limits-quotas-capacity", title: "Azure AI Search service limits", find: "the tier name" },
  { exams: ["ai103"], answers: "Speech locale and feature support", url: "https://learn.microsoft.com/azure/ai-services/speech-service/language-support", title: "Speech language and voice support", find: "the locale code" },
  { exams: ["ai103", "ab100"], answers: "Which built-in evaluator measures what", url: "https://learn.microsoft.com/azure/foundry/concepts/built-in-evaluators", title: "Built-in evaluators reference", find: "task adherence" },
  { exams: ["ai103", "ab100"], answers: "Which feature exists in which region", url: "https://learn.microsoft.com/azure/foundry/reference/region-support", title: "Foundry feature availability across regions", find: "the feature name" },
  { exams: ["ab100"], answers: "Copilot Studio capacity and message consumption", url: "https://learn.microsoft.com/microsoft-copilot-studio/requirements-messages-management", title: "Copilot Studio capacity and message management", find: "capacity" },
  { exams: ["ab100"], answers: "Which connectors a data policy can block", url: "https://learn.microsoft.com/power-platform/admin/wp-data-loss-prevention", title: "Power Platform data loss prevention policies", find: "connector" },
  { exams: ["ab100"], answers: "Which AI features exist in which Dynamics 365 app", url: "https://learn.microsoft.com/dynamics365/copilot/ai-get-started", title: "Agents, Copilot, and AI capabilities in Dynamics 365", find: "the app name" },
  { exams: ["ab100"], answers: "Which Copilot Studio authentication exposes which variable", url: "https://learn.microsoft.com/microsoft-copilot-studio/configuration-end-user-authentication", title: "Configure user authentication", find: "AccessToken" },
];

// --- Derived layer ----------------------------------------------------------

function treeOf(url) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts.slice(0, parts[0] === "azure" ? 2 : 1).join("/");
}

function buildTrees(questions) {
  const pages = new Map();
  for (const q of questions) {
    const { docUrl, docTitle, bullet } = q.syllabus;
    if (!pages.has(docUrl)) pages.set(docUrl, { url: docUrl, title: docTitle, questions: 0, bullets: new Set() });
    const p = pages.get(docUrl);
    p.questions += 1;
    p.bullets.add(bullet);
  }
  const trees = new Map();
  for (const p of pages.values()) {
    const root = treeOf(p.url);
    if (!trees.has(root)) trees.set(root, { root, label: TREE_LABELS[root] ?? root, questions: 0, pages: [] });
    const t = trees.get(root);
    t.questions += p.questions;
    t.pages.push({ url: p.url, title: p.title, questions: p.questions, bullets: p.bullets.size });
  }
  for (const t of trees.values()) {
    t.rootUrl = `https://learn.microsoft.com/${t.root}/`;
    t.pages.sort((a, b) => b.questions - a.questions || a.title.localeCompare(b.title));
  }
  return [...trees.values()].sort((a, b) => b.questions - a.questions);
}

const EXAMS = [
  { exam: "ai103", code: "AI-103", name: "Developing AI Apps and Agents on Azure", questions: AI103 },
  { exam: "ab100", code: "AB-100", name: "Agentic AI Business Solutions Architect", questions: AB100_QUESTIONS },
];

const built = EXAMS.map((e) => {
  const trees = buildTrees(e.questions);
  const total = e.questions.length;
  let covered = 0;
  const core = [];
  for (const t of trees) { if (covered / total < 0.85) { core.push(t.root); covered += t.questions; } }
  return { ...e, trees, coreTrees: core, coreShare: Math.round((covered / total) * 100) };
});

// --- Emit lib/learn-map.ts --------------------------------------------------

const ts = (v) => JSON.stringify(v, null, 0);
const out = [];
out.push('import type { ExamId } from "./questions";');
out.push("");
out.push("/**");
out.push(" * Microsoft Learn navigation map, generated by scripts/build-learn-map.mjs from the");
out.push(" * citations already carried by every question. Regenerate with:");
out.push(" *");
out.push(" *   npm run build:learn-map");
out.push(" *");
out.push(" * Learn is available during associate and expert role-based exams, but no extra time");
out.push(" * is given, so this map exists to make the handful of lookups you can afford fast.");
out.push(" */");
out.push("export interface LearnPage { url: string; title: string; questions: number; bullets: number; }");
out.push("export interface LearnTree { root: string; rootUrl: string; label: string; questions: number; pages: LearnPage[]; }");
out.push("export interface FastPath { answers: string; url: string; title: string; find: string; }");
out.push("export interface LearnMapExam { code: string; name: string; totalQuestions: number; coreTrees: string[]; coreShare: number; trees: LearnTree[]; fastPaths: FastPath[]; }");
out.push("");
out.push(`export const LEARN_RULES: string[] = ${ts(RULES)};`);
out.push(`export const LEARN_BUDGET = ${ts(BUDGET)};`);
out.push(`export const LEARN_TRIAGE: { lookUp: string[]; dontLookUp: string[] } = ${ts(TRIAGE)};`);
out.push(`export const LEARN_TAB_STRATEGY = ${ts(TAB_STRATEGY)};`);
out.push(`export const LEARN_DONT_BOTHER: string[] = ${ts(DONT_BOTHER)};`);
out.push("");
out.push("export const LEARN_MAP: Record<ExamId, LearnMapExam> = {");
for (const b of built) {
  out.push(`  ${b.exam}: {`);
  out.push(`    code: ${ts(b.code)},`);
  out.push(`    name: ${ts(b.name)},`);
  out.push(`    totalQuestions: ${b.questions.length},`);
  out.push(`    coreTrees: ${ts(b.coreTrees)},`);
  out.push(`    coreShare: ${b.coreShare},`);
  out.push("    trees: [");
  for (const t of b.trees) {
    out.push("      {");
    out.push(`        root: ${ts(t.root)}, rootUrl: ${ts(t.rootUrl)}, label: ${ts(t.label)}, questions: ${t.questions},`);
    out.push("        pages: [");
    for (const p of t.pages) out.push(`          { url: ${ts(p.url)}, title: ${ts(p.title)}, questions: ${p.questions}, bullets: ${p.bullets} },`);
    out.push("        ],");
    out.push("      },");
  }
  out.push("    ],");
  out.push("    fastPaths: [");
  for (const f of FAST_PATHS.filter((f) => f.exams.includes(b.exam)))
    out.push(`      { answers: ${ts(f.answers)}, url: ${ts(f.url)}, title: ${ts(f.title)}, find: ${ts(f.find)} },`);
  out.push("    ],");
  out.push("  },");
}
out.push("};");
out.push("");
writeFileSync("lib/learn-map.ts", out.join("\n"));

// --- Emit docs/learn-map.md -------------------------------------------------

mkdirSync("docs", { recursive: true });
const md = [];
md.push("# Microsoft Learn map for AI-103 and AB-100");
md.push("");
md.push("Generated by `scripts/build-learn-map.mjs` from the citations carried by every question in the banks.");
md.push("Regenerate with `npm run build:learn-map`.");
md.push("");
md.push("## Rules of engagement");
md.push("");
for (const r of RULES) md.push(`- ${r}`);
md.push("");
md.push(`**Lookup budget.** ${BUDGET}`);
md.push("");
md.push("## Triage: look up tables, not concepts");
md.push("");
md.push("**Worth the clock**");
md.push("");
for (const t of TRIAGE.lookUp) md.push(`- ${t}`);
md.push("");
md.push("**Not worth the clock**");
md.push("");
for (const t of TRIAGE.dontLookUp) md.push(`- ${t}`);
md.push("");
md.push("## Tab strategy");
md.push("");
md.push(TAB_STRATEGY);
md.push("");
for (const b of built) {
  md.push(`## ${b.code} — ${b.name}`);
  md.push("");
  md.push(`${b.questions.length} questions cite ${b.trees.reduce((n, t) => n + t.pages.length, 0)} pages across ${b.trees.length} documentation trees. The first ${b.coreTrees.length} carry ${b.coreShare}% of them.`);
  md.push("");
  md.push("### Fast paths");
  md.push("");
  md.push("| Answers | Page | Ctrl+F |");
  md.push("|---|---|---|");
  for (const f of FAST_PATHS.filter((f) => f.exams.includes(b.exam)))
    md.push(`| ${f.answers} | [${f.title}](${f.url}) | \`${f.find}\` |`);
  md.push("");
  md.push("### Trees");
  md.push("");
  for (const t of b.trees) {
    md.push(`#### ${t.label} — \`/${t.root}/\` (${t.questions} questions, ${t.pages.length} pages)`);
    md.push("");
    for (const p of t.pages) md.push(`- [${p.title}](${p.url}) — ${p.questions}q`);
    md.push("");
  }
}
md.push("## Do not bother");
md.push("");
for (const d of DONT_BOTHER) md.push(`- ${d}`);
md.push("");
writeFileSync("docs/learn-map.md", md.join("\n"));

// --- Emit docs/exam-reference-map.md: one merged map across both exams ----------
// Both exams share their two largest trees, so a single merged structure is what is
// actually memorable: learn one territory, then learn which branch each exam takes.
const merged = new Map();
for (const b of built) {
  for (const tree of b.trees) {
    if (!merged.has(tree.root)) merged.set(tree.root, { root: tree.root, label: tree.label, rootUrl: tree.rootUrl, byExam: {}, pages: new Map() });
    const e = merged.get(tree.root);
    e.byExam[b.code] = tree.questions;
    for (const page of tree.pages) {
      if (!e.pages.has(page.url)) e.pages.set(page.url, { ...page, questions: 0 });
      e.pages.get(page.url).questions += page.questions;
    }
  }
}
const mrows = [...merged.values()].map((e) => ({ ...e, total: Object.values(e.byExam).reduce((a, c) => a + c, 0) }))
  .sort((a, b) => b.total - a.total);
const grand = mrows.reduce((n, r) => n + r.total, 0);
const share = (r) => Math.round((r.total / grand) * 100);
// Shared means both exams lean on it heavily; otherwise the tree belongs to whichever
// exam actually dominates it, which is not the same as which exam is exclusive to it.
const balance = (r) => { const a = r.byExam["AI-103"] ?? 0, b = r.byExam["AB-100"] ?? 0;
  const lo = Math.min(a, b), hi = Math.max(a, b);
  return { shared: lo > 0 && lo / hi >= 0.2, owner: a >= b ? "AI-103" : "AB-100" }; };

let run = 0; const tiers = { shared: [], ai103: [], ab100: [], tail: [] };
for (const r of mrows) {
  run += r.total;
  const pct = (run / grand) * 100;
  const { shared, owner } = balance(r);
  if (shared && pct <= 60) tiers.shared.push(r);
  else if (pct <= 90) (owner === "AB-100" ? tiers.ab100 : tiers.ai103).push(r);
  else tiers.tail.push(r);
}

const M = [];
M.push("# The Learn lookup map");
M.push("");
M.push("**Exam AI-103 and Exam AB-100 — one structure for both.**");
M.push("");
M.push("Generated by `scripts/build-learn-map.mjs` from the citation carried by all "
  + `${grand} questions in the banks. Regenerate with \`npm run build:learn-map\`.`);
M.push("");
M.push("---");
M.push("");
M.push("## 1. What you get, and what it costs");
M.push("");
for (const r of RULES) M.push(`- ${r}`);
M.push("");
M.push(`> **Budget: ${BUDGET}**`);
M.push("");
M.push("---");
M.push("");
M.push("## 2. The one decision");
M.push("");
M.push("**Look up tables. Do not look up concepts.**");
M.push("");
M.push("A table has a value you cannot derive and can find in seconds. A concept needs reading you do");
M.push("not have time for, and if you did not know it going in, one screen will not fix that.");
M.push("");
M.push("| Look it up | Answer and move on |");
M.push("|---|---|");
for (let i = 0; i < Math.max(TRIAGE.lookUp.length, TRIAGE.dontLookUp.length); i += 1)
  M.push(`| ${TRIAGE.lookUp[i] ?? ""} | ${TRIAGE.dontLookUp[i] ?? ""} |`);
M.push("");
M.push("---");
M.push("");
M.push("## 3. The map");
M.push("");
M.push(`Seventeen trees hold everything, but **seven carry 90%**. Learn the shape, not the list.`);
M.push("");
const tier = (title, note, rows) => {
  if (!rows.length) return;
  M.push(`### ${title}`);
  M.push("");
  M.push(note);
  M.push("");
  M.push("| Tree | AI-103 | AB-100 | Share |");
  M.push("|---|---:|---:|---:|");
  for (const r of rows)
    M.push(`| **${r.label}** <br>\`/${r.root}/\` | ${r.byExam["AI-103"] ?? "—"} | ${r.byExam["AB-100"] ?? "—"} | ${share(r)}% |`);
  M.push("");
};
tier("Tier 1 — the two shared homes",
  `Both exams live here first. Together these are ${tiers.shared.reduce((n, r) => n + share(r), 0)}% of every citation in the banks. If you only memorise one thing, memorise these two.`,
  tiers.shared);
tier("Tier 2 — the AI-103 branch", "Where AI-103 concentrates: the technical services behind the implementation domains.", tiers.ai103);
tier("Tier 3 — the AB-100 branch", "Where AB-100 concentrates: the business applications and the governance layer.", tiers.ab100);
tier("Tier 4 — the tail", "Recognise these names so you do not waste time hunting. Do not memorise their contents.", tiers.tail);

M.push("---");
M.push("");
M.push("## 4. Fast paths");
M.push("");
M.push("The lookups worth the clock. Open the page, then **Ctrl+F the term in the last column**.");
M.push("");
M.push("| For | Page | Ctrl+F | Exam |");
M.push("|---|---|---|---|");
for (const f of FAST_PATHS)
  M.push(`| ${f.answers} | [${f.title}](${f.url}) | \`${f.find}\` | ${f.exams.map((e) => e === "ai103" ? "AI-103" : "AB-100").join(" · ")} |`);
M.push("");
M.push(`**Tab strategy.** ${TAB_STRATEGY}`);
M.push("");
M.push("---");
M.push("");
M.push("## 5. Do not bother");
M.push("");
for (const d of DONT_BOTHER) M.push(`- ${d}`);
M.push("");
M.push("---");
M.push("");
M.push("## Appendix — every cited page by tree");
M.push("");
M.push("You do not memorise this. It is here so that when a tree turns out to be the right one, you know what is inside it.");
M.push("");
for (const r of mrows) {
  M.push(`### ${r.label} — \`/${r.root}/\``);
  M.push("");
  for (const page of [...r.pages.values()].sort((a, b) => b.questions - a.questions))
    M.push(`- [${page.title}](${page.url})`);
  M.push("");
}
writeFileSync("docs/exam-reference-map.md", M.join("\n"));

console.log(`lib/learn-map.ts, docs/learn-map.md and docs/exam-reference-map.md written`);
console.log(`  master map: ${mrows.length} trees, ${grand} citations, tier1=${tiers.shared.length} tier2=${tiers.ai103.length} tier3=${tiers.ab100.length} tail=${tiers.tail.length}`);
for (const b of built) {
  console.log(`  ${b.code}: ${b.trees.length} trees, ${b.trees.reduce((n, t) => n + t.pages.length, 0)} pages, core ${b.coreTrees.length} = ${b.coreShare}%`);
  console.log(`    core: ${b.coreTrees.join(", ")}`);
}
