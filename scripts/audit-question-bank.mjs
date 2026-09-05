import { ADVANCED_QUESTIONS } from "../lib/advanced-questions.ts";
import { CLAUDE_QUESTIONS } from "../lib/claude-questions.ts";
import { AI103_BULLETS, AI103_SYLLABUS } from "../lib/ai103-syllabus.ts";
import { AB100_BULLETS, AB100_SYLLABUS } from "../lib/ab100-syllabus.ts";
import { AB100_CASE_STUDIES, AB100_QUESTIONS } from "../lib/ab100-questions.ts";
import { withReferences } from "../lib/question-references.ts";
import { LEARN_MAP } from "../lib/learn-map.ts";
import { COPILOT_STUDIO_QUESTIONS as RAW_COPILOT, FOUNDRY_SDK_QUESTIONS as RAW_SDK } from "../lib/specialty-questions.ts";

// Apply references exactly as lib/questions.ts does, so the audit checks what ships.
const coreQuestions = withReferences(ADVANCED_QUESTIONS);
const FOUNDRY_SDK_QUESTIONS = withReferences(RAW_SDK);
const COPILOT_STUDIO_QUESTIONS = withReferences(RAW_COPILOT);
const allQuestions = [...coreQuestions, ...FOUNDRY_SDK_QUESTIONS, ...COPILOT_STUDIO_QUESTIONS, ...CLAUDE_QUESTIONS, ...AB100_QUESTIONS];
const CODE_LANGUAGES = new Set(["python", "javascript", "csharp", "json", "bash"]);
const everySyllabus = [...AI103_SYLLABUS, ...AB100_SYLLABUS];
const syllabusDomainNames = new Map(everySyllabus.map((domain) => [domain.id, domain.domain]));
const syllabusSkills = new Map(everySyllabus.map((domain) => [domain.domain, new Set(domain.skills.map((skill) => skill.skill))]));
const bulletsBySkill = new Map(everySyllabus.flatMap((domain) =>
  domain.skills.map((skill) => [`${domain.domain}||${skill.skill}`, new Set(skill.bullets)]),
));
const ab100Surface = /\b(Azure|Foundry|Copilot Studio|Copilot|Power Platform|Power Apps|Power Automate|Power Pages|Dataverse|Dynamics 365|Microsoft 365|Microsoft Entra|Microsoft Teams|SharePoint|Outlook|Purview|AI Builder|Model Context Protocol|Cloud Adoption Framework|Well-Architected|Center of Excellence|agentic|agents?|models?|prompts?|connectors?|solutions?)\b/i;
const azureSurface = /\b(Azure|Foundry|Copilot Studio|Power Platform|Dataverse|Microsoft Entra|Microsoft Teams|SharePoint|Application Insights|OpenTelemetry|Blob Storage|Content Understanding|Content Safety|Speech SDK|Speech|Translator|AI Search|OpenAI|managed identity|RBAC|private endpoint|Key Vault|Document Intelligence|Model Context Protocol)\b/i;
const giveawayLanguage = /\b(portal theme|browser cache|screenshot|random|without a limit|unlimited|anonymous HTTP|make the .* public|8\.8\.8\.8|single-turn greetings|all project members Owner|Owner on the subscription|only file names|only filenames|sorted alphabetically|Speech MCP|image vector compression|Base64 in the prompt|higher temperature|new Azure subscription|new index for every query)\b/i;

// An explanation must do two jobs: say why the keyed answer is right, and engage the
// wrong options. We measure the second by counting terms that appear in the distractors
// but not in the keyed answer, and then appear in the explanation.
// Flip to true once every question clears the gate.
const ENFORCE_EXPLANATION_ENGAGEMENT = true;
const EXPLANATION_STOP_WORDS = new Set(
  "a an the is are was were be been being to of in on for with and or that this these those which what should must can could would may might how why when where who by from as at it its their your you not no if then than only also them there here each per use used using".split(" "),
);
const explanationTokens = (text) =>
  text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !EXPLANATION_STOP_WORDS.has(word));

function explanationEngagement(question) {
  const keyed = new Set(question.correct.flatMap((index) => explanationTokens(question.options[index])));
  const distractorOnly = new Set();
  question.options.forEach((option, index) => {
    if (question.correct.includes(index)) return;
    for (const word of explanationTokens(option)) if (!keyed.has(word)) distractorOnly.add(word);
  });
  const inExplanation = new Set(explanationTokens(question.explanation));
  let hits = 0;
  for (const word of distractorOnly) if (inExplanation.has(word)) hits += 1;
  return { hits, pool: distractorOnly.size };
}

const failures = [];
const ids = new Set();
const prompts = new Set();
const caseCounts = new Map();
const correctPositions = [0, 0, 0, 0];
let correctIsLongest = 0;
let correctCharacters = 0;
let distractorCharacters = 0;
let correctOptionCount = 0;
let distractorOptionCount = 0;

