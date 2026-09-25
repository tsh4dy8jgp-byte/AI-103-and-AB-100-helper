import type { ChoiceQuestion, Question } from "./questions";

/**
 * Grading for every item format. Pure functions over `number[]` answers, so the exam
 * UI, the results screen, and the session audit all score identically.
 *
 * Scoring follows Microsoft's convention for multi-part items: each correct selection,
 * target, or blank is worth one point, so a question can be partially correct.
 */

export interface QuestionScore {
  earned: number;
  possible: number;
}

export interface AnswerPart {
  /** What this part of the answer is for: "Answer", a target label, or "Blank 2". */
  label: string;
  chosen: string;
  expected: string;
  ok: boolean;
}

export const EMPTY_SLOT = -1;

export function isChoice(question: Question): question is ChoiceQuestion {
  return question.type === undefined || question.type === "choice";
}

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/** Selections a complete answer contains, or placements for the positional formats. */
export function slotCount(question: Question): number {
  if (question.type === "dragdrop") return question.targets.length;
  if (question.type === "dropdown") return question.blanks.length;
  return question.correct.length;
}

export function emptyAnswer(question: Question): number[] {
  return isChoice(question) ? [] : Array.from({ length: slotCount(question) }, () => EMPTY_SLOT);
}

/** Every required selection or slot is filled. Gates "Check answer". */
export function isComplete(question: Question, answer: number[] = []): boolean {
  if (isChoice(question)) return new Set(answer).size === question.correct.length;
  return answer.length === slotCount(question) && answer.every((value) => value >= 0);
}

/** At least one part is answered. */
export function isStarted(question: Question, answer: number[] = []): boolean {
  return isChoice(question) ? answer.length > 0 : answer.some((value) => value >= 0);
}

export function scoreQuestion(question: Question, answer: number[] = []): QuestionScore {
  const possible = question.correct.length;
  if (isChoice(question)) {
    // The UI caps selections at the required count; the cap is repeated here so
    // selecting every option can never earn credit.
    const picked = [...new Set(answer)].slice(0, possible);
    return { earned: picked.filter((index) => question.correct.includes(index)).length, possible };
  }
  return { earned: question.correct.filter((value, index) => answer[index] === value).length, possible };
}

export function isFullyCorrect(question: Question, answer: number[] = []): boolean {
  const { earned, possible } = scoreQuestion(question, answer);
  return earned === possible;
}

export function feedbackLabel(score: QuestionScore): string {
  if (score.earned === score.possible) return "Correct";
  if (score.earned === 0) return "Not quite";
  return `Partially correct (${score.earned} of ${score.possible})`;
}

/** The answer broken into the parts that were scored, for the review screen. */
export function answerParts(question: Question, answer: number[] = []): AnswerPart[] {
  if (question.type === "dragdrop") {
    return question.targets.map((target, index) => ({
      label: question.ordered ? `Step ${index + 1}` : target,
      chosen: question.tiles[answer[index]] ?? "—",
      expected: question.tiles[question.correct[index]],
      ok: answer[index] === question.correct[index],
    }));
  }
  if (question.type === "dropdown") {
    return question.blanks.map((options, index) => ({
      label: `Blank ${index + 1}`,
      chosen: options[answer[index]] ?? "—",
      expected: options[question.correct[index]],
      ok: answer[index] === question.correct[index],
    }));
  }
  const describe = (indices: number[]) =>
    indices.length ? [...indices].sort((a, b) => a - b).map((index) => `${optionLetter(index)}. ${question.options[index]}`).join(" · ") : "—";
  return [{
    label: question.correct.length > 1 ? "Answers" : "Answer",
    chosen: describe([...new Set(answer)]),
    expected: describe(question.correct),
    ok: isFullyCorrect(question, answer),
  }];
}

/** Splits a dropdown template into literal text and blank indices, in reading order. */
export function templateSegments(template: string): Array<string | number> {
  return template.split(/\{(\d+)\}/).map((part, index) => (index % 2 === 1 ? Number(part) : part)).filter((part) => part !== "");
}
