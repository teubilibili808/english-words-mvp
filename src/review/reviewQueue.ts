import { WordItem } from '../mock/words';

export const DAILY_REVIEW_LIMIT = 20;

function getDateText(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildReviewQueue(words: WordItem[]) {
  const today = getDateText(new Date());
  return words
    .filter((item) => item.nextReviewDate <= today)
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate))
    .slice(0, DAILY_REVIEW_LIMIT);
}