for (const question of allQuestions) {
  if (ids.has(question.id)) failures.push(`Duplicate ID: ${question.id}`);
  ids.add(question.id);
  if (prompts.has(question.prompt)) failures.push(`Duplicate prompt: ${question.id}`);
  prompts.add(question.prompt);

  const surface = question.exam === "ab100" ? ab100Surface : azureSurface;
  if (!surface.test(question.prompt)) failures.push(`No explicit product surface in prompt: ${question.id}`);
  if (question.options.length !== 4) failures.push(`Expected four options: ${question.id}`);
  if (new Set(question.options).size !== question.options.length) failures.push(`Duplicate option: ${question.id}`);
  if (!question.correct.length || question.correct.some((index) => index < 0 || index >= question.options.length)) {
    failures.push(`Invalid answer key: ${question.id}`);
  }

  const optionLengths = question.options.map((option) => option.length);
  const longest = Math.max(...optionLengths);
  if (question.correct.some((index) => optionLengths[index] === longest)) correctIsLongest += 1;

  question.options.forEach((option, index) => {
    if (question.correct.includes(index)) {
      correctCharacters += option.length;
      correctOptionCount += 1;
      correctPositions[index] += 1;
    } else {
      distractorCharacters += option.length;
      distractorOptionCount += 1;
      if (giveawayLanguage.test(option)) failures.push(`Giveaway distractor in ${question.id}: ${option}`);
    }
  });

  const correctAverage = question.correct.reduce((sum, index) => sum + optionLengths[index], 0) / question.correct.length;
  const distractorLengths = optionLengths.filter((_, index) => !question.correct.includes(index));
  const distractorAverage = distractorLengths.reduce((sum, length) => sum + length, 0) / distractorLengths.length;
  if (question.correct.some((index) => optionLengths[index] === longest) && correctAverage > distractorAverage * 1.2) {
    failures.push(`Correct-answer length cue above 20% in ${question.id}`);
  }

  if (question.caseStudyId) caseCounts.set(question.caseStudyId, (caseCounts.get(question.caseStudyId) ?? 0) + 1);

  // Where the distractors are permutations of the keyed answer's own vocabulary there are
  // almost no distractor-only terms to find, so the measure is meaningless and is skipped.
  const engagement = explanationEngagement(question);
  if (ENFORCE_EXPLANATION_ENGAGEMENT && engagement.pool > 2 && engagement.hits === 0) {
    failures.push(`Explanation never engages the wrong options: ${question.id}`);
  }

  // Every question cites a real, current AI-103 objective so the references shown
  // in the UI cannot drift away from the published study guide.
  const reference = question.syllabus;
  if (!reference) {
    failures.push(`Missing syllabus reference: ${question.id}`);
  } else {
    for (const field of ["domain", "skill", "bullet", "docUrl", "docTitle"]) {
      if (!reference[field]) failures.push(`Empty syllabus.${field} in ${question.id}`);
    }
    const bullets = question.exam === "ab100" ? AB100_BULLETS : AI103_BULLETS;
    if (!bullets.has(reference.bullet)) {
      failures.push(`Syllabus bullet not in the published outline: ${question.id}`);
    }
    if (!syllabusSkills.get(reference.domain)?.has(reference.skill)) {
      failures.push(`Syllabus skill does not belong to its cited domain: ${question.id}`);
    }
    if (!bulletsBySkill.get(`${reference.domain}||${reference.skill}`)?.has(reference.bullet)) {
      failures.push(`Syllabus bullet does not belong to its cited skill: ${question.id}`);
    }
    if (!reference.docUrl?.startsWith("https://learn.microsoft.com/")) {
      failures.push(`Documentation link is not a Microsoft Learn URL: ${question.id}`);
    }
    // The core bank's DomainId is the exam domain. The SDK and Copilot Studio banks
    // use DomainId as a UI area label, so they may legitimately cite another domain.
    if ((!question.collection || question.exam === "ab100") && reference.domain !== syllabusDomainNames.get(question.domain)) {
      failures.push(`Question cites a different domain than "${question.domain}": ${question.id}`);
    }
  }

  if (question.code) {
    if (!CODE_LANGUAGES.has(question.code.language)) failures.push(`Unknown code language in ${question.id}: ${question.code.language}`);
    if (!question.code.snippet?.trim()) failures.push(`Empty code snippet: ${question.id}`);
    if (question.source !== "claude") failures.push(`Code sample on a non-Claude question: ${question.id}`);
  }
}

