"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LEARN_MAP, LEARN_RULES, LEARN_BUDGET, LEARN_TRIAGE, LEARN_TAB_STRATEGY, LEARN_DONT_BOTHER } from "@/lib/learn-map";
import { GLOSSARY, GLOSSARY_TERM_COUNT } from "@/lib/glossary";
import { prioritizeUnseen, prioritizeUnseenCases } from "@/lib/question-rotation";
import { AB100_CASE_STUDIES, AB100_CASE_STUDY_IDS, AB100_DOMAINS, AB100_QUESTIONS, CASE_STUDIES, CASE_STUDY_IDS, CLAUDE_QUESTIONS, CLAUDE_QUESTIONS_BY_COLLECTION, ALL_QUESTIONS, COPILOT_STUDIO_QUESTIONS, CORE_QUESTIONS, DOMAINS, EXAMS, FOUNDRY_SDK_QUESTIONS, QUESTIONS, getDomain, type CaseStudy, type DomainId, type DomainMeta, type ExamId, type Question } from "@/lib/questions";

type Screen = "home" | "setup" | "exam" | "results" | "dashboard" | "learnmap" | "glossary";
type FeedbackMode = "real" | "review";
type ExamLength = "full" | "short";
type PracticeTrack = "exam" | "cases" | "sdk" | "copilot";
type Answers = Record<string, number[]>;

interface AttemptDomainStat {
  correct: number;
  total: number;
}

interface QuestionOutcome {
  id: string;
  correct: boolean;
}

/** A focused session draws only from questions matching the focus. Session intent, not a saved preference. */
type Focus =
  | { kind: "weak-objectives"; bullets: string[]; label: string }
  | { kind: "missed"; ids: string[]; label: string };

interface Attempt {
  id: string;
  examId?: ExamId;
  completedAt: string;
  score: number;
  correct: number;
  total: number;
  durationSeconds: number;
  feedbackMode: FeedbackMode;
  examLength: ExamLength;
  practiceTrack: PracticeTrack;
  domainStats: Record<DomainId, AttemptDomainStat>;
  /** Absent on attempts recorded before objective analytics were added. */
  outcomes?: QuestionOutcome[];
}

interface PersistedState {
  attempts: Attempt[];
  examId?: ExamId;
  recentQuestionIds: string[];
  includeClaudeQuestions?: boolean;
}

const STORAGE_KEY = "northstar-ai103-state-v3";
const PASS_SCORE = 70;
const AI103_CONFIG = {
  exam: {
    full: { questions: 50, minutes: 100, caseStudies: 2 },
    short: { questions: 25, minutes: 50, caseStudies: 1 },
  },
  cases: {
    full: { questions: 24, minutes: 90, caseStudies: 6 },
    short: { questions: 12, minutes: 45, caseStudies: 3 },
  },
  sdk: {
    full: { questions: 40, minutes: 70, caseStudies: 0 },
    short: { questions: 20, minutes: 35, caseStudies: 0 },
  },
  copilot: {
    full: { questions: 24, minutes: 40, caseStudies: 0 },
    short: { questions: 12, minutes: 20, caseStudies: 0 },
  },
} as const;

// AB-100 has no SDK or Copilot Studio specialty banks; those tracks are hidden.
const AB100_CONFIG = {
  exam: {
    full: { questions: 50, minutes: 100, caseStudies: 2 },
    short: { questions: 25, minutes: 50, caseStudies: 1 },
  },
  cases: {
    full: { questions: 24, minutes: 90, caseStudies: 6 },
    short: { questions: 12, minutes: 45, caseStudies: 3 },
  },
  sdk: AI103_CONFIG.sdk,
  copilot: AI103_CONFIG.copilot,
} as const;

const EXAM_CONFIG: Record<ExamId, typeof AI103_CONFIG> = { ai103: AI103_CONFIG, ab100: AB100_CONFIG };

/** Standalone-question targets per domain, weighted from each exam's published ranges. */
const DOMAIN_TARGETS: Record<ExamId, Record<ExamLength, Partial<Record<DomainId, number>>>> = {
  ai103: {
    full: { plan: 13, gen: 16, vision: 7, language: 7, extract: 7 },
    short: { plan: 7, gen: 8, vision: 3, language: 3, extract: 4 },
  },
  ab100: {
    full: { "ab-plan": 14, "ab-design": 14, "ab-deploy": 22 },
    short: { "ab-plan": 7, "ab-design": 7, "ab-deploy": 11 },
  },
};

const TRACKS_BY_EXAM: Record<ExamId, PracticeTrack[]> = {
  ai103: ["exam", "cases", "sdk", "copilot"],
  ab100: ["exam", "cases"],
};
const FOCUS_TIPS: Partial<Record<DomainId, string>> = {
  plan: "Revisit model and service selection, governance, security, and observability trade-offs.",
  gen: "Practice RAG design, agents and tools, orchestration, evaluations, and operational safeguards.",
  vision: "Review generation and editing workflows, multimodal inputs, and visual policy enforcement.",
  language: "Focus on structured text analysis, translation, streaming speech, and custom speech choices.",
  extract: "Practice OCR/layout pipelines, Content Understanding, indexing, enrichment, and secure retrieval.",
};

const TRACK_LABELS: Record<ExamId, Record<PracticeTrack, string>> = {
  ai103: { exam: "AI-103 exam simulation", cases: "Case Studies", sdk: "Foundry SDK", copilot: "Copilot Studio" },
  ab100: { exam: "AB-100 exam simulation", cases: "Case Studies", sdk: "Foundry SDK", copilot: "Copilot Studio" },
};

const FOCUS_TIPS_AB100: Partial<Record<DomainId, string>> = {
  "ab-plan": "Revisit agent suitability, grounding readiness, platform strategy, and return-on-investment analysis.",
  "ab-design": "Practice Dynamics 365 and Copilot Studio design choices, extensibility, and prebuilt configuration.",
  "ab-deploy": "Focus on monitoring, testing, application lifecycle management, and governance design.",
};

function casesForExam(exam: ExamId): Record<string, CaseStudy> {
  return exam === "ab100" ? AB100_CASE_STUDIES : CASE_STUDIES;
}

const SDK_AREAS: Partial<Record<DomainId, DomainMeta>> = {
  plan: { id: "plan", name: "SDK setup, endpoints, identity, and operations", shortName: "Setup & operations", weight: 0, color: "#1557ff" },
  gen: { id: "gen", name: "Clients, Responses API, agents, and tools", shortName: "Clients & agents", weight: 0, color: "#7856ff" },
  vision: { id: "vision", name: "Multimodal SDK workflows", shortName: "Multimodal SDK", weight: 0, color: "#e2552d" },
  language: { id: "language", name: "Language and speech SDK workflows", shortName: "Language SDK", weight: 0, color: "#14836f" },
  extract: { id: "extract", name: "Evaluations, datasets, and retrieval tools", shortName: "Evaluation & data", weight: 0, color: "#bd7800" },
};

const COPILOT_AREAS: Partial<Record<DomainId, DomainMeta>> = {
  plan: { id: "plan", name: "Copilot Studio governance, security, and ALM", shortName: "Governance & ALM", weight: 0, color: "#1557ff" },
  gen: { id: "gen", name: "Orchestration, tools, agents, and flows", shortName: "Orchestration & tools", weight: 0, color: "#7856ff" },
  vision: { id: "vision", name: "Multimodal Copilot Studio experiences", shortName: "Multimodal", weight: 0, color: "#e2552d" },
  language: { id: "language", name: "Topics, variables, and conversation design", shortName: "Topics & conversation", weight: 0, color: "#14836f" },
  extract: { id: "extract", name: "Knowledge grounding and agent evaluation", shortName: "Knowledge & evaluation", weight: 0, color: "#bd7800" },
};

