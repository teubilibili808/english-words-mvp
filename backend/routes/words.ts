const express = require('express');
const jwt = require('jsonwebtoken');
const { all, get, run } = require('../db/db.ts');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mvp_dev_secret_change_me';

function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization || '';
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: '未授权：缺少 token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'token 无效或已过期' });
  }
}

function normalizeWordForCompare(word: unknown) {
  if (typeof word !== 'string') {
    return '';
  }

  return word.trim().toLowerCase();
}

router.get('/', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const words = await all(
      `SELECT
        id,
        userId,
        word,
        meaning,
        level,
        memoryLevel,
        forgetStreak,
        reviewCount,
        lastReviewedDate,
        nextReviewDate,
        isDifficult,
        note
      FROM words
      WHERE userId = ?
      ORDER BY id DESC`,
      [userId]
    );

    return res.json({ success: true, words });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: '获取单词失败', error: String(error.message || error) });
  }
});

router.post('/', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { word, meaning, level, note, isDifficult } = req.body || {};
    const normalizedWord = normalizeWordForCompare(word);
    const trimmedWord = typeof word === 'string' ? word.trim() : '';
    const trimmedMeaning = typeof meaning === 'string' ? meaning.trim() : '';

    if (!trimmedWord || !trimmedMeaning || !level) {
      return res.status(400).json({ success: false, message: 'word / meaning / level 为必填项' });
    }

    const duplicatedWord = await get(
      `SELECT id
      FROM words
      WHERE userId = ?
        AND LOWER(TRIM(word)) = ?`,
      [userId, normalizedWord]
    );

    if (duplicatedWord) {
      return res.status(409).json({ success: false, message: '该单词已存在' });
    }

    const today = new Date().toISOString().slice(0, 10);

    const result = await run(
      `INSERT INTO words (
        userId,
        word,
        meaning,
        level,
        memoryLevel,
        forgetStreak,
        reviewCount,
        lastReviewedDate,
        nextReviewDate,
        isDifficult,
        note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        trimmedWord,
        trimmedMeaning,
        level,
        1,
        0,
        0,
        null,
        today,
        isDifficult ? 1 : 0,
        note || '',
      ]
    );

    return res.json({
      success: true,
      wordId: result.lastID,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: '保存单词失败', error: String(error.message || error) });
  }
});

router.patch('/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const wordId = Number(req.params.id);
    const { word, meaning, level, note, isDifficult } = req.body || {};

    if (!Number.isInteger(wordId) || wordId <= 0) {
      return res.status(400).json({ success: false, message: '无效的 word id' });
    }

    const existingWord = await all(
      `SELECT
        id,
        userId,
        word,
        meaning,
        level,
        memoryLevel,
        forgetStreak,
        reviewCount,
        lastReviewedDate,
        nextReviewDate,
        isDifficult,
        note
      FROM words
      WHERE id = ? AND userId = ?`,
      [wordId, userId]
    );

    if (!existingWord[0]) {
      return res.status(404).json({ success: false, message: '未找到对应词条' });
    }

    const nextWord = typeof word === 'string' ? word.trim() : existingWord[0].word;
    const nextMeaning = typeof meaning === 'string' ? meaning.trim() : existingWord[0].meaning;
    const nextLevel = level === 'A' || level === 'B' || level === 'C' ? level : existingWord[0].level;
    const nextNote = typeof note === 'string' ? note : existingWord[0].note;
    const nextIsDifficult =
      typeof isDifficult === 'boolean' || typeof isDifficult === 'number'
        ? (isDifficult ? 1 : 0)
        : existingWord[0].isDifficult;

    if (!nextWord || !nextMeaning) {
      return res.status(400).json({ success: false, message: 'word / meaning / level 为必填项' });
    }

    const normalizedWord = normalizeWordForCompare(nextWord);
    const duplicatedWord = await get(
      `SELECT id
      FROM words
      WHERE userId = ?
        AND id != ?
        AND LOWER(TRIM(word)) = ?`,
      [userId, wordId, normalizedWord]
    );

    if (duplicatedWord) {
      return res.status(409).json({ success: false, message: '该单词已存在' });
    }

    await run(
      `UPDATE words
      SET
        word = ?,
        meaning = ?,
        level = ?,
        note = ?,
        isDifficult = ?
      WHERE id = ? AND userId = ?`,
      [nextWord, nextMeaning, nextLevel, nextNote, nextIsDifficult, wordId, userId]
    );

    const updatedWord = await all(
      `SELECT
        id,
        userId,
        word,
        meaning,
        level,
        memoryLevel,
        forgetStreak,
        reviewCount,
        lastReviewedDate,
        nextReviewDate,
        isDifficult,
        note
      FROM words
      WHERE id = ? AND userId = ?`,
      [wordId, userId]
    );

    return res.json({ success: true, word: updatedWord[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: '更新单词失败', error: String(error.message || error) });
  }
});

module.exports = router;
