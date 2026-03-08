export type WordLevel = 'A' | 'B' | 'C';

export type WordItem = {
  id: string;
  word: string;
  meaning: string;
  level: WordLevel;
  isDifficult: boolean;
  note: string;
  nextReviewDate: string;
};

export const mockWords: WordItem[] = [
  {
    id: 'w-001',
    word: 'abandon',
    meaning: '放弃',
    level: 'B',
    isDifficult: false,
    note: '常见于阅读理解',
    nextReviewDate: '2026-03-08',
  },
  {
    id: 'w-002',
    word: 'keen',
    meaning: '热衷的',
    level: 'A',
    isDifficult: false,
    note: '搭配 on',
    nextReviewDate: '2026-03-09',
  },
  {
    id: 'w-003',
    word: 'resilient',
    meaning: '有韧性的；能迅速恢复的',
    level: 'C',
    isDifficult: true,
    note: '高频写作词',
    nextReviewDate: '2026-03-08',
  },
  {
    id: 'w-004',
    word: 'subtle',
    meaning: '微妙的',
    level: 'B',
    isDifficult: true,
    note: '注意发音',
    nextReviewDate: '2026-03-07',
  },
  {
    id: 'w-005',
    word: 'allocate',
    meaning: '分配',
    level: 'A',
    isDifficult: false,
    note: '常见于资源分配语境',
    nextReviewDate: '2026-03-10',
  },
  {
    id: 'w-006',
    word: 'compile',
    meaning: '编译；汇编',
    level: 'B',
    isDifficult: true,
    note: '技术语境常用',
    nextReviewDate: '2026-03-08',
  },
];
