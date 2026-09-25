import { prioritizeUnseen, prioritizeUnseenCases } from "./question-rotation.ts";
import {
  AB100_CASE_STUDY_IDS,
  AB100_QUESTIONS,
  CASE_STUDY_IDS,
  CLAUDE_QUESTIONS_BY_COLLECTION,
  COPILOT_STUDIO_QUESTIONS,
  CORE_QUESTIONS,
  EXAMS,
  FOUNDRY_SDK_QUESTIONS,
} from "./questions.ts";
import type { DomainId, DomainMeta, ExamId, Question } from "./questions";

/**
 * Session composition shared by AI-103 and AB-100.
 *
 * An exam simulation is a block of standalone questions followed by one intact case
 * study. Domain weighting and the item-format mix are applied to the standalone block,
 * after accounting for whatever the drawn case study already covers.
 */

export type ExamLength = "full" | "short";
export type PracticeTrack = "exam" | "cases" | "sdk" | "copilot";

export interface SessionConfig {
  /** Upper bound on questions, and the exact count when there is no range. */
  questions: number;
  /** Lower bound when the session length varies, as it does on the real exams. */
  minQuestions?: number;
  minutes: number;
  caseStudies: number;
}

/** Every case study carries six to eight questions; the bank audit enforces it. */
export const CASE_SIZE = { min: 6, max: 8 };

const caseTrack = (caseStudies: number, minutes: number): SessionConfig => ({
  questions: caseStudies * CASE_SIZE.max,
  minQuestions: caseStudies * CASE_SIZE.min,
  minutes,
  caseStudies,
});

/**
 * Both exams share the same session shapes. A full simulation is 45–52 questions in
 * 100 minutes, including one case study, like the real exams. AB-100 hides the SDK
 * and Copilot Studio tracks, which have no AB-100 bank.
 */
const SESSION_CONFIG: Record<PracticeTrack, Record<ExamLength, SessionConfig>> = {
  exam: {
    full: { questions: 52, minQuestions: 45, minutes: 100, caseStudies: 1 },
    short: { questions: 25, minutes: 50, caseStudies: 1 },
  },
  cases: {
    full: caseTrack(4, 90),
    short: caseTrack(2, 45),
  },
  sdk: {
    full: { questions: 40, minutes: 70, caseStudies: 0 },
    short: { questions: 20, minutes: 35, caseStudies: 0 },
  },
  copilot: {
    full: { questions: 24, minutes: 40, caseStudies: 0 },
    short: { questions: 12, minutes: 20, caseStudies: 0 },
  },
};

export const EXAM_CONFIG: Record<ExamId, typeof SESSION_CONFIG> = { ai103: SESSION_CONFIG, ab100: SESSION_CONFIG };

export function questionLabel(config: SessionConfig): string {
  return config.minQuestions && config.minQuestions !== config.questions ? `${config.minQuestions}–${config.questions}` : `${config.questions}`;
}

/** The formats a session mixes. "multi" is a five-option item or any item with two answers. */
export type ItemFormat = "single" | "multi" | "dragdrop" | "dropdown";

export const ITEM_FORMATS: ItemFormat[] = ["single", "multi", "dragdrop", "dropdown"];

export function itemFormat(question: Question): ItemFormat {
  if (question.type === "dragdrop") return "dragdrop";
  if (question.type === "dropdown") return "dropdown";
  return question.options.length >= 5 || question.correct.length > 1 ? "multi" : "single";
}

/** Largest-remainder apportionment of `total` seats by `weights`. */
export function apportion(weights: number[], total: number): number[] {
  const sum = weights.reduce((acc, weight) => acc + Math.max(0, weight), 0);
  if (!sum || total <= 0) return weights.map(() => 0);
  const exact = weights.map((weight) => (Math.max(0, weight) / sum) * total);
  const seats = exact.map(Math.floor);
  let remaining = total - seats.reduce((acc, seat) => acc + seat, 0);
  const byRemainder = exact.map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || weights[b.index] - weights[a.index]);
  for (const { index } of byRemainder) {
    if (remaining <= 0) break;
    seats[index] += 1;
    remaining -= 1;
  }
  return seats;
}

export function pickCases(caseIds: string[], caseBank: Question[], recentIds: string[], count: number): Question[] {
  return prioritizeUnseenCases(caseIds, caseBank, recentIds)
    .slice(0, count)
    .flatMap((caseId) => caseBank.filter((question) => question.caseStudyId === caseId));
}

export interface ExamSpec {
  /** Standalone candidates. Anything carrying a caseStudyId is ignored. */
  pool: Question[];
  /** Every case-study question for the exam. */
  caseBank: Question[];
  caseIds: string[];
  domains: DomainMeta[];
  /** Total questions including the case study. */
  total: number;
  caseStudies: number;
  /** Minimum count of each non-single format in the standalone block. */
  formatTargets: Partial<Record<ItemFormat, number>>;
  recentIds: string[];
}

