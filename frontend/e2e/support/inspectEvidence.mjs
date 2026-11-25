import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const [source, screenshot] = process.argv.slice(2);
if (!source || !screenshot) throw new Error('Expected MP4 and screenshot paths');
const bytes = await readFile(source);
if (bytes.subarray(4, 8).toString() !== 'ftyp') throw new Error('Invalid MP4 container');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 1000 } });
  const metadata = await page.evaluate(async (base64) => {
    const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const video = document.createElement('video'); video.src = URL.createObjectURL(new Blob([raw], { type: 'video/mp4' })); video.muted = true;
    await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject; });
    const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 1000; document.body.style.margin = '0'; document.body.append(canvas);
    const context = canvas.getContext('2d');
    for (const [i, fraction] of [0.1, 0.35, 0.6, 0.85].entries()) {
      video.currentTime = video.duration * fraction;
      await new Promise((resolve, reject) => { video.onseeked = resolve; video.onerror = reject; });
      context.drawImage(video, (i % 2) * 400, Math.floor(i / 2) * 250, 400, 250);
    }
    video.currentTime = 0; await video.play();
    await new Promise((resolve, reject) => { video.onended = resolve; video.onerror = reject; });
    return { width: video.videoWidth, height: video.videoHeight, duration: video.duration, ended: video.ended };
  }, bytes.toString('base64'));
  await page.screenshot({ path: screenshot });
  console.log(JSON.stringify(metadata));
} finally { await browser.close(); }
