import { WordItem, WordLevel } from '../mock/words';

export const DAILY_REVIEW_LIMIT = 20;
const levelPriority: Record<WordLevel, number> = {
  A: 0,
  B: 1,
  C: 2,
};
const baseIntervalByMemoryLevel: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};
const levelFactorByLevel: Record<WordLevel, number> = {
  A: 0.8,
  B: 1.0,
  C: 1.2,
};

function getDateText(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildReviewQueue(words: WordItem[]) {
  const today = getDateText(new Date());
  return words
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.nextReviewDate <= today)
    .sort((a, b) => {
      const dateCompare = a.item.nextReviewDate.localeCompare(b.item.nextReviewDate);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      const forgetCompare = b.item.forgetStreak - a.item.forgetStreak;
      if (forgetCompare !== 0) {
        return forgetCompare;
      }

      const levelCompare = levelPriority[a.item.level] - levelPriority[b.item.level];
      if (levelCompare !== 0) {
        return levelCompare;
      }

      return a.index - b.index;
    })
    .slice(0, DAILY_REVIEW_LIMIT)
    .map(({ item }) => item);
}

export function buildOverflowQueue(words: WordItem[], currentQueueIds: string[]) {
  const today = getDateText(new Date());
  const currentIdSet = new Set(currentQueueIds);
  return words
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.nextReviewDate <= today && !currentIdSet.has(item.id))
    .sort((a, b) => {
      const forgetCompare = b.item.forgetStreak - a.item.forgetStreak;
      if (forgetCompare !== 0) {
        return forgetCompare;
      }

      const dateCompare = a.item.nextReviewDate.localeCompare(b.item.nextReviewDate);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      const levelCompare = levelPriority[a.item.level] - levelPriority[b.item.level];
      if (levelCompare !== 0) {
        return levelCompare;
      }

      return a.index - b.index;
    })
    .map(({ item }) => item);
}

export function calculateRememberedInterval(memoryLevel: number, level: WordLevel) {
  const normalizedMemoryLevel = Math.min(Math.max(Math.round(memoryLevel), 1), 5) as
    | 1
    | 2
    | 3
    | 4
    | 5;
  const baseInterval = baseIntervalByMemoryLevel[normalizedMemoryLevel];
  const levelFactor = levelFactorByLevel[level];
  return Math.round(baseInterval * levelFactor);
}
