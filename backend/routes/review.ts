const express = require('express');
const jwt = require('jsonwebtoken');
const { get, run } = require('../db/db.ts');

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
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'token 无效或已过期' });
  }
}

router.post('/', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const {
      wordId,
      memoryLevel,
      forgetStreak,
      reviewCount,
      lastReviewedDate,
      nextReviewDate,
      isDifficult,
    } = req.body || {};

    if (!wordId || !nextReviewDate) {
      return res.status(400).json({ success: false, message: 'wordId 和 nextReviewDate 为必填项' });
    }

    const existingWord = await get(
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

    if (!existingWord) {
      return res.status(404).json({ success: false, message: '未找到对应词条' });
    }

    await run(
      `UPDATE words
      SET
        memoryLevel = ?,
        forgetStreak = ?,
        reviewCount = ?,
        lastReviewedDate = ?,
        nextReviewDate = ?,
        isDifficult = ?
      WHERE id = ? AND userId = ?`,
      [
        memoryLevel,
        forgetStreak,
        reviewCount,
        lastReviewedDate,
        nextReviewDate,
        isDifficult ? 1 : 0,
        wordId,
        userId,
      ]
    );

    const updatedWord = await get(
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

    return res.json({ success: true, word: updatedWord });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: '保存复习结果失败',
      error: String(error.message || error),
    });
  }
});

module.exports = router;
