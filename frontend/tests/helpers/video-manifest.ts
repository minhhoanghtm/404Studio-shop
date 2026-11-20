import fs from 'fs';
import path from 'path';

export interface UIManifestItem {
  id: string;
  filename: string;
  route: string;
  pageName: string;
  timestamp: string;
  viewport: { width: number; height: number; name: string };
  theme: 'dark' | 'light';
  scrollCoverage: string;
  testStatus: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED' | 'INVALID_RECORDING';
  errorSummary: string | null;
  durationSeconds: number;
  fileSizeBytes: number;
  codec: string;
  fileValidationStatus: 'VALID_MP4' | 'INVALID';
  localPath: string;
}

export interface FunctionManifestItem {
  id: string;
  filename: string;
  functionName: string;
  methodId: string;
  methodDescription: string;
  preconditions: string;
  testSteps: string[];
  expectedResult: string;
  actualResult: string;
  backendVerification: string;
  databaseVerification: string;
  testStatus: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED' | 'INVALID_RECORDING';
  errorSummary: string | null;
  durationSeconds: number;
  fileSizeBytes: number;
  codec: string;
  fileValidationStatus: 'VALID_MP4' | 'INVALID';
  localPath: string;
}

export function loadUIManifest(videosDir: string): UIManifestItem[] {
  const manifestPath = path.resolve(videosDir, 'UI', 'UI_MANIFEST.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      if (Array.isArray(data)) return data;
    } catch (_) {}
  }
  return [];
}

export function saveUIManifest(videosDir: string, items: UIManifestItem[]): void {
  const uiDir = path.resolve(videosDir, 'UI');
  if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });
  const manifestPath = path.join(uiDir, 'UI_MANIFEST.json');
  fs.writeFileSync(manifestPath, JSON.stringify(items, null, 2), 'utf-8');
}

export function appendOrUpdateUIManifest(videosDir: string, item: UIManifestItem): void {
  const items = loadUIManifest(videosDir);
  const existingIdx = items.findIndex((i) => i.id === item.id || i.filename === item.filename);
  if (existingIdx >= 0) {
    items[existingIdx] = item;
  } else {
    items.push(item);
  }
  saveUIManifest(videosDir, items);
}

export function loadFunctionManifest(videosDir: string): FunctionManifestItem[] {
  const manifestPath = path.resolve(videosDir, 'function', 'FUNCTION_MANIFEST.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      if (Array.isArray(data)) return data;
    } catch (_) {}
  }
  return [];
}

export function saveFunctionManifest(videosDir: string, items: FunctionManifestItem[]): void {
  const funcDir = path.resolve(videosDir, 'function');
  if (!fs.existsSync(funcDir)) fs.mkdirSync(funcDir, { recursive: true });
  const manifestPath = path.join(funcDir, 'FUNCTION_MANIFEST.json');
  fs.writeFileSync(manifestPath, JSON.stringify(items, null, 2), 'utf-8');
}

export function appendOrUpdateFunctionManifest(videosDir: string, item: FunctionManifestItem): void {
  const items = loadFunctionManifest(videosDir);
  const existingIdx = items.findIndex((i) => i.id === item.id || i.filename === item.filename);
  if (existingIdx >= 0) {
    items[existingIdx] = item;
  } else {
    items.push(item);
  }
  saveFunctionManifest(videosDir, items);
}
