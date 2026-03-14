const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { get, run } = require('../db/db.ts');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mvp_dev_secret_change_me';

router.post('/register', async (req: any, res: any) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'username 和 password 为必填项' });
    }

    const existing = await get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ success: false, message: '用户名已存在' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    await run(
      'INSERT INTO users (username, passwordHash, createdAt) VALUES (?, ?, ?)',
      [username, passwordHash, createdAt]
    );

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: '注册失败', error: String(error.message || error) });
  }
});

router.post('/login', async (req: any, res: any) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'username 和 password 为必填项' });
    }

    const user = await get('SELECT id, username, passwordHash FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: '登录失败', error: String(error.message || error) });
  }
});

module.exports = router;
