import fs from 'fs';
import { execFileSync } from 'child_process';
import { getFFmpegPaths } from './video-converter.ts';

export interface VideoProbeInfo {
  isValid: boolean;
  format?: string;
  codec?: string;
  duration?: number;
  width?: number;
  height?: number;
  sizeBytes?: number;
  error?: string;
}

export function validateMp4Video(mp4Path: string): VideoProbeInfo {
  if (!fs.existsSync(mp4Path)) {
    return { isValid: false, error: `File không tồn tại: ${mp4Path}` };
  }

  const stat = fs.statSync(mp4Path);
  if (stat.size === 0) {
    return { isValid: false, sizeBytes: 0, error: 'File size bằng 0' };
  }

  const { ffprobePath } = getFFmpegPaths();

  try {
    const args = [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=codec_name,width,height,duration',
      '-show_entries',
      'format=duration,size,format_name',
      '-of',
      'json',
      mp4Path,
    ];

    const output = execFileSync(ffprobePath, args, { stdio: 'pipe' }).toString();
    const probe = JSON.parse(output);

    const stream = probe.streams?.[0];
    const format = probe.format;

    if (!stream) {
      return { isValid: false, error: 'Không tìm thấy video stream hợp lệ' };
    }

    const codec = stream.codec_name;
    const formatName = format?.format_name || '';
    const duration = parseFloat(format?.duration || stream.duration || '0');
    const width = stream.width;
    const height = stream.height;

    // Checks:
    // 1. Container includes mp4 or mov
    const isMp4Format = /mp4|mov/i.test(formatName);
    // 2. Video codec is h264
    const isH264 = /h264/i.test(codec);
    // 3. Duration > 0
    const hasDuration = duration > 0;

    if (!isMp4Format) {
      return {
        isValid: false,
        format: formatName,
        codec,
        duration,
        error: `Container không phải MP4 (tìm thấy: ${formatName})`,
      };
    }

    if (!isH264) {
      return {
        isValid: false,
        format: formatName,
        codec,
        duration,
        error: `Codec không phải H.264 (tìm thấy: ${codec})`,
      };
    }

    if (!hasDuration) {
      return {
        isValid: false,
        format: formatName,
        codec,
        duration,
        error: `Thời lượng video bằng 0`,
      };
    }

    return {
      isValid: true,
      format: formatName,
      codec,
      duration,
      width,
      height,
      sizeBytes: stat.size,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Lỗi ffprobe: ${err?.message || String(err)}`,
    };
  }
}

export function cleanupWebmAfterValidation(webmPath: string, validation: VideoProbeInfo): boolean {
  if (validation.isValid && fs.existsSync(webmPath)) {
    try {
      fs.unlinkSync(webmPath);
      return true;
    } catch (_) {}
  }
  return false;
}