export function composeExam(spec: ExamSpec): Question[] {
  const caseQuestions = pickCases(spec.caseIds, spec.caseBank, spec.recentIds, spec.caseStudies);
  const standaloneCount = Math.max(0, spec.total - caseQuestions.length);

  // Weight the whole session, then let the standalone block make up what the case
  // study does not cover in each domain.
  const caseByDomain = new Map<DomainId, number>();
  caseQuestions.forEach((question) => caseByDomain.set(question.domain, (caseByDomain.get(question.domain) ?? 0) + 1));
  const seats = apportion(spec.domains.map((domain) => domain.weight * spec.total - (caseByDomain.get(domain.id) ?? 0)), standaloneCount);
  const remaining = new Map(spec.domains.map((domain, index) => [domain.id, seats[index]]));

  const ranked = prioritizeUnseen(spec.pool.filter((question) => !question.caseStudyId), spec.recentIds);
  const chosen: Question[] = [];
  const chosenIds = new Set<string>();
  const take = (question: Question) => {
    chosen.push(question);
    chosenIds.add(question.id);
    remaining.set(question.domain, (remaining.get(question.domain) ?? 0) - 1);
  };
  const open = (question: Question) => !chosenIds.has(question.id) && (remaining.get(question.domain) ?? 0) > 0;

  // Interactive formats first, so a domain's seats are not all spent on single-answer
  // items before its drag-and-drop or dropdown items are considered.
  for (const format of ITEM_FORMATS) {
    const quota = spec.formatTargets[format] ?? 0;
    const ofFormat = ranked.filter((question) => itemFormat(question) === format);
    let placed = 0;
    for (const question of ofFormat) {
      if (placed >= quota || chosen.length >= standaloneCount) break;
      if (!open(question)) continue;
      take(question);
      placed += 1;
    }
  }

  // Remaining seats go to single-answer items, then to any format if a domain runs dry.
  for (const preferSingle of [true, false]) {
    for (const question of ranked) {
      if (chosen.length >= standaloneCount) break;
      if (!open(question) || (preferSingle && itemFormat(question) !== "single")) continue;
      take(question);
    }
  }

  // A thin domain can leave seats unfilled; top up from anything unused.
  for (const question of ranked) {
    if (chosen.length >= standaloneCount) break;
    if (!chosenIds.has(question.id)) take(question);
  }

  return [...shuffle(chosen), ...caseQuestions];
}

/**
 * Minimum interactive items in the standalone block. The case study adds at least one
 * drag-and-drop and one dropdown item of its own. Domain weighting comes from each
 * exam's published ranges (DomainMeta.weight).
 */
export const FORMAT_TARGETS: Record<ExamLength, Partial<Record<ItemFormat, number>>> = {
  full: { multi: 6, dragdrop: 5, dropdown: 5 },
  short: { multi: 3, dragdrop: 2, dropdown: 2 },
};

/** The questions for a new session. Focused sessions are composed by the caller. */
export function selectSession(exam: ExamId, track: PracticeTrack, length: ExamLength, recentIds: string[], includeClaude: boolean): Question[] {
  const config = EXAM_CONFIG[exam][track][length];
  if (track === "sdk" || track === "copilot") {
    const base = track === "sdk" ? FOUNDRY_SDK_QUESTIONS : COPILOT_STUDIO_QUESTIONS;
    const bank = includeClaude ? [...base, ...CLAUDE_QUESTIONS_BY_COLLECTION[track]] : base;
    return prioritizeUnseen(bank, recentIds).slice(0, config.questions);
  }

  const bank = exam === "ab100" ? AB100_QUESTIONS : CORE_QUESTIONS;
  const caseIds = exam === "ab100" ? AB100_CASE_STUDY_IDS : CASE_STUDY_IDS;
  const caseBank = bank.filter((question) => question.caseStudyId);
  if (track === "cases") return pickCases(caseIds, caseBank, recentIds, config.caseStudies);

  // The Claude bank widens the per-domain candidate pool, so the published domain
  // weighting is preserved whether or not the toggle is on.
  const pool = exam === "ai103" && includeClaude ? [...CORE_QUESTIONS, ...CLAUDE_QUESTIONS_BY_COLLECTION.core] : bank;
  return composeExam({
    pool,
    caseBank,
    caseIds,
    domains: EXAMS[exam].domains,
    total: randomBetween(config.minQuestions ?? config.questions, config.questions),
    caseStudies: config.caseStudies,
    formatTargets: FORMAT_TARGETS[length],
    recentIds,
  });
}

export function randomBetween(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
