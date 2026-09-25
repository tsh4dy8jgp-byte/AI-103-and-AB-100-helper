import { AI103_BULLETS, AI103_SYLLABUS } from "../lib/ai103-syllabus.ts";
import { AB100_BULLETS, AB100_SYLLABUS } from "../lib/ab100-syllabus.ts";
import { LEARN_MAP } from "../lib/learn-map.ts";
import { itemFormat } from "../lib/session-composer.ts";
// Import the composed banks from lib/questions.ts, so the audit checks exactly what ships.
import {
  AB100_CASE_STUDIES,
  AB100_QUESTIONS,
  CASE_STUDIES,
  CLAUDE_QUESTIONS,
  COPILOT_STUDIO_QUESTIONS,
  CORE_QUESTIONS as coreQuestions,
  FOUNDRY_SDK_QUESTIONS,
} from "../lib/questions.ts";

const allQuestions = [...coreQuestions, ...FOUNDRY_SDK_QUESTIONS, ...COPILOT_STUDIO_QUESTIONS, ...CLAUDE_QUESTIONS, ...AB100_QUESTIONS];
const isChoice = (question) => !question.type || question.type === "choice";
/** The text a student reads before answering: the prompt, plus a dropdown's template. */
const questionText = (question) => (question.type === "dropdown" ? `${question.prompt} ${question.template}` : question.prompt);
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

/** Keyed and distractor texts for any format: unused tiles and wrong list options are distractors. */
function answerTexts(question) {
  if (question.type === "dragdrop") {
    const keyed = new Set(question.correct);
    return { keyed: [...keyed].map((index) => question.tiles[index]), distractors: question.tiles.filter((_, index) => !keyed.has(index)) };
  }
  if (question.type === "dropdown") {
    return {
      keyed: question.blanks.map((options, blank) => options[question.correct[blank]]),
      distractors: question.blanks.flatMap((options, blank) => options.filter((_, index) => index !== question.correct[blank])),
    };
  }
  return {
    keyed: question.correct.map((index) => question.options[index]),
    distractors: question.options.filter((_, index) => !question.correct.includes(index)),
  };
}