function getTrackDomain(id: DomainId, track: PracticeTrack, exam: ExamId = "ai103"): DomainMeta {
  if (exam === "ab100") return AB100_DOMAINS.find((domain) => domain.id === id) ?? AB100_DOMAINS[0];
  if (track === "sdk") return SDK_AREAS[id] ?? getDomain(id);
  if (track === "copilot") return COPILOT_AREAS[id] ?? getDomain(id);
  return getDomain(id);
}

const QUESTION_BY_ID = new Map(ALL_QUESTIONS.map((question) => [question.id, question]));

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function equalAnswers(a: number[] = [], b: number[] = []): boolean {
  return a.length === b.length && [...a].sort((x, y) => x - y).every((value, index) => value === [...b].sort((x, y) => x - y)[index]);
}

function selectQuestions(exam: ExamId, track: PracticeTrack, length: ExamLength, recentIds: string[], includeClaude: boolean, focus: Focus | null = null): Question[] {
  const config = EXAM_CONFIG[exam][track][length];

  // A focused session ignores tracks and domain targets: it draws only from the
  // questions the focus names, topping up from the exam's pool if it runs short.
  if (focus) {
    const pool = ALL_QUESTIONS.filter((question) => (question.exam ?? "ai103") === exam);
    const matches = focus.kind === "missed"
      ? focus.ids.map((id) => QUESTION_BY_ID.get(id)).filter((question): question is Question => Boolean(question) && (question!.exam ?? "ai103") === exam)
      : pool.filter((question) => question.syllabus && focus.bullets.includes(question.syllabus.bullet));
    const picked = prioritizeUnseen([...new Map(matches.map((question) => [question.id, question])).values()], recentIds).slice(0, config.questions);
    if (picked.length < config.questions) {
      const chosen = new Set(picked.map((question) => question.id));
      picked.push(...prioritizeUnseen(pool.filter((question) => !chosen.has(question.id) && !question.caseStudyId), recentIds).slice(0, config.questions - picked.length));
    }
    return picked;
  }


  if (exam === "ab100") {
    const caseIds = prioritizeUnseenCases([...AB100_CASE_STUDY_IDS], AB100_QUESTIONS, recentIds).slice(0, config.caseStudies);
    const orderedCases = caseIds.flatMap((caseId) => AB100_QUESTIONS.filter((question) => question.caseStudyId === caseId));
    if (track === "cases") return orderedCases;

    const targets = { ...DOMAIN_TARGETS.ab100[length] } as Record<string, number>;
    orderedCases.forEach((question) => { targets[question.domain] = (targets[question.domain] ?? 0) - 1; });
    const standalone = AB100_DOMAINS.flatMap((domain) => {
      const candidates = AB100_QUESTIONS.filter((question) => question.domain === domain.id && !question.caseStudyId);
      return prioritizeUnseen(candidates, recentIds).slice(0, Math.max(0, targets[domain.id] ?? 0));
    });
    const picked = [...shuffle(standalone), ...orderedCases];
    if (picked.length < config.questions) {
      const chosen = new Set(picked.map((question) => question.id));
      picked.push(...prioritizeUnseen(AB100_QUESTIONS.filter((question) => !chosen.has(question.id) && !question.caseStudyId), recentIds).slice(0, config.questions - picked.length));
    }
    return picked.slice(0, config.questions);
  }

  if (track === "sdk" || track === "copilot") {
    const base = track === "sdk" ? FOUNDRY_SDK_QUESTIONS : COPILOT_STUDIO_QUESTIONS;
    const bank = includeClaude ? [...base, ...CLAUDE_QUESTIONS_BY_COLLECTION[track]] : base;
    return prioritizeUnseen(bank, recentIds).slice(0, config.questions);
  }
  const caseCandidates = prioritizeUnseenCases(CASE_STUDY_IDS, CORE_QUESTIONS, recentIds);
  const selectedCaseIds = caseCandidates.slice(0, config.caseStudies);
  const caseQuestions = selectedCaseIds.flatMap((caseId) => CORE_QUESTIONS.filter((question) => question.caseStudyId === caseId));
  const orderedCases = selectedCaseIds.flatMap((caseId) => caseQuestions.filter((question) => question.caseStudyId === caseId));
  if (track === "cases") return orderedCases;

  const targets = { ...DOMAIN_TARGETS.ai103[length] } as Record<string, number>;
  caseQuestions.forEach((question) => { targets[question.domain] = (targets[question.domain] ?? 0) - 1; });

  // The Claude bank widens the per-domain candidate pool, so the published domain
  // weighting is preserved whether or not the toggle is on.
  const corePool = includeClaude ? [...CORE_QUESTIONS, ...CLAUDE_QUESTIONS_BY_COLLECTION.core] : CORE_QUESTIONS;
  const standardQuestions = DOMAINS.flatMap((domain) => {
    const candidates = corePool.filter((question) => question.domain === domain.id && !question.caseStudyId);
    return prioritizeUnseen(candidates, recentIds).slice(0, Math.max(0, targets[domain.id] ?? 0));
  });

  const selected = [...shuffle(standardQuestions), ...orderedCases];
  if (selected.length < config.questions) {
    const selectedIds = new Set(selected.map((question) => question.id));
    const fill = prioritizeUnseen(corePool.filter((question) => !selectedIds.has(question.id)), recentIds).slice(0, config.questions - selected.length);
    selected.push(...fill);
  }
  return selected.slice(0, config.questions);
}