if (coreQuestions.length < 150) failures.push(`Core question bank is too small: ${coreQuestions.length}`);
if (FOUNDRY_SDK_QUESTIONS.length < 80) failures.push(`Foundry SDK bank must contain at least 80 questions: ${FOUNDRY_SDK_QUESTIONS.length}`);
if (COPILOT_STUDIO_QUESTIONS.length < 48) failures.push(`Copilot Studio bank must contain at least 48 questions: ${COPILOT_STUDIO_QUESTIONS.length}`);
if (CLAUDE_QUESTIONS.length < 55) failures.push(`Claude bank is too small: ${CLAUDE_QUESTIONS.length}`);
if (CLAUDE_QUESTIONS.some((question) => question.caseStudyId)) failures.push("Claude questions cannot belong to a case study");
if (caseCounts.size < 21) failures.push(`Fewer than 21 case studies across both exams: ${caseCounts.size}`);
if (AB100_QUESTIONS.length < 230) failures.push(`AB-100 bank is too small: ${AB100_QUESTIONS.length}`);
if (Object.keys(AB100_CASE_STUDIES).length < 12) failures.push(`AB-100 needs at least 12 case studies: ${Object.keys(AB100_CASE_STUDIES).length}`);
for (const question of AB100_QUESTIONS) {
  if (!question.domain.startsWith("ab-")) failures.push(`AB-100 question has an AI-103 domain: ${question.id}`);
  if (question.exam !== "ab100") failures.push(`AB-100 question is not tagged with its exam: ${question.id}`);
}
for (const [caseId, count] of caseCounts) {
  if (count !== 4) failures.push(`Case ${caseId} has ${count} questions instead of 4`);
}

const longestRate = correctIsLongest / allQuestions.length;
if (longestRate > 0.25) failures.push(`Correct option is longest in ${(longestRate * 100).toFixed(1)}% of questions`);

const meanCorrectLength = correctCharacters / correctOptionCount;
const meanDistractorLength = distractorCharacters / distractorOptionCount;
const meanLengthRatio = meanCorrectLength / meanDistractorLength;
if (meanLengthRatio < 0.85 || meanLengthRatio > 1.15) {
  failures.push(`Mean correct/distractor length ratio is ${meanLengthRatio.toFixed(2)}`);
}

const positionTotal = correctPositions.reduce((sum, count) => sum + count, 0);
for (const [index, count] of correctPositions.entries()) {
  const share = count / positionTotal;
  if (share < 0.15 || share > 0.35) failures.push(`Correct position ${index} is imbalanced at ${(share * 100).toFixed(1)}%`);
}

const collectionMetrics = Object.fromEntries([
  ["core", coreQuestions],
  ["foundrySdk", FOUNDRY_SDK_QUESTIONS],
  ["copilotStudio", COPILOT_STUDIO_QUESTIONS],
  ["claude", CLAUDE_QUESTIONS],
  ["ab100", AB100_QUESTIONS],
].map(([name, bank]) => {
  let longestCount = 0;
  let bankCorrectCharacters = 0;
  let bankDistractorCharacters = 0;
  let bankCorrectCount = 0;
  let bankDistractorCount = 0;
  for (const question of bank) {
    const lengths = question.options.map((option) => option.length);
    const longest = Math.max(...lengths);
    if (question.correct.some((index) => lengths[index] === longest)) longestCount += 1;
    question.options.forEach((option, index) => {
      if (question.correct.includes(index)) {
        bankCorrectCharacters += option.length;
        bankCorrectCount += 1;
      } else {
        bankDistractorCharacters += option.length;
        bankDistractorCount += 1;
      }
    });
  }
  let engaged = 0;
  let unscoreable = 0;
  for (const question of bank) {
    const engagement = explanationEngagement(question);
    if (engagement.pool <= 2) unscoreable += 1;
    else if (engagement.hits >= 2) engaged += 1;
  }
  const bankLongestRate = longestCount / bank.length;
  const bankLengthRatio = (bankCorrectCharacters / bankCorrectCount) / (bankDistractorCharacters / bankDistractorCount);
  if (bankLongestRate > 0.25) failures.push(`${name} correct option is longest in ${(bankLongestRate * 100).toFixed(1)}% of questions`);
  if (bankLengthRatio < 0.85 || bankLengthRatio > 1.15) failures.push(`${name} correct/distractor length ratio is ${bankLengthRatio.toFixed(2)}`);
  const scoreable = bank.length - unscoreable;
  return [name, {
    questions: bank.length,
    correctIsLongest: `${longestCount}/${bank.length} (${(bankLongestRate * 100).toFixed(1)}%)`,
    meanLengthRatio: Number(bankLengthRatio.toFixed(2)),
    explanationsEngageWrongOptions: `${engaged}/${scoreable} (${((engaged / scoreable) * 100).toFixed(0)}%)`,
  }];
}));

