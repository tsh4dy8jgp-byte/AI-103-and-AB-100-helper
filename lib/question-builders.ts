import type { SyllabusDomain } from "./ai103-syllabus";
import type {
  ChoiceQuestion,
  CodeLanguage,
  Difficulty,
  DomainId,
  DragDropQuestion,
  DropdownQuestion,
  ExamId,
  SyllabusRef,
} from "./questions";

/**
 * Typed factories for the interactive item formats.
 *
 * Authors always write the right answer first — the first `correctCount` options, the
 * right tile per target, the first option in each blank — and the factory reorders it
 * with a permutation seeded by the question id. The shipped order is therefore stable
 * across builds, balanced across the bank, and never the authored order.
 */

interface Common {
  id: string;
  domain: DomainId;
  topic: string;
  difficulty?: Difficulty;
  prompt: string;
  explanation: string;
  syllabus: SyllabusRef;
  caseStudyId?: string;
}

/** FNV-1a, so small id changes move the permutation a long way. */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (const character of text) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

/** mulberry32 seeded from the key: a deterministic stand-in for Math.random. */
function seededPermutation(length: number, key: string): number[] {
  let state = hash(key);
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const order = Array.from({ length }, (_, index) => index);
  for (let i = length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function base(exam: ExamId, spec: Common) {
  return {
    id: spec.id,
    ...(exam === "ab100" ? { exam } : {}),
    domain: spec.domain,
    topic: spec.topic,
    difficulty: spec.difficulty ?? "Advanced",
    prompt: spec.prompt,
    explanation: spec.explanation,
    syllabus: spec.syllabus,
    ...(spec.caseStudyId ? { caseStudyId: spec.caseStudyId } : {}),
  };
}

/** Resolves a verbatim bullet to its full citation, failing loudly on a typo. */
export function citeFrom(syllabus: SyllabusDomain[]) {
  return (bullet: string, docUrl: string, docTitle: string): SyllabusRef => {
    for (const domain of syllabus) {
      for (const skill of domain.skills) {
        if (skill.bullets.includes(bullet)) return { domain: domain.domain, skill: skill.skill, bullet, docUrl, docTitle };
      }
    }
    throw new Error(`Syllabus bullet not in the published outline: ${bullet}`);
  };
}

export function buildersFor(exam: ExamId) {
  /** Multiple choice of five: the first `correctCount` options are the keyed answers. */
  const choose = (spec: Common & { options: string[]; correctCount?: 1 | 2 }): ChoiceQuestion => {
    const correctCount = spec.correctCount ?? 2;
    const order = seededPermutation(spec.options.length, spec.id);
    return {
      ...base(exam, spec),
      type: "choice",
      options: order.map((index) => spec.options[index]),
      correct: order.flatMap((authored, shipped) => (authored < correctCount ? [shipped] : [])),
    };
  };

  /** Match each target to a tile. `answers[i]` is the right tile text for `targets[i]`. */
  const match = (spec: Common & { targets: string[]; answers: string[]; distractors: string[]; reuse?: boolean }): DragDropQuestion => {
    const authored = [...new Set([...spec.answers, ...spec.distractors])];
    const order = seededPermutation(authored.length, spec.id);
    const tiles = order.map((index) => authored[index]);
    return {
      ...base(exam, spec),
      type: "dragdrop",
      targets: spec.targets,
      tiles,
      correct: spec.answers.map((answer) => tiles.indexOf(answer)),
      ...(spec.reuse ? { reuse: true } : {}),
    };
  };

  /** Arrange actions in order. `steps` is the right sequence; distractors stay in the pool. */
  const sequence = (spec: Common & { steps: string[]; distractors: string[] }): DragDropQuestion => ({
    ...match({ ...spec, targets: spec.steps.map((_, index) => `Step ${index + 1}`), answers: spec.steps }),
    ordered: true,
  });

  /** Fill each `{n}` gap from a list. The first option in each list is the keyed answer. */
  const gaps = (spec: Common & { template: string; blanks: string[][]; language?: CodeLanguage }): DropdownQuestion => {
    const blanks = spec.blanks.map((options, blank) => {
      const order = seededPermutation(options.length, `${spec.id}#${blank}`);
      return { options: order.map((index) => options[index]), correct: order.indexOf(0) };
    });
    return {
      ...base(exam, spec),
      type: "dropdown",
      template: spec.template,
      blanks: blanks.map((blank) => blank.options),
      correct: blanks.map((blank) => blank.correct),
      ...(spec.language ? { language: spec.language } : {}),
    };
  };

  return { choose, match, sequence, gaps };
}