function emptyDomainStats(): Record<DomainId, AttemptDomainStat> {
  return {
    plan: { correct: 0, total: 0 },
    gen: { correct: 0, total: 0 },
    vision: { correct: 0, total: 0 },
    language: { correct: 0, total: 0 },
    extract: { correct: 0, total: 0 },
    "ab-plan": { correct: 0, total: 0 },
    "ab-design": { correct: 0, total: 0 },
    "ab-deploy": { correct: 0, total: 0 },
  };
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

function accuracy(correct: number, total: number): number {
  return total ? Math.round((correct / total) * 100) : 0;
}

/**
 * The skills-measured citation for whichever exam the question belongs to. Rendered
 * only after an answer is revealed, so the objective never narrows the choices while
 * the question is still open.
 */
function SyllabusNote({ question }: { question: Question }) {
  if (!question.syllabus) return null;
  const { domain, skill, bullet, docUrl, docTitle } = question.syllabus;
  return (
    <div className="syllabus-ref">
      <span className="syllabus-label">{EXAMS[question.exam ?? "ai103"].code} skills measured</span>
      <p className="syllabus-path">{domain} <i>›</i> {skill}</p>
      <p className="syllabus-bullet">{bullet}</p>
      <a href={docUrl} target="_blank" rel="noreferrer noopener">{docTitle} ↗</a>
    </div>
  );
}

export default function ExamApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>("real");
  const [examLength, setExamLength] = useState<ExamLength>("full");
  const [examId, setExamId] = useState<ExamId>("ai103");
  const [practiceTrack, setPracticeTrack] = useState<PracticeTrack>("exam");
  const [includeClaudeQuestions, setIncludeClaudeQuestions] = useState(false);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [glossaryFilter, setGlossaryFilter] = useState("");
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [recentQuestionIds, setRecentQuestionIds] = useState<string[]>([]);
  const [lastAttempt, setLastAttempt] = useState<Attempt | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [mobileNavigatorOpen, setMobileNavigatorOpen] = useState(false);
  const [caseSectionStart, setCaseSectionStart] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // The Claude bank is AI-103 only, and its questions carry no caseStudyId, so they
  // can join neither an AB-100 session nor a case-study section.
  const claudeApplies = examId === "ai103";
  const claudeAvailable = claudeApplies && practiceTrack !== "cases";
  const claudeEnabled = includeClaudeQuestions && claudeAvailable;
  const claudeExtraCount = claudeEnabled
    ? (practiceTrack === "exam" ? CLAUDE_QUESTIONS_BY_COLLECTION.core : CLAUDE_QUESTIONS_BY_COLLECTION[practiceTrack as "sdk" | "copilot"]).length
    : 0;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const state = JSON.parse(raw) as PersistedState;
        setAttempts(Array.isArray(state.attempts) ? state.attempts : []);
        setRecentQuestionIds(Array.isArray(state.recentQuestionIds) ? state.recentQuestionIds : []);
        setIncludeClaudeQuestions(state.includeClaudeQuestions === true);
        if (state.examId === "ab100" || state.examId === "ai103") setExamId(state.examId);
      }
    } catch {
      // The simulator remains fully usable when browser storage is unavailable.
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((nextAttempts: Attempt[], nextRecent: string[], nextIncludeClaude = includeClaudeQuestions) => {
    setAttempts(nextAttempts);
    setRecentQuestionIds(nextRecent);
    setIncludeClaudeQuestions(nextIncludeClaude);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ attempts: nextAttempts, recentQuestionIds: nextRecent, includeClaudeQuestions: nextIncludeClaude, examId } satisfies PersistedState));
    } catch {
      // Local persistence is a convenience; exam behavior does not depend on it.
    }
  }, [examId, includeClaudeQuestions]);

  const finishExam = useCallback(() => {
    if (!examQuestions.length) return;
    const stats = emptyDomainStats();
    const outcomes: QuestionOutcome[] = [];
    let correctCount = 0;
    examQuestions.forEach((question) => {
      const isCorrect = equalAnswers(answers[question.id], question.correct);
      outcomes.push({ id: question.id, correct: isCorrect });
      stats[question.domain].total += 1;
      if (isCorrect) {
        correctCount += 1;
        stats[question.domain].correct += 1;
      }
    });
    const score = Math.round((correctCount / examQuestions.length) * 100);
    const attempt: Attempt = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      completedAt: new Date().toISOString(),
      score,
      correct: correctCount,
      total: examQuestions.length,
      durationSeconds: EXAM_CONFIG[examId][practiceTrack][examLength].minutes * 60 - timeLeft,
      feedbackMode,
      examLength,
      practiceTrack,
      examId,
      domainStats: stats,
      outcomes,
    };
    const nextAttempts = [attempt, ...attempts].slice(0, 50);
    // Keep the complete bounded bank history. A global 125-item cap previously
    // evicted older IDs while hundreds of questions were still unseen, causing
    // avoidable repeats when users switched tracks or exams.
    const nextRecent = [...new Set([
      ...examQuestions.map((question) => question.id),
      ...recentQuestionIds,
    ])].filter((id) => QUESTION_BY_ID.has(id));
    persist(nextAttempts, nextRecent);
    setLastAttempt(attempt);
    setShowReview(false);
    setScreen("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [answers, attempts, examId, examLength, examQuestions, feedbackMode, persist, practiceTrack, recentQuestionIds, timeLeft]);

  useEffect(() => {
    if (screen !== "exam") return;
    if (timeLeft <= 0) {
      finishExam();
      return;
    }
    const timer = window.setInterval(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [finishExam, screen, timeLeft]);

  const startExam = () => {
    const selected = selectQuestions(examId, practiceTrack, examLength, recentQuestionIds, claudeEnabled, focus);
    // Reserve the session immediately. If someone leaves midway and starts again,
    // the selector should not hand back the same batch merely because no score was
    // recorded. The history remains bounded by QUESTION_BY_ID.
    const nextRecent = [...new Set([
      ...selected.map((question) => question.id),
      ...recentQuestionIds,
    ])].filter((id) => QUESTION_BY_ID.has(id));
    persist(attempts, nextRecent);
    setExamQuestions(selected);
    setCurrentIndex(0);
    setAnswers({});
    setChecked(new Set());
    setFlagged(new Set());
    setTimeLeft(EXAM_CONFIG[examId][practiceTrack][examLength].minutes * 60);
    setMobileNavigatorOpen(false);
    setCaseSectionStart(0);
    setScreen("exam");
    window.scrollTo({ top: 0 });
  };

  const currentQuestion = examQuestions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] ?? [] : [];
  const currentChecked = currentQuestion ? checked.has(currentQuestion.id) : false;
  const answeredCount = examQuestions.filter((question) => (answers[question.id] ?? []).length > 0).length;

  const selectAnswer = (optionIndex: number) => {
    if (!currentQuestion || currentChecked) return;
    const selected = answers[currentQuestion.id] ?? [];
    const next = currentQuestion.correct.length > 1
      ? selected.includes(optionIndex)
        ? selected.filter((item) => item !== optionIndex)
        : selected.length < currentQuestion.correct.length
          ? [...selected, optionIndex]
          : selected
      : [optionIndex];
    setAnswers((value) => ({ ...value, [currentQuestion.id]: next }));
  };

  const checkCurrent = () => {
    if (!currentQuestion || currentAnswer.length !== currentQuestion.correct.length) return;
    setChecked((value) => new Set(value).add(currentQuestion.id));
  };

  const goToQuestion = (index: number) => {
    if (practiceTrack === "cases" && examQuestions[index]?.caseStudyId !== examQuestions[currentIndex]?.caseStudyId) return;
    setCurrentIndex(index);
    setMobileNavigatorOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const leaveCaseStudy = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= examQuestions.length) {
      finishExam();
      return;
    }
    const unansweredInCase = examQuestions
      .slice(caseSectionStart, nextIndex)
      .filter((question) => !(answers[question.id] ?? []).length).length;
    const warning = unansweredInCase
      ? `This case has ${unansweredInCase} unanswered question${unansweredInCase === 1 ? "" : "s"}. After you leave this section, you cannot return. Continue?`
      : "After you leave this case-study section, you cannot return to it. Continue?";
    if (!window.confirm(warning)) return;
    setCaseSectionStart(nextIndex);
    setCurrentIndex(nextIndex);
    setMobileNavigatorOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Analytics are per exam: AB-100 and AI-103 measure different domains.
  const dashboardData = useMemo(() => {
    const examDomains = EXAMS[examId].domains;
    const examAttempts = attempts.filter((attempt) => (attempt.examId ?? "ai103") === examId);
    const aggregate = emptyDomainStats();
    examAttempts
      .filter((attempt) => attempt.practiceTrack === "exam" || attempt.practiceTrack === "cases")
      .forEach((attempt) => {
        examDomains.forEach((domain) => {
          aggregate[domain.id].correct += attempt.domainStats[domain.id]?.correct ?? 0;
          aggregate[domain.id].total += attempt.domainStats[domain.id]?.total ?? 0;
        });
      });
    const averageScore = examAttempts.length ? Math.round(examAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / examAttempts.length) : 0;
    const questionsAnswered = examAttempts.reduce((sum, attempt) => sum + attempt.total, 0);
    const bestScore = examAttempts.length ? Math.max(...examAttempts.map((attempt) => attempt.score)) : 0;
    const domainRows = examDomains.map((domain) => ({ ...domain, ...aggregate[domain.id], score: accuracy(aggregate[domain.id].correct, aggregate[domain.id].total) }));
    // Objective-level mastery, joined from stored outcomes back to each question's citation.
    const objectives = new Map<string, { bullet: string; skill: string; correct: number; total: number }>();
    const missed: string[] = [];
    for (const attempt of examAttempts) {
      for (const outcome of attempt.outcomes ?? []) {
        const question = QUESTION_BY_ID.get(outcome.id);
        if (!question?.syllabus) continue;
        const key = question.syllabus.bullet;
        if (!objectives.has(key)) objectives.set(key, { bullet: key, skill: question.syllabus.skill, correct: 0, total: 0 });
        const row = objectives.get(key)!;
        row.total += 1;
        if (outcome.correct) row.correct += 1;
        else if (!missed.includes(outcome.id)) missed.push(outcome.id);
      }
    }
    const objectiveRows = [...objectives.values()]
      .map((row) => ({ ...row, score: accuracy(row.correct, row.total) }))
      .sort((a, b) => a.score - b.score || b.total - a.total);
    const hasObjectiveData = objectiveRows.length > 0;
    return { averageScore, questionsAnswered, bestScore, domainRows, examAttempts, objectiveRows, hasObjectiveData, missed };
  }, [attempts, examId]);

  const startFocused = (next: Focus) => {
    setFocus(next);
    setPracticeTrack("exam");
    setFeedbackMode("review");
    setExamLength("short");
    setScreen("setup");
    window.scrollTo({ top: 0 });
  };

  const examBank = examId === "ab100" ? AB100_QUESTIONS : QUESTIONS;
  const examBankIds = useMemo(() => new Set(examBank.map((question) => question.id)), [examBank]);
  const examBankSeen = recentQuestionIds.filter((id) => examBankIds.has(id)).length;

  const nav = (active: "practice" | "cases" | "sdk" | "copilot" | "insights" | "learnmap" | "glossary") => (
    <nav className="topbar" aria-label="Primary navigation">
      <button className="brand brand-button" onClick={() => setScreen("home")} aria-label="Northstar Exam Lab home">
        <span className="brand-mark">N</span>
        <span>Northstar <strong>Exam Lab</strong></span>
      </button>
      <div className="nav-links">
        <button className={active === "practice" ? "active" : ""} onClick={() => { setPracticeTrack("exam"); setScreen("setup"); }}>Practice</button>
        <button className={active === "cases" ? "active" : ""} onClick={() => { setPracticeTrack("cases"); setScreen("setup"); }}>Case Studies</button>
        {TRACKS_BY_EXAM[examId].includes("sdk") && (
          <button className={active === "sdk" ? "active" : ""} onClick={() => { setPracticeTrack("sdk"); setScreen("setup"); }}>Foundry SDK</button>
        )}
        {TRACKS_BY_EXAM[examId].includes("copilot") && (
          <button className={active === "copilot" ? "active" : ""} onClick={() => { setPracticeTrack("copilot"); setScreen("setup"); }}>Copilot Studio</button>
        )}
        <button className={active === "insights" ? "active" : ""} onClick={() => setScreen("dashboard")}>Insights</button>
        <button className={active === "learnmap" ? "active" : ""} onClick={() => setScreen("learnmap")}>Learn Map</button>
        <button className={active === "glossary" ? "active" : ""} onClick={() => setScreen("glossary")}>Glossary</button>
      </div>
      <div className="exam-switch" role="group" aria-label="Choose exam">
        {(Object.keys(EXAMS) as ExamId[]).map((id) => (
          <button
            key={id}
            className={examId === id ? "active" : ""}
            aria-pressed={examId === id}
            title={EXAMS[id].name}
            onClick={() => { if (id === examId) return; setExamId(id); if (!TRACKS_BY_EXAM[id].includes(practiceTrack)) setPracticeTrack("exam"); }}
          >{EXAMS[id].code}</button>
        ))}
      </div>
    </nav>
  );

  if (!hydrated) {
    return <main className="loading-screen" aria-label="Loading Northstar Exam Lab"><span className="brand-mark">N</span></main>;
  }

  if (screen === "home") {
    return (
      <main className="shell">
        {nav(practiceTrack === "cases" ? "cases" : practiceTrack === "sdk" ? "sdk" : practiceTrack === "copilot" ? "copilot" : "practice")}
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">{examId === "ab100" ? "AB-100 · Agentic AI Business Solutions Architect" : "AI-103 · Foundry SDK · Copilot Studio"}</span>
            <h1>Practice with purpose.<br /><em>Pass with confidence.</em></h1>
            <p>{examId === "ab100" ? "Architecture and judgment scenarios across Dynamics 365, Power Platform, Copilot Studio, and Microsoft Foundry, with a dedicated case-study track." : "Implementation-heavy Azure scenarios, a dedicated case-study track, and a clear view of exactly where to spend your next study hour."}</p>
            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={() => { setPracticeTrack("exam"); setScreen("setup"); }}>Start a practice exam <span>→</span></button>
              <button className="hero-case-button" type="button" onClick={() => { setPracticeTrack("cases"); setScreen("setup"); }}>Practice case studies</button>
              {TRACKS_BY_EXAM[examId].includes("sdk") && <button className="hero-case-button" type="button" onClick={() => { setPracticeTrack("sdk"); setScreen("setup"); }}>Foundry SDK</button>}
              {TRACKS_BY_EXAM[examId].includes("copilot") && <button className="hero-case-button" type="button" onClick={() => { setPracticeTrack("copilot"); setScreen("setup"); }}>Copilot Studio</button>}
            </div>
            <span className="question-count bank-count">{examId === "ab100"
                ? <><strong>{AB100_QUESTIONS.length}</strong> original AB-100 questions · {AB100_CASE_STUDY_IDS.length} case studies</>
                : <><strong>{QUESTIONS.length}</strong> original questions · {CORE_QUESTIONS.length} AI-103 · {FOUNDRY_SDK_QUESTIONS.length} SDK · {COPILOT_STUDIO_QUESTIONS.length} Copilot Studio</>}</span>
          </div>
          <aside className="preview-card" aria-label="Sample question preview">
            <div className="preview-head"><span>Question 12 of 50</span><span className="timer">48:32</span></div>
            <div className="progress-track"><span /></div>
            <span className="topic-label">Foundry identity &amp; search</span>
            <h2>A Foundry agent runs successfully, but its Azure AI Search tool returns HTTP 403 when querying the policy index.</h2>
            <div className="answer-option selected"><span>A</span><p>Assign Search Index Data Reader to the project&apos;s managed identity.</p></div>
            <div className="answer-option"><span>B</span><p>Assign Foundry Agent Consumer to the Azure AI Search service.</p></div>
            <div className="preview-footer"><span>Scenario-based practice</span><button type="button" onClick={() => setScreen("setup")}>Try it now →</button></div>
          </aside>
        </section>
        <section className="signal-strip" aria-label="Product highlights">
          <div><span className="signal-icon">◎</span><p><strong>Azure implementation depth</strong><br />Services, SDKs, RBAC &amp; configuration</p></div>
          <div><span className="signal-icon">↗</span><p><strong>Actionable analytics</strong><br />Strengths and focus areas</p></div>
          <div><span className="signal-icon">∞</span><p><strong>Exam-style case sections</strong><br />Grouped scenarios with locked transitions</p></div>
        </section>
        {attempts.length > 0 && (
          <section className="return-strip">
            <div><span className="eyebrow">Welcome back</span><h2>Your latest score is {attempts[0].score}%.</h2></div>
            <button className="text-button" onClick={() => setScreen("dashboard")}>Open your dashboard →</button>
          </section>
        )}
      </main>
    );
  }

  if (screen === "setup") {
    const config = EXAM_CONFIG[examId][practiceTrack][examLength];
    return (
      <main className="shell">
        {nav(practiceTrack === "cases" ? "cases" : practiceTrack === "sdk" ? "sdk" : practiceTrack === "copilot" ? "copilot" : "practice")}
        <section className="setup-wrap">
          <div className="setup-intro">
            <button className="back-link" onClick={() => setScreen("home")}>← Back</button>
            <span className="eyebrow">Build your session</span>
            <h1>Choose how you want to practice.</h1>
            <p>{examId === "ab100" ? "Choose an AB-100 simulation weighted to the published domains, or work complete architect case studies. Questions rotate so repeat sessions stay fresh." : "Choose an AI-103 simulation, complete case studies, SDK implementation practice, or Copilot Studio architecture scenarios. Every bank is selected and rotated independently."}</p>
          </div>

          {focus && (
            <div className="focus-banner" role="status">
              <div><span className="eyebrow">Focused session</span><strong>{focus.label}</strong><p>{focus.kind === "missed" ? `Drawing from ${focus.ids.length} questions you previously answered incorrectly.` : `Drawing from questions that test your ${focus.bullets.length} weakest objectives.`} Track and domain weighting do not apply.</p></div>
              <button className="quiet-button" onClick={() => setFocus(null)}>Clear focus</button>
            </div>
          )}

          <div className="choice-section">
            <div className="choice-title"><span>01</span><div><h2>Practice track</h2><p>Choose the structure of your session.</p></div></div>
            <div className="choice-grid two">
              <button className={`choice-card ${practiceTrack === "exam" ? "selected" : ""}`} onClick={() => setPracticeTrack("exam")}>
                <span className="choice-kicker">Exam simulation</span><span className="choice-check">{practiceTrack === "exam" ? "✓" : ""}</span>
                <h3>Balanced assessment</h3><p>Weighted standalone questions with one or two complete case-study sections.</p><small>Best for overall readiness</small>
              </button>
              <button className={`choice-card ${practiceTrack === "cases" ? "selected" : ""}`} onClick={() => setPracticeTrack("cases")}>
                <span className="choice-kicker">Case Studies</span><span className="choice-check">{practiceTrack === "cases" ? "✓" : ""}</span>
                <h3>Scenario sections</h3><p>{examId === "ab100" ? "Complete business scenarios with grouped questions and locked section transitions." : "Complete Azure environments with grouped questions and locked section transitions."}</p><small>{(examId === "ab100" ? AB100_CASE_STUDY_IDS : CASE_STUDY_IDS).length} cases in the library</small>
              </button>
              {TRACKS_BY_EXAM[examId].includes("sdk") && <button className={`choice-card ${practiceTrack === "sdk" ? "selected" : ""}`} onClick={() => setPracticeTrack("sdk")}>
                <span className="choice-kicker">Foundry SDK</span><span className="choice-check">{practiceTrack === "sdk" ? "✓" : ""}</span>
                <h3>Code-first implementation</h3><p>Project endpoints, SDK 2.x clients, Responses API, agents, evaluations, authentication, and tracing.</p><small>{FOUNDRY_SDK_QUESTIONS.length} dedicated questions</small>
              </button>}
              {TRACKS_BY_EXAM[examId].includes("copilot") && <button className={`choice-card ${practiceTrack === "copilot" ? "selected" : ""}`} onClick={() => setPracticeTrack("copilot")}>
                <span className="choice-kicker">Copilot Studio</span><span className="choice-check">{practiceTrack === "copilot" ? "✓" : ""}</span>
                <h3>Agent architecture</h3><p>Orchestration, topics, knowledge, tools, authentication, governance, evaluation, and ALM.</p><small>{COPILOT_STUDIO_QUESTIONS.length} dedicated questions</small>
              </button>}
            </div>
          </div>

          <div className="choice-section">
            <div className="choice-title"><span>02</span><div><h2>Feedback mode</h2><p>Decide when answers are explained.</p></div></div>
            <div className="choice-grid two">
              <button className={`choice-card ${feedbackMode === "real" ? "selected" : ""}`} onClick={() => setFeedbackMode("real")}>
                <span className="choice-kicker">Real</span><span className="choice-check">{feedbackMode === "real" ? "✓" : ""}</span>
                <h3>Exam conditions</h3><p>No correctness feedback until you submit the entire session.</p><small>Best for readiness checks</small>
              </button>
              <button className={`choice-card ${feedbackMode === "review" ? "selected" : ""}`} onClick={() => setFeedbackMode("review")}>
                <span className="choice-kicker">Review</span><span className="choice-check">{feedbackMode === "review" ? "✓" : ""}</span>
                <h3>Learn as you go</h3><p>Check each response immediately with an explanation.</p><small>Best for active learning</small>
              </button>
            </div>
          </div>

          <div className="choice-section">
            <div className="choice-title"><span>03</span><div><h2>Session length</h2><p>Choose your available study window.</p></div></div>
            <div className="choice-grid two">
              <button className={`choice-card compact ${examLength === "full" ? "selected" : ""}`} onClick={() => setExamLength("full")}>
                <span className="choice-kicker">Full</span><span className="choice-check">{examLength === "full" ? "✓" : ""}</span>
                <h3>{practiceTrack === "cases" ? `${config.caseStudies} cases · ${config.questions} questions` : practiceTrack === "sdk" ? `${config.questions} of ${FOUNDRY_SDK_QUESTIONS.length} questions` : practiceTrack === "copilot" ? `${config.questions} of ${COPILOT_STUDIO_QUESTIONS.length} questions` : `${config.questions} questions · ${config.minutes} min`}</h3><p>{practiceTrack === "cases" ? "Six locked case sections with a 90-minute timer." : practiceTrack === "sdk" ? "A 70-minute deep SDK implementation session." : practiceTrack === "copilot" ? "A 40-minute Copilot Studio architecture session." : "Typical certification-exam length with two case-study blocks."}</p>
              </button>
              <button className={`choice-card compact ${examLength === "short" ? "selected" : ""}`} onClick={() => setExamLength("short")}>
                <span className="choice-kicker">Short</span><span className="choice-check">{examLength === "short" ? "✓" : ""}</span>
                <h3>{practiceTrack === "cases" ? `${config.caseStudies} cases · ${config.questions} questions` : practiceTrack === "sdk" ? `${config.questions} of ${FOUNDRY_SDK_QUESTIONS.length} questions` : practiceTrack === "copilot" ? `${config.questions} of ${COPILOT_STUDIO_QUESTIONS.length} questions` : `${config.questions} questions · ${config.minutes} min`}</h3><p>{practiceTrack === "cases" ? "Three locked case sections with a 45-minute timer." : practiceTrack === "sdk" ? "A focused 35-minute SDK session." : practiceTrack === "copilot" ? "A focused 20-minute Copilot Studio session." : "Half-length session with one case-study block."}</p>
              </button>
            </div>
          </div>

          {claudeApplies && <div className="choice-section">
            <div className="choice-title"><span>04</span><div><h2>Question sources</h2><p>Add the referenced question bank to this session.</p></div></div>
            <label className={`source-toggle ${claudeEnabled ? "selected" : ""} ${claudeAvailable ? "" : "unavailable"}`}>
              <input
                type="checkbox"
                checked={claudeEnabled}
                disabled={!claudeAvailable}
                onChange={(event) => setIncludeClaudeQuestions(event.target.checked)}
              />
              <span className="source-toggle-body">
                <strong>Claude questions</strong>
                <span>{CLAUDE_QUESTIONS.length} additional questions that cite a specific AI-103 skills-measured objective and link the Microsoft Learn page for the feature under test. Includes Foundry SDK code examples.</span>
                {!claudeAvailable && <em>Not available in the Case Studies track — these questions are not part of a case section.</em>}
              </span>
            </label>
          </div>}

          <div className="launch-bar">
            <div><span>{TRACK_LABELS[examId][practiceTrack]} · {feedbackMode === "real" ? "Real" : "Review"} · {examLength === "full" ? "Full" : "Short"}{claudeEnabled ? " · Claude questions" : ""}</span><strong>{config.questions} questions · {config.minutes} minutes{config.caseStudies ? ` · ${config.caseStudies} case ${config.caseStudies === 1 ? "study" : "studies"}` : ""}{claudeExtraCount ? ` · +${claudeExtraCount} in the pool` : ""}</strong></div>
            <button className="primary-button" onClick={startExam}>Begin session <span>→</span></button>
          </div>
          <p className="integrity-note">Questions are original and aligned to Microsoft&apos;s published study guides and product documentation. This facility does not use or reproduce exam dumps.</p>
        </section>
      </main>
    );
  }

  if (screen === "exam" && currentQuestion) {
    const domain = getTrackDomain(currentQuestion.domain, practiceTrack, examId);
    const isCorrect = currentChecked && equalAnswers(currentAnswer, currentQuestion.correct);
    const isCaseStart = currentQuestion.caseStudyId && (currentIndex === 0 || examQuestions[currentIndex - 1]?.caseStudyId !== currentQuestion.caseStudyId);
    const caseStudy = currentQuestion.caseStudyId ? casesForExam(examId)[currentQuestion.caseStudyId] : null;
    const sessionCaseIds = [...new Set(examQuestions.map((question) => question.caseStudyId).filter((id): id is string => Boolean(id)))];
    const currentCasePosition = currentQuestion.caseStudyId ? sessionCaseIds.indexOf(currentQuestion.caseStudyId) : -1;
    const currentCaseQuestions = currentQuestion.caseStudyId ? examQuestions.filter((question) => question.caseStudyId === currentQuestion.caseStudyId) : [];
    const questionInCase = currentCaseQuestions.findIndex((question) => question.id === currentQuestion.id) + 1;
    const isLastInCase = practiceTrack === "cases" && currentQuestion.caseStudyId !== examQuestions[currentIndex + 1]?.caseStudyId;
    return (
      <main className="exam-shell">
        <header className="exam-header">
          <button className="brand brand-button" onClick={() => setScreen("home")}><span className="brand-mark">N</span><span className="desktop-only">Northstar <strong>Exam Lab</strong></span></button>
          <div className="exam-progress"><span>{answeredCount} of {examQuestions.length} answered</span><div><i style={{ width: `${(answeredCount / examQuestions.length) * 100}%` }} /></div></div>
          <div className={`exam-clock ${timeLeft < 300 ? "urgent" : ""}`}><span>Time remaining</span><strong>{formatTime(timeLeft)}</strong></div>
        </header>

        <div className="exam-layout">
          <aside className={`question-nav ${mobileNavigatorOpen ? "open" : ""}`}>
            <div className="navigator-head"><div><span className="eyebrow">{practiceTrack === "cases" ? `Case ${currentCasePosition + 1} of ${sessionCaseIds.length}` : "Session navigator"}</span><h2>{practiceTrack === "cases" ? caseStudy?.organization : "Questions"}</h2></div><button onClick={() => setMobileNavigatorOpen(false)} aria-label="Close question navigator">×</button></div>
            <div className="question-grid">
              {examQuestions.map((question, index) => {
                const answered = (answers[question.id] ?? []).length > 0;
                const accessible = practiceTrack !== "cases" || question.caseStudyId === currentQuestion.caseStudyId;
                const locked = practiceTrack === "cases" && index < caseSectionStart;
                return <button key={question.id} disabled={!accessible} className={`${index === currentIndex ? "current" : ""} ${answered ? "answered" : ""} ${flagged.has(question.id) ? "flagged" : ""} ${locked ? "locked" : ""} ${!accessible && !locked ? "future" : ""}`} onClick={() => goToQuestion(index)} aria-label={`Question ${index + 1}${answered ? ", answered" : ""}${locked ? ", locked" : ""}`}>{index + 1}</button>;
              })}
            </div>
            <div className="legend"><span><i className="dot current" />Current</span><span><i className="dot answered" />Answered</span><span><i className="flag-mini">◆</i>Flagged</span></div>
            {practiceTrack !== "cases" ? <button className="submit-outline" onClick={finishExam}>Finish &amp; score session</button> : <p className="section-lock-note">Questions from earlier case sections are locked after you continue.</p>}
          </aside>

          <section className="question-stage">
            <div className="mobile-exam-tools"><button onClick={() => setMobileNavigatorOpen(true)}>☷ Question map</button><span>{currentIndex + 1}/{examQuestions.length}</span></div>
            {practiceTrack === "cases" && (
              <div className="case-section-banner"><span>Case study {currentCasePosition + 1} of {sessionCaseIds.length}</span><strong>{caseStudy?.organization}</strong><p>Review answers within this case before continuing. You cannot return after leaving the section.</p></div>
            )}
            {caseStudy && (
              <details className="case-panel" open={Boolean(isCaseStart)}>
                <summary><span>{caseStudy.title}</span><small>{isCaseStart ? "Read the scenario" : "View scenario"}</small></summary>
                <div className="case-body">
                  <p><strong>Background</strong>{caseStudy.background}</p>
                  <div><strong>Existing environment</strong><ul>{caseStudy.existingEnvironment.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div><strong>Requirements</strong><ul>{caseStudy.requirements.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div><strong>Constraints</strong><ul>{caseStudy.constraints.map((item) => <li key={item}>{item}</li>)}</ul></div>
                </div>
              </details>
            )}
            <div className="question-meta"><span className="domain-pill" style={{ color: domain.color, borderColor: `${domain.color}55`, background: `${domain.color}0d` }}>{domain.shortName}</span><span>{currentQuestion.difficulty}</span>{currentQuestion.source === "claude" && <span className="source-pill">Claude</span>}<span>{practiceTrack === "cases" ? `Question ${questionInCase} of ${currentCaseQuestions.length} in this case` : `Question ${currentIndex + 1} of ${examQuestions.length}`}</span></div>
            <div className="question-card">
              <div className="question-card-head"><span>{currentQuestion.topic}</span><button className={flagged.has(currentQuestion.id) ? "flag-active" : ""} onClick={() => setFlagged((value) => { const next = new Set(value); if (next.has(currentQuestion.id)) next.delete(currentQuestion.id); else next.add(currentQuestion.id); return next; })}>◆ {flagged.has(currentQuestion.id) ? "Flagged" : "Flag for review"}</button></div>
              <h1>{currentQuestion.prompt}</h1>
              {currentQuestion.code && (
                <pre className="question-code" data-language={currentQuestion.code.language}><code>{currentQuestion.code.snippet}</code></pre>
              )}
              <p className="select-instruction">{currentQuestion.correct.length > 1 ? `Select ${currentQuestion.correct.length} answers.` : "Select one answer."}</p>
              <div className="exam-options">
                {currentQuestion.options.map((option, index) => {
                  const selected = currentAnswer.includes(index);
                  const correctOption = currentChecked && currentQuestion.correct.includes(index);
                  const wrongSelected = currentChecked && selected && !currentQuestion.correct.includes(index);
                  return (
                    <button key={option} disabled={currentChecked} className={`${selected ? "selected" : ""} ${correctOption ? "correct" : ""} ${wrongSelected ? "wrong" : ""}`} onClick={() => selectAnswer(index)}>
                      <span>{String.fromCharCode(65 + index)}</span><p>{option}</p>{selected && <i>{currentQuestion.correct.length > 1 ? "✓" : "●"}</i>}
                    </button>
                  );
                })}
              </div>
              {currentChecked && (
                <div className={`feedback-panel ${isCorrect ? "success" : "error"}`} role="status">
                  <strong>{isCorrect ? "Correct" : "Not quite"}</strong>
                  <p>{currentQuestion.explanation}</p>
                  <SyllabusNote question={currentQuestion} />
                </div>
              )}
            </div>
            <div className="exam-actions">
              <button className="secondary-button" disabled={practiceTrack === "cases" ? currentIndex === caseSectionStart : currentIndex === 0} onClick={() => goToQuestion(currentIndex - 1)}>← Previous</button>
              <div>
                {feedbackMode === "review" && !currentChecked ? (
                  <button className="primary-button" disabled={currentAnswer.length !== currentQuestion.correct.length} onClick={checkCurrent}>Check answer</button>
                ) : isLastInCase && currentIndex < examQuestions.length - 1 ? (
                  <button className="primary-button" onClick={leaveCaseStudy}>Submit case &amp; continue →</button>
                ) : currentIndex === examQuestions.length - 1 ? (
                  <button className="primary-button" onClick={finishExam}>Finish exam →</button>
                ) : (
                  <button className="primary-button" onClick={() => goToQuestion(currentIndex + 1)}>Next question →</button>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (screen === "results" && lastAttempt) {
    const passed = lastAttempt.score >= PASS_SCORE;
    const reviewedQuestions = showReview ? examQuestions : examQuestions.slice(0, 3);
    const resultDomains = EXAMS[lastAttempt.examId ?? "ai103"].domains
      .map((domain) => getTrackDomain(domain.id, lastAttempt.practiceTrack, lastAttempt.examId ?? "ai103"))
      .filter((domain) => lastAttempt.domainStats[domain.id].total > 0);
    return (
      <main className="shell results-page">
        {nav(lastAttempt.practiceTrack === "cases" ? "cases" : lastAttempt.practiceTrack === "sdk" ? "sdk" : lastAttempt.practiceTrack === "copilot" ? "copilot" : "practice")}
        <section className="results-hero">
          <span className="eyebrow">Session complete</span>
          <div className="score-ring" style={{ "--score": `${lastAttempt.score * 3.6}deg` } as React.CSSProperties}><div><strong>{lastAttempt.score}%</strong><span>{passed ? "Ready signal" : "Keep building"}</span></div></div>
          <h1>{passed ? "Strong work. You crossed the readiness line." : "Good diagnostic. Your next focus is clear."}</h1>
          <p>{lastAttempt.correct} of {lastAttempt.total} correct · {formatDuration(lastAttempt.durationSeconds)} · {TRACK_LABELS[lastAttempt.examId ?? "ai103"][lastAttempt.practiceTrack]} · {lastAttempt.feedbackMode === "real" ? "Real" : "Review"} mode</p>
          <div className="result-actions"><button className="primary-button" onClick={() => setScreen("setup")}>Start another session →</button><button className="secondary-button" onClick={() => setScreen("dashboard")}>Open dashboard</button></div>
        </section>

        <section className="results-content">
          <div className="section-heading"><div><span className="eyebrow">Domain breakdown</span><h2>Where the score came from</h2></div><span className="pass-key">Readiness line · {PASS_SCORE}%</span></div>
          <div className="domain-result-grid">
            {resultDomains.map((domain) => {
              const stat = lastAttempt.domainStats[domain.id];
              const score = accuracy(stat.correct, stat.total);
              return <div className="domain-result" key={domain.id}><div><span style={{ background: domain.color }} /><strong>{domain.shortName}</strong><b>{score}%</b></div><div className="metric-track"><i style={{ width: `${score}%`, background: domain.color }} /><em /></div><p>{stat.correct} of {stat.total} correct · {score >= 80 ? "Strong" : score >= 70 ? "On track" : "Review next"}</p></div>;
            })}
          </div>
        </section>

        <section className="answer-review-section">
          <div className="section-heading"><div><span className="eyebrow">Answer review</span><h2>Learn from every decision</h2></div><button className="text-button" onClick={() => setShowReview((value) => !value)}>{showReview ? "Show less" : `Review all ${examQuestions.length}`} →</button></div>
          <div className="review-list">
            {reviewedQuestions.map((question, index) => {
              const selected = answers[question.id] ?? [];
              const correct = equalAnswers(selected, question.correct);
              return <article key={question.id} className={`review-item ${correct ? "correct" : "wrong"}`}><div className="review-number">{index + 1}</div><div><span>{getTrackDomain(question.domain, lastAttempt.practiceTrack, lastAttempt.examId ?? "ai103").shortName} · {question.topic}</span><h3>{question.prompt}</h3><p><strong>{correct ? "Correct." : `Correct answer: ${question.correct.map((answer) => String.fromCharCode(65 + answer)).join(", ")}.`}</strong> {question.explanation}</p><SyllabusNote question={question} /></div></article>;
            })}
          </div>
        </section>
      </main>
    );
  }

  if (screen === "glossary") {
    const needle = glossaryFilter.trim().toLowerCase();
    const areas = GLOSSARY
      .map((area) => ({
        ...area,
        entries: needle
          ? area.entries.filter((entry) => `${entry.term} ${entry.definition} ${entry.vs ?? ""}`.toLowerCase().includes(needle))
          : area.entries,
      }))
      .filter((area) => area.entries.length > 0);
    const shown = areas.reduce((n, area) => n + area.entries.length, 0);
    return (
      <main className="shell glossary-page">
        {nav("glossary")}
        <section className="dashboard-wrap">
          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">Vocabulary</span>
              <h1>Exam glossary</h1>
              <p>{GLOSSARY_TERM_COUNT} terms grouped by the documentation tree each belongs to, so this and the Learn Map reinforce the same mental model. Each definition is the shortest thing that separates the term from what it is confused with.</p>
            </div>
            <button className="primary-button" onClick={() => setScreen("learnmap")}>Learn Map →</button>
          </div>

          <div className="glossary-search">
            <input
              type="search"
              value={glossaryFilter}
              placeholder="Filter terms and definitions"
              aria-label="Filter the glossary"
              onChange={(event) => setGlossaryFilter(event.target.value)}
            />
            <span>{needle ? `${shown} of ${GLOSSARY_TERM_COUNT}` : `${GLOSSARY_TERM_COUNT} terms`}</span>
          </div>

          {areas.length === 0 ? (
            <div className="empty-state"><span>◎</span><h3>No terms match “{glossaryFilter}”</h3><p>Try a service name, a role, or a concept such as grounding or residency.</p></div>
          ) : areas.map((area) => (
            <section className="analytics-card glossary-area" key={area.key}>
              <div className="card-heading">
                <div><span className="eyebrow">{area.root}</span><h2>{area.label}</h2></div>
                <span className="sample-label">{area.entries.length} terms</span>
              </div>
              <dl className="glossary-list">
                {area.entries.map((entry) => (
                  <div className="glossary-entry" key={entry.term}>
                    <dt>{entry.term}</dt>
                    <dd>
                      {entry.definition}
                      {entry.vs && <em className="glossary-vs">Not: {entry.vs}</em>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </section>
      </main>
    );
  }

  if (screen === "learnmap") {
    const map = LEARN_MAP[examId];
    return (
      <main className="shell learnmap-page">
        {nav("learnmap")}
        <section className="dashboard-wrap">
          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">Open-book navigation</span>
              <h1>Microsoft Learn map for {map.code}</h1>
              <p>Learn is available during this exam, but no extra time is added. {map.totalQuestions} questions in this bank cite {map.trees.reduce((n, tree) => n + tree.pages.length, 0)} pages, and the first {map.coreTrees.length} trees carry {map.coreShare}% of them.</p>
            </div>
            <button className="primary-button" onClick={() => setScreen("setup")}>Back to practice →</button>
          </div>

          <div className="learn-budget"><strong>Lookup budget</strong><span>{LEARN_BUDGET}</span></div>

          <div className="dashboard-grid">
            <section className="analytics-card">
              <div className="card-heading"><div><span className="eyebrow">Before you start</span><h2>Rules of engagement</h2></div></div>
              <ul className="learn-list">{LEARN_RULES.map((rule) => <li key={rule}>{rule}</li>)}</ul>
            </section>
            <section className="analytics-card">
              <div className="card-heading"><div><span className="eyebrow">Triage</span><h2>Look up tables, not concepts</h2></div></div>
              <p className="learn-sub">Worth the clock</p>
              <ul className="learn-list good">{LEARN_TRIAGE.lookUp.map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="learn-sub">Not worth the clock</p>
              <ul className="learn-list bad">{LEARN_TRIAGE.dontLookUp.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          </div>

          <section className="analytics-card">
            <div className="card-heading"><div><span className="eyebrow">Fast paths</span><h2>Page and search term for each lookup worth making</h2></div></div>
            <div className="fastpath-table" role="table">
              <div className="fastpath-row fastpath-head" role="row"><span>Answers</span><span>Page</span><span>Ctrl+F</span></div>
              {map.fastPaths.map((path) => (
                <div className="fastpath-row" role="row" key={path.url + path.answers}>
                  <span>{path.answers}</span>
                  <a href={path.url} target="_blank" rel="noreferrer noopener">{path.title} ↗</a>
                  <code>{path.find}</code>
                </div>
              ))}
            </div>
            <p className="learn-strategy">{LEARN_TAB_STRATEGY}</p>
          </section>

          <section className="analytics-card">
            <div className="card-heading"><div><span className="eyebrow">The territory</span><h2>Documentation trees</h2></div><span className="sample-label">Ordered by citations</span></div>
            <div className="tree-list">
              {map.trees.map((tree) => (
                <details key={tree.root} className="tree-item" open={map.coreTrees.includes(tree.root)}>
                  <summary>
                    <span className={map.coreTrees.includes(tree.root) ? "tree-name core" : "tree-name"}>{tree.label}</span>
                    <code>/{tree.root}/</code>
                    <small>{tree.questions} question{tree.questions === 1 ? "" : "s"} · {tree.pages.length} page{tree.pages.length === 1 ? "" : "s"}</small>
                  </summary>
                  <a className="tree-root-link" href={tree.rootUrl} target="_blank" rel="noreferrer noopener">Open tree root ↗</a>
                  <ul className="page-list">
                    {tree.pages.map((page) => (
                      <li key={page.url}><a href={page.url} target="_blank" rel="noreferrer noopener">{page.title}</a><em>{page.questions}q</em></li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          <section className="analytics-card">
            <div className="card-heading"><div><span className="eyebrow">Skip these</span><h2>Do not bother</h2></div></div>
            <ul className="learn-list bad">{LEARN_DONT_BOTHER.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        </section>
      </main>
    );
  }

  const domainRows = [...dashboardData.domainRows].sort((a, b) => (a.total ? a.score : -1) - (b.total ? b.score : -1));
  const weakest = domainRows.slice(0, 2);
  return (
    <main className="shell dashboard-page">
      {nav("insights")}
      <section className="dashboard-wrap">
        <div className="dashboard-heading">
          <div><span className="eyebrow">Learning analytics</span><h1>Your practice readiness dashboard</h1><p>{examId === "ab100" ? "Built from AB-100 practice and case-study sessions completed on this device." : "Built from AI-103, case-study, Foundry SDK, and Copilot Studio sessions completed on this device."}</p></div>
          <button className="primary-button" onClick={() => setScreen("setup")}>New practice session →</button>
        </div>

        <div className="metric-cards">
          <article className="metric-card featured"><span>Average score</span><strong>{dashboardData.averageScore}%</strong><p>{attempts.length ? (dashboardData.averageScore >= 70 ? "At or above the readiness line" : `${70 - dashboardData.averageScore} points to the readiness line`) : "Complete a session to establish your baseline"}</p></article>
          <article className="metric-card"><span>Best score</span><strong>{dashboardData.bestScore}%</strong><p>Across {dashboardData.examAttempts.length} completed {dashboardData.examAttempts.length === 1 ? "session" : "sessions"}</p></article>
          <article className="metric-card"><span>Questions answered</span><strong>{dashboardData.questionsAnswered}</strong><p>{Math.min(100, Math.round((examBankSeen / examBank.length) * 100))}% of the {EXAMS[examId].code} bank recently seen</p></article>
          <article className="metric-card"><span>Bank coverage</span><strong>{examBankSeen}<small> / {examBank.length}</small></strong><p>Retries favor questions outside your recent history</p></article>
        </div>

        <div className="dashboard-grid">
          <section className="analytics-card domain-card">
            <div className="card-heading"><div><span className="eyebrow">{EXAMS[examId].code} skills measured</span><h2>Core performance by domain</h2></div><span className="sample-label">Blueprint tracks only</span></div>
            <div className="dashboard-domains">
              {dashboardData.domainRows.map((domain) => (
                <div key={domain.id} className="dashboard-domain">
                  <div><span className="domain-swatch" style={{ background: domain.color }} /><strong>{domain.shortName}</strong><b>{domain.total ? `${domain.score}%` : "—"}</b></div>
                  <div className="metric-track"><i style={{ width: `${domain.score}%`, background: domain.color }} /><em /></div>
                  <p>{domain.total ? `${domain.correct}/${domain.total} correct · ${domain.score >= 80 ? "Strong area" : domain.score >= 70 ? "Developing" : "Needs attention"}` : "No data yet"}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="analytics-card focus-card">
            <div className="card-heading"><div><span className="eyebrow">Recommended next</span><h2>Focus queue</h2></div></div>
            <div className="focus-list">
              {weakest.map((domain, index) => (
                <article key={domain.id}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{domain.shortName}</h3><p>{(examId === "ab100" ? FOCUS_TIPS_AB100 : FOCUS_TIPS)[domain.id]}</p><small>{domain.total ? `${domain.score}% current accuracy` : `${Math.round(domain.weight * 100)}% of exam blueprint`}</small></div></article>
              ))}
            </div>
            <button
              className="secondary-button full-width"
              disabled={!dashboardData.hasObjectiveData}
              onClick={() => startFocused({
                kind: "weak-objectives",
                bullets: dashboardData.objectiveRows.slice(0, 8).map((row) => row.bullet),
                label: "Weakest objectives",
              })}
            >Drill my weakest objectives →</button>
            <button
              className="quiet-button full-width"
              disabled={!dashboardData.missed.length}
              onClick={() => startFocused({ kind: "missed", ids: dashboardData.missed, label: "Questions I got wrong" })}
            >Practice what I got wrong ({dashboardData.missed.length})</button>
            {!dashboardData.hasObjectiveData && <p className="objective-note">Objective-level data starts from your next completed session.</p>}
          </section>
        </div>

        {dashboardData.hasObjectiveData && (
          <section className="analytics-card objective-card">
            <div className="card-heading"><div><span className="eyebrow">{EXAMS[examId].code} objectives</span><h2>Weakest skills-measured objectives</h2></div><span className="sample-label">{dashboardData.objectiveRows.length} seen</span></div>
            <div className="objective-list">
              {dashboardData.objectiveRows.slice(0, 8).map((row) => (
                <article key={row.bullet} className="objective-row">
                  <div className="objective-head"><span>{row.skill}</span><b className={row.score >= 70 ? "" : "weak"}>{row.score}%</b></div>
                  <p>{row.bullet}</p>
                  <div className="metric-track"><i style={{ width: `${row.score}%`, background: row.score >= 80 ? "var(--green)" : row.score >= 70 ? "var(--blue)" : "var(--red)" }} /><em /></div>
                  <small>{row.correct} of {row.total} correct</small>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="analytics-card history-card">
          <div className="card-heading"><div><span className="eyebrow">History</span><h2>Recent sessions</h2></div>{attempts.length > 0 && <button className="quiet-button" onClick={() => { if (window.confirm("Clear all local practice history and retry tracking?")) { persist([], []); } }}>Clear local history</button>}</div>
          {attempts.length === 0 ? (
            <div className="empty-state"><span>◎</span><h3>No completed sessions yet</h3><p>Take a practice exam to populate your readiness metrics and focus areas.</p><button className="primary-button" onClick={() => setScreen("setup")}>Start your baseline →</button></div>
          ) : (
            <div className="history-table" role="table" aria-label="Recent practice sessions">
              <div className="history-row history-head" role="row"><span>Date</span><span>Mode</span><span>Length</span><span>Duration</span><span>Score</span></div>
              {attempts.slice(0, 8).map((attempt) => {
                const attemptConfig = EXAM_CONFIG[attempt.examId ?? "ai103"][attempt.practiceTrack][attempt.examLength];
                return <div className="history-row" role="row" key={attempt.id}><span>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(attempt.completedAt))}</span><span>{TRACK_LABELS[attempt.examId ?? "ai103"][attempt.practiceTrack]}</span><span>{attempt.practiceTrack === "cases" ? `${attemptConfig.caseStudies} cases` : `${attempt.examLength === "full" ? "Full" : "Short"} · ${attemptConfig.questions}`}</span><span>{formatDuration(attempt.durationSeconds)}</span><strong className={attempt.score >= 70 ? "pass" : "build"}>{attempt.score}%</strong></div>;
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
