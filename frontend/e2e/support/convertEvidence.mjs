import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Preserve the recording's real-time duration and keep the original WebM.
const [source, destination] = process.argv.slice(2);
if (!source || !destination) throw new Error('Expected input WebM and output MP4 paths.');
const input = (await readFile(source)).toString('base64');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const result = await page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const video = document.createElement('video');
    video.src = URL.createObjectURL(new Blob([bytes], { type: 'video/webm' }));
    video.muted = true;
    await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject; });
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable.');
    const mimeType = 'video/mp4;codecs=avc1.42E01E';
    if (!MediaRecorder.isTypeSupported(mimeType)) throw new Error('MP4 H.264 recording unavailable.');
    const stream = canvas.captureStream(30); const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_000_000 });
    const chunks = []; recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    const stopped = new Promise((resolve, reject) => { recorder.onstop = resolve; recorder.onerror = reject; });
    const draw = () => { context.drawImage(video, 0, 0); if (!video.ended) requestAnimationFrame(draw); };
    recorder.start(); await video.play(); draw();
    await new Promise((resolve, reject) => { video.onended = resolve; video.onerror = reject; });
    recorder.stop(); await stopped; stream.getTracks().forEach((track) => track.stop());
    const blob = new Blob(chunks, { type: 'video/mp4' });
    const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
    return { dataUrl, width: canvas.width, height: canvas.height, sourceDuration: video.duration, mimeType: recorder.mimeType };
  }, input);
  const buffer = Buffer.from(result.dataUrl.split(',')[1], 'base64');
  if (buffer.subarray(4, 8).toString() !== 'ftyp') throw new Error('Output is not an MP4 container.');
  await writeFile(destination, buffer, { flag: 'wx' });
  console.log(JSON.stringify({ width: result.width, height: result.height, sourceDuration: result.sourceDuration, mimeType: result.mimeType, bytes: buffer.length }));
} finally { await browser.close(); }
