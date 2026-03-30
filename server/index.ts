import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { initDB } from './db.js';
import { scoresRouter } from './routes/scores.js';
import { adminRouter } from './routes/admin.js';

import fs from 'fs';

// exe 옆에 dist/가 있으면 SEA 모드, 아니면 개발 모드
const exeDir = path.dirname(process.execPath);
const devDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseDir = fs.existsSync(path.join(exeDir, 'dist')) ? exeDir : devDir;
const PORT = Number(process.env.PORT) || 3000;

initDB(baseDir);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', scoresRouter());
app.use('/api/admin', adminRouter());

// 정적 파일 서빙
const distPath = path.join(baseDir, 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const lanIP = getLanIP();
  console.log(`\n  🎮 micro:bit 게임 서버 시작`);
  console.log(`  ─────────────────────────────`);
  console.log(`  로컬:    http://localhost:${PORT}`);
  if (lanIP) {
    console.log(`  학생용:  http://${lanIP}:${PORT}`);
  }
  console.log(`  관리자:  http://localhost:${PORT}/admin`);
  console.log();
});

function getLanIP(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}