// The Learn map is generated from these citations, so it must stay consistent with them.
const citedPages = new Set(allQuestions.map((question) => question.syllabus?.docUrl));
// A page cited by both exams appears in both maps, so compare the union, not the sum.
const mappedPages = new Set();
for (const [exam, map] of Object.entries(LEARN_MAP)) {
  for (const tree of map.trees) {
    for (const page of tree.pages) {
      mappedPages.add(page.url);
      if (!citedPages.has(page.url)) failures.push(`Learn map page is not cited by any question (${exam}): ${page.url}`);
    }
  }
  for (const path of map.fastPaths) {
    if (!path.url.startsWith("https://learn.microsoft.com/")) failures.push(`Fast path is not a Microsoft Learn URL (${exam}): ${path.url}`);
    if (!path.find?.trim()) failures.push(`Fast path has no search term (${exam}): ${path.url}`);
  }
  if (!map.coreTrees.length) failures.push(`Learn map has no core trees for ${exam}`);
  if (map.coreShare < 80) failures.push(`Learn map core trees cover only ${map.coreShare}% for ${exam}`);
}
for (const url of citedPages) {
  if (!mappedPages.has(url)) failures.push(`Cited page missing from the Learn map: ${url}`);
}

// Two questions that can be drawn into the same session must not be near-restatements
// of each other. Questions in different selection pools never co-occur, so they are
// compared only within their pool.
const SIMILARITY_LIMIT = 0.5;
const selectionPool = (question) => {
  if ((question.exam ?? "ai103") === "ab100") return "ab100";
  if (question.collection === "sdk" || question.collection === "copilot") return `ai103-${question.collection}`;
  return "ai103-core";
};
const promptTerms = (question) => new Set(
  question.prompt.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !EXPLANATION_STOP_WORDS.has(w)),
);
const byPool = new Map();
for (const question of allQuestions) {
  const pool = selectionPool(question);
  if (!byPool.has(pool)) byPool.set(pool, []);
  byPool.get(pool).push({ id: question.id, terms: promptTerms(question) });
}
let closestPair = { score: 0, pair: "none" };
for (const [pool, entries] of byPool) {
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const a = entries[i].terms, b = entries[j].terms;
      const shared = [...a].filter((w) => b.has(w)).length;
      const score = shared / (a.size + b.size - shared);
      if (score > closestPair.score) closestPair = { score, pair: `${entries[i].id} / ${entries[j].id}` };
      if (score >= SIMILARITY_LIMIT) {
        failures.push(`Near-duplicate prompts in the same ${pool} pool (${score.toFixed(2)}): ${entries[i].id} and ${entries[j].id}`);
      }
    }
  }
}

const report = {
  questions: allQuestions.length,
  collections: {
    core: coreQuestions.length,
    foundrySdk: FOUNDRY_SDK_QUESTIONS.length,
    copilotStudio: COPILOT_STUDIO_QUESTIONS.length,
    claude: CLAUDE_QUESTIONS.length,
    ab100: AB100_QUESTIONS.length,
  },
  collectionMetrics,
  uniquePrompts: prompts.size,
  explicitAzurePrompts: allQuestions.filter((question) => azureSurface.test(question.prompt)).length,
  caseStudies: caseCounts.size,
  claudeWithCode: CLAUDE_QUESTIONS.filter((question) => question.code).length,
  questionsWithReference: allQuestions.filter((question) => question.syllabus).length,
  ai103BulletsCited: `${new Set(allQuestions.filter((question) => question.exam !== "ab100").map((question) => question.syllabus?.bullet)).size}/${AI103_BULLETS.size}`,
  ab100BulletsCited: `${new Set(AB100_QUESTIONS.map((question) => question.syllabus?.bullet)).size}/${AB100_BULLETS.size}`,
  documentationLinks: citedPages.size,
  learnMap: Object.fromEntries(Object.entries(LEARN_MAP).map(([exam, map]) => [exam, {
    trees: map.trees.length,
    coreTrees: `${map.coreTrees.length} covering ${map.coreShare}%`,
    pages: map.trees.reduce((n, tree) => n + tree.pages.length, 0),
    fastPaths: map.fastPaths.length,
  }])),
  questionsPerCase: Object.fromEntries([...caseCounts].sort()),
  correctIsLongest: `${correctIsLongest}/${allQuestions.length} (${(longestRate * 100).toFixed(1)}%)`,
  meanCorrectCharacters: Number(meanCorrectLength.toFixed(1)),
  meanDistractorCharacters: Number(meanDistractorLength.toFixed(1)),
  meanLengthRatio: Number(meanLengthRatio.toFixed(2)),
  closestPromptPair: `${closestPair.pair} at ${closestPair.score.toFixed(2)} (limit ${SIMILARITY_LIMIT})`,
  correctPositions,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`\nQuestion-bank audit failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("\nQuestion-bank audit passed.");
}
