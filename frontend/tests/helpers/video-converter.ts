import fs from 'fs';
import path from 'path';
import { execFileSync, execSync } from 'child_process';

export function getFFmpegPaths(): { ffmpegPath: string; ffprobePath: string } {
  // 1. Try environment / winget location
  const wingetPkgDir =
    'C:\\Users\\apple fix nts\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin';
  const wingetFfmpeg = path.join(wingetPkgDir, 'ffmpeg.exe');
  const wingetFfprobe = path.join(wingetPkgDir, 'ffprobe.exe');

  if (fs.existsSync(wingetFfmpeg) && fs.existsSync(wingetFfprobe)) {
    return { ffmpegPath: wingetFfmpeg, ffprobePath: wingetFfprobe };
  }

  // 2. Try which/where
  try {
    const whichFfmpeg = execSync('where.exe ffmpeg').toString().trim().split('\r\n')[0];
    const whichFfprobe = execSync('where.exe ffprobe').toString().trim().split('\r\n')[0];
    if (whichFfmpeg && whichFfprobe) {
      return { ffmpegPath: whichFfmpeg, ffprobePath: whichFfprobe };
    }
  } catch (err) {
    // Ignore error
  }

  throw new Error('Không thể tìm thấy FFmpeg và FFprobe trên hệ thống.');
}

export interface TranscodeResult {
  success: boolean;
  inputWebm: string;
  outputMp4: string;
  error?: string;
  duration?: number;
}

export function convertWebmToMp4(inputWebmPath: string, outputMp4Path: string): TranscodeResult {
  if (!fs.existsSync(inputWebmPath)) {
    return {
      success: false,
      inputWebm: inputWebmPath,
      outputMp4: outputMp4Path,
      error: `Input WebM file not found: ${inputWebmPath}`,
    };
  }

  const { ffmpegPath } = getFFmpegPaths();
  const tempOutputFile = outputMp4Path + '.tmp.mp4';

  try {
    // Ensure parent dir exists
    const outDir = path.dirname(outputMp4Path);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    if (fs.existsSync(tempOutputFile)) {
      fs.unlinkSync(tempOutputFile);
    }

    // Run FFmpeg: -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -movflags +faststart
    const args = [
      '-y',
      '-i',
      inputWebmPath,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      tempOutputFile,
    ];

    execFileSync(ffmpegPath, args, { stdio: 'pipe' });

    if (!fs.existsSync(tempOutputFile) || fs.statSync(tempOutputFile).size === 0) {
      return {
        success: false,
        inputWebm: inputWebmPath,
        outputMp4: outputMp4Path,
        error: 'FFmpeg generated empty or missing output file',
      };
    }

    // Atomic rename to final path
    fs.renameSync(tempOutputFile, outputMp4Path);

    return {
      success: true,
      inputWebm: inputWebmPath,
      outputMp4: outputMp4Path,
    };
  } catch (err: any) {
    if (fs.existsSync(tempOutputFile)) {
      try {
        fs.unlinkSync(tempOutputFile);
      } catch (_) {}
    }
    return {
      success: false,
      inputWebm: inputWebmPath,
      outputMp4: outputMp4Path,
      error: err?.message || String(err),
    };
  }
}
