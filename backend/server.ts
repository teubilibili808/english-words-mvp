const express = require('express');
const cors = require('cors');

require('./db/db.ts');

const authRoutes = require('./routes/auth.ts');
const reviewRoutes = require('./routes/review.ts');
const wordsRoutes = require('./routes/words.ts');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: any, res: any) => {
  res.json({ success: true, message: 'backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/words', wordsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