function explanationEngagement(question) {
  const texts = answerTexts(question);
  const keyed = new Set(texts.keyed.flatMap((text) => explanationTokens(text)));
  const distractorOnly = new Set();
  texts.distractors.forEach((text) => {
    for (const word of explanationTokens(text)) if (!keyed.has(word)) distractorOnly.add(word);
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
/** Keyed-answer positions, grouped by how many choices the student sees. */
const correctPositions = { 4: [0, 0, 0, 0], 5: [0, 0, 0, 0, 0] };
const blankPositions = new Map();
const formatCounts = { ai103: {}, ab100: {} };
let correctIsLongest = 0;
let correctCharacters = 0;
let distractorCharacters = 0;
let correctOptionCount = 0;
let distractorOptionCount = 0;


// Where the distractors are permutations of the keyed answer's own vocabulary there are
// almost no distractor-only terms to find, so the engagement measure is skipped.

// Every question cites a real, current objective so the references shown in the UI
// cannot drift away from the published study guide.
function checkReference(question) {
  const reference = question.syllabus;
  if (!reference) {
    failures.push(`Missing syllabus reference: ${question.id}`);
    return;
  }
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

function checkDragDrop(question) {
  const { id, targets, tiles, correct } = question;
  if (targets.length < 2 || targets.length > 6) failures.push(`Drag-and-drop needs two to six targets: ${id}`);
  if (correct.length !== targets.length) failures.push(`Drag-and-drop key does not cover every target: ${id}`);
  if (new Set(tiles).size !== tiles.length) failures.push(`Duplicate drag-and-drop tile: ${id}`);
  if (new Set(targets).size !== targets.length) failures.push(`Duplicate drag-and-drop target: ${id}`);
  if (correct.some((index) => !Number.isInteger(index) || index < 0 || index >= tiles.length)) failures.push(`Invalid drag-and-drop key: ${id}`);
  const keyed = new Set(correct);
  if (!question.reuse && keyed.size !== correct.length) failures.push(`A tile is keyed twice without reuse: ${id}`);
  if (question.reuse && keyed.size === correct.length) failures.push(`Reuse is set but no tile is keyed twice: ${id}`);
  if (tiles.length - keyed.size < 1) failures.push(`Drag-and-drop pool has no distractor tile: ${id}`);
  if (question.ordered && question.reuse) failures.push(`An ordered item cannot reuse tiles: ${id}`);
  // Tile order must not reveal the answer order.
  if (question.ordered && correct.every((value, index) => index === 0 || value > correct[index - 1])) {
    failures.push(`Ordered tiles are shown in answer order: ${id}`);
  }
}

function checkDropdown(question) {
  const { id, template, blanks, correct } = question;
  const placeholders = [...template.matchAll(/\{(\d+)\}/g)].map((match) => Number(match[1]));
  if (blanks.length < 2 || blanks.length > 4) failures.push(`Dropdown needs two to four blanks: ${id}`);
  if (placeholders.length !== blanks.length || placeholders.some((value, index) => value !== index)) {
    failures.push(`Dropdown placeholders must be {0}..{n-1}, each once and in order: ${id}`);
  }
  if (correct.length !== blanks.length) failures.push(`Dropdown key does not cover every blank: ${id}`);
  blanks.forEach((options, blank) => {
    if (options.length < 3 || options.length > 5) failures.push(`Dropdown blank ${blank + 1} needs three to five options: ${id}`);
    if (new Set(options).size !== options.length) failures.push(`Duplicate option in dropdown blank ${blank + 1}: ${id}`);
    const key = correct[blank];
    if (!Number.isInteger(key) || key < 0 || key >= options.length) {
      failures.push(`Invalid dropdown key in blank ${blank + 1}: ${id}`);
      return;
    }
    const size = options.length;
    if (!blankPositions.has(size)) blankPositions.set(size, Array(size).fill(0));
    blankPositions.get(size)[key] += 1;
    const lengths = options.map((option) => option.length);
    if (lengths[key] === Math.max(...lengths) && lengths[key] > 1.6 * (lengths.reduce((a, b) => a + b, 0) - lengths[key]) / (size - 1)) {
      failures.push(`Dropdown blank ${blank + 1} keys a conspicuously long option: ${id}`);
    }
  });
}

const caseFormats = new Map();

for (const question of allQuestions) {
  if (ids.has(question.id)) failures.push(`Duplicate ID: ${question.id}`);
  ids.add(question.id);
  if (prompts.has(questionText(question))) failures.push(`Duplicate prompt: ${question.id}`);
  prompts.add(questionText(question));

  const surface = question.exam === "ab100" ? ab100Surface : azureSurface;
  if (!surface.test(questionText(question))) failures.push(`No explicit product surface in prompt: ${question.id}`);
  const exam = question.exam ?? "ai103";
  const format = itemFormat(question);
  formatCounts[exam][format] = (formatCounts[exam][format] ?? 0) + 1;
  if (question.caseStudyId) caseCounts.set(question.caseStudyId, (caseCounts.get(question.caseStudyId) ?? 0) + 1);
  if (question.caseStudyId) {
    const formats = caseFormats.get(question.caseStudyId) ?? new Set();
    formats.add(format);
    caseFormats.set(question.caseStudyId, formats);
  }

  const engagement = explanationEngagement(question);
  if (ENFORCE_EXPLANATION_ENGAGEMENT && engagement.pool > 2 && engagement.hits === 0) {
    failures.push(`Explanation never engages the wrong options: ${question.id}`);
  }
  checkReference(question);

  if (question.type === "dragdrop") {
    checkDragDrop(question);
    continue;
  }
  if (question.type === "dropdown") {
    checkDropdown(question);
    continue;
  }

  if (question.options.length !== 4 && question.options.length !== 5) failures.push(`Expected four or five options: ${question.id}`);
  if (question.options.length === 4 && question.correct.length > 2) failures.push(`A four-option item keys at most two answers: ${question.id}`);
  if (question.options.length === 5 && question.correct.length > 2) failures.push(`A five-option item keys one or two answers: ${question.id}`);
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
      correctPositions[question.options.length][index] += 1;
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
if (caseCounts.size < 24) failures.push(`Fewer than 24 case studies across both exams: ${caseCounts.size}`);
if (AB100_QUESTIONS.length < 230) failures.push(`AB-100 bank is too small: ${AB100_QUESTIONS.length}`);
if (Object.keys(AB100_CASE_STUDIES).length < 12) failures.push(`AB-100 needs at least 12 case studies: ${Object.keys(AB100_CASE_STUDIES).length}`);
for (const question of AB100_QUESTIONS) {
  if (!question.domain.startsWith("ab-")) failures.push(`AB-100 question has an AI-103 domain: ${question.id}`);
  if (question.exam !== "ab100") failures.push(`AB-100 question is not tagged with its exam: ${question.id}`);
}
for (const [caseId, count] of caseCounts) {
  if (count < 6 || count > 8) failures.push(`Case ${caseId} has ${count} questions; each case needs six to eight`);
  const formats = caseFormats.get(caseId) ?? new Set();
  if (!formats.has("dragdrop") || !formats.has("dropdown")) failures.push(`Case ${caseId} needs at least one drag-and-drop and one dropdown item`);
}
for (const study of [...Object.values(CASE_STUDIES), ...Object.values(AB100_CASE_STUDIES)]) {
  for (const field of ["background", "audience", "existingEnvironment", "useCases", "requirements", "constraints"]) {
    const value = study[field];
    if (!value || (Array.isArray(value) && (!value.length || value.some((item) => !item.trim())))) failures.push(`Case study ${study.id} has no ${field}`);
  }
  if (!caseCounts.has(study.id)) failures.push(`Case study ${study.id} has no questions`);
}
// Interactive formats need enough depth per exam that sessions rotate rather than repeat.
const FORMAT_FLOORS = { multi: 20, dragdrop: 16, dropdown: 16 };
for (const exam of ["ai103", "ab100"]) {
  for (const [format, floor] of Object.entries(FORMAT_FLOORS)) {
    const pool = allQuestions.filter((question) => (question.exam ?? "ai103") === exam && !question.caseStudyId && !question.collection && itemFormat(question) === format);
    if (pool.length < floor) failures.push(`${exam} has ${pool.length} standalone ${format} items; needs ${floor}`);
  }
}

const choiceCount = allQuestions.filter(isChoice).length;
const longestRate = correctIsLongest / choiceCount;
if (longestRate > 0.25) failures.push(`Correct option is longest in ${(longestRate * 100).toFixed(1)}% of questions`);

const meanCorrectLength = correctCharacters / correctOptionCount;
const meanDistractorLength = distractorCharacters / distractorOptionCount;
const meanLengthRatio = meanCorrectLength / meanDistractorLength;
if (meanLengthRatio < 0.85 || meanLengthRatio > 1.15) {
  failures.push(`Mean correct/distractor length ratio is ${meanLengthRatio.toFixed(2)}`);
}

for (const [size, positions] of Object.entries(correctPositions)) {
  const total = positions.reduce((sum, count) => sum + count, 0);
  if (!total) continue;
  // Five-option items are fewer, so they get a wider band before sampling noise counts.
  const [low, high] = size === "4" ? [0.15, 0.35] : [0.1, 0.32];
  for (const [index, count] of positions.entries()) {
    const share = count / total;
    if (share < low || share > high) failures.push(`Correct position ${index} of ${size} is imbalanced at ${(share * 100).toFixed(1)}%`);
  }
}
for (const [size, positions] of blankPositions) {
  const total = positions.reduce((sum, count) => sum + count, 0);
  if (total < 20) continue;
  const expected = 1 / size;
  for (const [index, count] of positions.entries()) {
    const share = count / total;
    if (share < expected * 0.5 || share > expected * 1.6) failures.push(`Dropdown key position ${index} of ${size} is imbalanced at ${(share * 100).toFixed(1)}%`);
  }
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
  const choiceBank = bank.filter(isChoice);
  for (const question of choiceBank) {
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
  const bankLongestRate = longestCount / choiceBank.length;
  const bankLengthRatio = (bankCorrectCharacters / bankCorrectCount) / (bankDistractorCharacters / bankDistractorCount);
  if (bankLongestRate > 0.25) failures.push(`${name} correct option is longest in ${(bankLongestRate * 100).toFixed(1)}% of questions`);
  if (bankLengthRatio < 0.85 || bankLengthRatio > 1.15) failures.push(`${name} correct/distractor length ratio is ${bankLengthRatio.toFixed(2)}`);
  const scoreable = bank.length - unscoreable;
  return [name, {
    questions: bank.length,
    correctIsLongest: `${longestCount}/${choiceBank.length} (${(bankLongestRate * 100).toFixed(1)}%)`,
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
  questionText(question).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !EXPLANATION_STOP_WORDS.has(w)),
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
  correctIsLongest: `${correctIsLongest}/${choiceCount} (${(longestRate * 100).toFixed(1)}%)`,
  meanCorrectCharacters: Number(meanCorrectLength.toFixed(1)),
  meanDistractorCharacters: Number(meanDistractorLength.toFixed(1)),
  meanLengthRatio: Number(meanLengthRatio.toFixed(2)),
  closestPromptPair: `${closestPair.pair} at ${closestPair.score.toFixed(2)} (limit ${SIMILARITY_LIMIT})`,
  correctPositions,
  dropdownKeyPositions: Object.fromEntries(blankPositions),
  formats: formatCounts,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`\nQuestion-bank audit failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("\nQuestion-bank audit passed.");
}
