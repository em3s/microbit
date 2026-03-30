import { execSync } from 'child_process';
import { createWriteStream, existsSync, unlinkSync } from 'fs';
import { pipeline } from 'stream/promises';
import { get } from 'https';

const NODE_VERSION = process.version;
const URL = `https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-win-x64.zip`;
const ZIP_PATH = 'dist-server/node-win.zip';
const EXE_PATH = 'dist-server/microbit-games.exe';
const BLOB_PATH = 'dist-server/sea-prep.blob';

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        get(res.headers.location, (res2) => {
          pipeline(res2, file).then(resolve).catch(reject);
        });
        return;
      }
      pipeline(res, file).then(resolve).catch(reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log(`Downloading Windows Node.js ${NODE_VERSION}...`);
  await download(URL, ZIP_PATH);

  console.log('Extracting node.exe...');
  execSync(`unzip -jo ${ZIP_PATH} "node-${NODE_VERSION}-win-x64/node.exe" -d dist-server/`, { stdio: 'pipe' });
  execSync(`mv dist-server/node.exe ${EXE_PATH}`);
  unlinkSync(ZIP_PATH);

  console.log('Injecting SEA blob...');
  execSync(
    `npx postject ${EXE_PATH} NODE_SEA_BLOB ${BLOB_PATH} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
    { stdio: 'inherit' }
  );

  console.log(`✅ Windows exe ready: ${EXE_PATH}`);
}

main().catch(err => { console.error(err); process.exit(1); });
