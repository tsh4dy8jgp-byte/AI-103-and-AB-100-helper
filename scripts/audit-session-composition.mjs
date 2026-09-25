// Simulates sessions exactly as the app composes them, and unit-tests grading.
//
//   npm run audit:sessions
import assert from "node:assert/strict";
import { emptyAnswer, isComplete, isStarted, scoreQuestion, templateSegments } from "../lib/grading.ts";
import { EXAMS } from "../lib/questions.ts";
import { CASE_SIZE, EXAM_CONFIG, FORMAT_TARGETS, itemFormat, selectSession } from "../lib/session-composer.ts";

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

// --- Grading -------------------------------------------------------------------------

const single = { id: "g1", type: "choice", options: ["a", "b", "c", "d"], correct: [2] };
assert.deepEqual(scoreQuestion(single, [2]), { earned: 1, possible: 1 });
assert.deepEqual(scoreQuestion(single, [1]), { earned: 0, possible: 1 });
assert.deepEqual(scoreQuestion(single, []), { earned: 0, possible: 1 });

const pickTwo = { id: "g2", options: ["a", "b", "c", "d", "e"], correct: [1, 4] };
assert.deepEqual(scoreQuestion(pickTwo, [4, 1]), { earned: 2, possible: 2 }, "choice answers compare as a set");
assert.deepEqual(scoreQuestion(pickTwo, [1, 3]), { earned: 1, possible: 2 }, "one correct selection earns one point");
assert.deepEqual(scoreQuestion(pickTwo, [1, 4, 0, 2, 3]), { earned: 2, possible: 2 }, "over-selection is capped by the UI, not rewarded");
assert.deepEqual(scoreQuestion(pickTwo, [0, 1, 4]), { earned: 1, possible: 2 }, "only the first required selections count");
assert.equal(isComplete(pickTwo, [1]), false);
assert.equal(isComplete(pickTwo, [1, 1]), false, "duplicate selections do not complete an answer");
assert.equal(isComplete(pickTwo, [1, 3]), true);

const order = { id: "g3", type: "dragdrop", targets: ["Step 1", "Step 2", "Step 3"], tiles: ["x", "y", "z", "w"], correct: [2, 0, 1], ordered: true };
assert.deepEqual(emptyAnswer(order), [-1, -1, -1]);
assert.deepEqual(scoreQuestion(order, [2, 0, 1]), { earned: 3, possible: 3 });
assert.deepEqual(scoreQuestion(order, [0, 2, 1]), { earned: 1, possible: 3 }, "drag-and-drop compares by position, not as a set");
assert.equal(isComplete(order, [2, -1, 1]), false);
assert.equal(isStarted(order, [2, -1, 1]), true);
assert.equal(isStarted(order, [-1, -1, -1]), false);

const gaps = { id: "g4", type: "dropdown", template: "Use {0} with {1}.", blanks: [["a", "b", "c"], ["d", "e", "f"]], correct: [1, 2] };
assert.deepEqual(templateSegments(gaps.template), ["Use ", 0, " with ", 1, "."]);
assert.deepEqual(scoreQuestion(gaps, [1, 0]), { earned: 1, possible: 2 });
assert.deepEqual(scoreQuestion(gaps, []), { earned: 0, possible: 2 });
assert.equal(isComplete(gaps, [1, -1]), false);

// --- Session composition --------------------------------------------------------------

const RUNS = 500;
for (const exam of ["ai103", "ab100"]) {
  const domains = EXAMS[exam].domains;
  for (const length of ["full", "short"]) {
    const config = EXAM_CONFIG[exam].exam[length];
    const domainShare = Object.fromEntries(domains.map((domain) => [domain.id, 0]));
    let totalQuestions = 0;
    const sizes = new Set();
    for (let run = 0; run < RUNS; run += 1) {
      // A random slice of history, so rotation paths are exercised too.
      const session = selectSession(exam, "exam", length, [], exam === "ai103" && run % 2 === 0);
      const label = `${exam} ${length} run ${run}`;
      sizes.add(session.length);
      totalQuestions += session.length;
      expect(session.length >= (config.minQuestions ?? config.questions) && session.length <= config.questions, `${label}: ${session.length} questions`);
      expect(new Set(session.map((question) => question.id)).size === session.length, `${label}: duplicate question`);
      expect(session.every((question) => (question.exam ?? "ai103") === exam), `${label}: question from the other exam`);

      const caseIds = [...new Set(session.filter((question) => question.caseStudyId).map((question) => question.caseStudyId))];
      expect(caseIds.length === config.caseStudies, `${label}: ${caseIds.length} case studies`);
      const firstCase = session.findIndex((question) => question.caseStudyId);
      const caseBlock = session.slice(firstCase);
      expect(firstCase > 0 && caseBlock.every((question) => question.caseStudyId === caseIds[0]), `${label}: case block is not contiguous at the end`);
      expect(caseBlock.length >= CASE_SIZE.min && caseBlock.length <= CASE_SIZE.max, `${label}: case has ${caseBlock.length} questions`);

      const standalone = session.slice(0, firstCase);
      for (const [format, quota] of Object.entries(FORMAT_TARGETS[length])) {
        const count = standalone.filter((question) => itemFormat(question) === format).length;
        expect(count >= quota, `${label}: ${count} ${format} items, quota ${quota}`);
      }
      session.forEach((question) => { domainShare[question.domain] += 1; });
    }
    for (const domain of domains) {
      const share = domainShare[domain.id] / totalQuestions;
      expect(Math.abs(share - domain.weight) <= 0.05, `${exam} ${length}: ${domain.id} share ${(share * 100).toFixed(1)}% vs weight ${domain.weight * 100}%`);
    }
    if (config.minQuestions) expect(sizes.size > 3, `${exam} ${length}: session length never varies (${[...sizes]})`);
    console.log(`${exam} ${length}: ${RUNS} sessions, ${[...sizes].sort((a, b) => a - b).join("/")} questions, domain shares ${domains.map((domain) => `${domain.id} ${((domainShare[domain.id] / totalQuestions) * 100).toFixed(0)}%`).join(", ")}`);
  }

  for (const length of ["full", "short"]) {
    const config = EXAM_CONFIG[exam].cases[length];
    const session = selectSession(exam, "cases", length, [], false);
    const caseIds = [...new Set(session.map((question) => question.caseStudyId))];
    expect(caseIds.length === config.caseStudies && !caseIds.includes(undefined), `${exam} cases ${length}: ${caseIds.length} cases`);
    expect(session.length >= (config.minQuestions ?? 0) && session.length <= config.questions, `${exam} cases ${length}: ${session.length} questions`);
    // Case sections stay contiguous, so locking one never strands a question.
    const runs = session.map((question) => question.caseStudyId).filter((id, index, all) => index === 0 || all[index - 1] !== id);
    expect(runs.length === caseIds.length, `${exam} cases ${length}: case sections are interleaved`);
  }
}

if (failures.length) {
  console.error(`\nSession composition audit failed:\n- ${[...new Set(failures)].slice(0, 40).join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("\nSession composition audit passed.");
}
