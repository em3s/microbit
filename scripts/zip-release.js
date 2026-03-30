import { execSync } from 'child_process';
import { mkdirSync, rmSync, existsSync } from 'fs';

const RELEASE_DIR = 'release/microbit-games';
const ZIP_NAME = 'release/microbit-games-win-x64.zip';

// 정리
if (existsSync('release')) rmSync('release', { recursive: true });
mkdirSync(RELEASE_DIR, { recursive: true });

// 복사
execSync(`cp dist-server/microbit-games.exe ${RELEASE_DIR}/`);
execSync(`cp -r dist ${RELEASE_DIR}/`);

// zip
execSync(`cd release && zip -r microbit-games-win-x64.zip microbit-games/`);

const { statSync } = await import('fs');
const size = (statSync(ZIP_NAME).size / 1024 / 1024).toFixed(1);
console.log(`✅ ${ZIP_NAME} (${size}MB)`);
