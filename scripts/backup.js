const fs = require('fs');
const path = require('path');

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${y}${m}${d}_${hh}${mm}${ss}`;
}

function copyRecursiveSync(src, dest, ignoreList = []) {
  if (ignoreList.some(ig => src.endsWith(ig) || path.basename(src) === ig)) {
    return;
  }
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName), ignoreList);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function createBackup(version = "v0.1.1", action = "pre-operation") {
  const rootDir = path.resolve(__dirname, '..');
  const backupsDir = path.join(rootDir, '_backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = getTimestamp();
  const targetDir = path.join(backupsDir, `${version}_${action}_${timestamp}`);
  fs.mkdirSync(targetDir, { recursive: true });

  const ignoreList = ['_backups', '.git', 'node_modules', '__pycache__', '.pytest_cache'];
  const rootItems = fs.readdirSync(rootDir);
  for (const item of rootItems) {
    if (ignoreList.includes(item)) continue;
    copyRecursiveSync(path.join(rootDir, item), path.join(targetDir, item), ignoreList);
  }

  console.log(`[BACKUP SUCCESS] Saved to: ${targetDir}`);
  return targetDir;
}

if (require.main === module) {
  const version = process.argv[2] || "v0.1.1";
  const action = process.argv[3] || "manual";
  createBackup(version, action);
}

module.exports = { createBackup };
