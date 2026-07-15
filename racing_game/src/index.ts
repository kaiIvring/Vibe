import express from 'express';
import path from 'path';
import apiRouter from './routes/api';
import { installInspector } from './middlewares/inspector';

const app = express();

const PORT = parseInt(process.env.APP_PORT || '8000', 10);
const HOST = process.env.APP_HOST || '0.0.0.0';

// Parse JSON request bodies
app.use(express.json());

// 🔒 平台基础设施 — 禁止 AI 删除或修改下方两行（@infrastructure-locked）
// tbox 平台微调能力（点选元素 → 写入聊天框）。详见 src/middlewares/inspector.ts。
// 校验：scripts/check-inspector.sh 会在构建时检查 installInspector(app) 是否仍被调用。
installInspector(app);

// API routes
app.use('/api', apiRouter);

// Serve static files from public/
app.use(express.static(path.join(__dirname, '../public')));

// Fallback: serve index.html for all non-API routes (SPA support)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
