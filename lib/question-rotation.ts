export interface IdentifiedQuestion {
  id: string;
  caseStudyId?: string;
}

/**
 * Put never-seen questions first. Once a pool has been exhausted, recycle the
 * least-recently seen questions before anything from the latest session.
 * `historyIds` is stored newest-first.
 */
export function prioritizeUnseen<T extends IdentifiedQuestion>(items: T[], historyIds: string[]): T[] {
  const historyIndex = new Map(historyIds.map((id, index) => [id, index]));
  const randomized = shuffle(items);
  return randomized.sort((a, b) => {
    const aIndex = historyIndex.get(a.id);
    const bIndex = historyIndex.get(b.id);
    if (aIndex === undefined && bIndex !== undefined) return -1;
    if (aIndex !== undefined && bIndex === undefined) return 1;
    if (aIndex === undefined || bIndex === undefined) return 0;
    return bIndex - aIndex;
  });
}

/** Case sections stay intact, so freshness is ranked at case level. */
export function prioritizeUnseenCases<T extends IdentifiedQuestion>(caseIds: string[], questions: T[], historyIds: string[]): string[] {
  const historyIndex = new Map(historyIds.map((id, index) => [id, index]));
  return shuffle(caseIds).sort((a, b) => {
    const score = (caseId: string) => {
      const caseQuestions = questions.filter((question) => question.caseStudyId === caseId);
      const unseen = caseQuestions.filter((question) => !historyIndex.has(question.id)).length;
      const age = caseQuestions.reduce((total, question) => total + (historyIndex.get(question.id) ?? historyIds.length), 0);
      return unseen * (historyIds.length + 1) + age;
    };
    return score(b) - score(a);
  });
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
