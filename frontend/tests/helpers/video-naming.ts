import fs from 'fs';
import path from 'path';

export function getVietnamDateString(): string {
  // Asia/Ho_Chi_Minh timezone date string in DD-MM-YYYY format
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const parts = formatter.formatToParts(now);
  const day = parts.find((p) => p.type === 'day')?.value || '20';
  const month = parts.find((p) => p.type === 'month')?.value || '11';
  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  return `${day}-${month}-${year}`;
}

export function getNextUIVideoFilename(videosDir: string): { filename: string; fullPath: string; id: string } {
  const uiDir = path.resolve(videosDir, 'UI');
  if (!fs.existsSync(uiDir)) {
    fs.mkdirSync(uiDir, { recursive: true });
  }

  const dateStr = getVietnamDateString();
  const files = fs.readdirSync(uiDir);

  // Match UIxx-DD-MM-YYYY.mp4 or UIxxx-DD-MM-YYYY.mp4
  const regex = new RegExp(`^UI(\\d+)-${dateStr}\\.mp4$`, 'i');
  let maxIndex = 0;

  for (const file of files) {
    const match = file.match(regex);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (idx > maxIndex) {
        maxIndex = idx;
      }
    }
  }

  const nextIndex = maxIndex + 1;
  const numStr = nextIndex < 10 ? `0${nextIndex}` : `${nextIndex}`;
  const filename = `UI${numStr}-${dateStr}.mp4`;
  const fullPath = path.join(uiDir, filename);
  const id = `UI-${numStr}-${dateStr}`;

  return { filename, fullPath, id };
}

export function getNextFunctionVideoFilename(
  videosDir: string,
  functionName: string,
  methodId: string // e.g. "cach01"
): { filename: string; fullPath: string; id: string } {
  const funcDir = path.resolve(videosDir, 'function');
  if (!fs.existsSync(funcDir)) {
    fs.mkdirSync(funcDir, { recursive: true });
  }

  const dateStr = getVietnamDateString();
  const files = fs.readdirSync(funcDir);

  // Match function_name_xx-DD-MM-YYYY-cachxx.mp4
  const cleanFuncName = functionName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const cleanMethod = methodId.toLowerCase();
  const regex = new RegExp(`^${cleanFuncName}_(\\d+)-${dateStr}-${cleanMethod}\\.mp4$`, 'i');
  let maxIndex = 0;

  for (const file of files) {
    const match = file.match(regex);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (idx > maxIndex) {
        maxIndex = idx;
      }
    }
  }

  const nextIndex = maxIndex + 1;
  const numStr = nextIndex < 10 ? `0${nextIndex}` : `${nextIndex}`;
  const filename = `${cleanFuncName}_${numStr}-${dateStr}-${cleanMethod}.mp4`;
  const fullPath = path.join(funcDir, filename);
  const id = `${cleanFuncName}-${numStr}-${cleanMethod}-${dateStr}`;

  return { filename, fullPath, id };
}
