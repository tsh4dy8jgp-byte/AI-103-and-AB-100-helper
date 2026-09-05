import assert from "node:assert/strict";
import { prioritizeUnseen, prioritizeUnseenCases } from "../lib/question-rotation.ts";

const ids = (items) => items.map((item) => item.id);
const disjoint = (a, b) => a.every((id) => !new Set(b).has(id));

// An 80-question specialty pool supports two 40-question sessions with no repeat.
const specialtyPool = Array.from({ length: 80 }, (_, index) => ({ id: `q-${index + 1}` }));
const first = prioritizeUnseen(specialtyPool, []).slice(0, 40);
const firstHistory = ids(first);
const second = prioritizeUnseen(specialtyPool, firstHistory).slice(0, 40);
assert.equal(new Set(ids(first)).size, 40);
assert.equal(new Set(ids(second)).size, 40);
assert.ok(disjoint(ids(first), ids(second)), "second specialty run should contain only unseen questions");

// After exhaustion, the oldest session rotates back before the newest session.
const completeHistory = [...ids(second), ...firstHistory];
const third = prioritizeUnseen(specialtyPool, completeHistory).slice(0, 40);
assert.deepEqual(new Set(ids(third)), new Set(firstHistory));

// Case studies are selected as intact sections and unseen cases win as a group.
const caseIds = Array.from({ length: 12 }, (_, index) => `case-${index + 1}`);
const caseQuestions = caseIds.flatMap((caseId) =>
  Array.from({ length: 4 }, (_, index) => ({ id: `${caseId}-q${index + 1}`, caseStudyId: caseId })),
);
const firstCases = prioritizeUnseenCases(caseIds, caseQuestions, []).slice(0, 6);
const firstCaseHistory = ids(caseQuestions.filter((question) => firstCases.includes(question.caseStudyId)));
const secondCases = prioritizeUnseenCases(caseIds, caseQuestions, firstCaseHistory).slice(0, 6);
assert.ok(disjoint(firstCases, secondCases), "second case-study run should contain only unseen cases when capacity allows");

console.log("Question rotation audit passed.");
