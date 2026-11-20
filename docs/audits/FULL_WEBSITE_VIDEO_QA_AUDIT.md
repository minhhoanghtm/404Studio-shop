# FULL WEBSITE QA, VIDEO RECORDING & BUSINESS FLOW TEST AUDIT

- **Project**: ThreeUI / Atelier Vérité Haute Couture E-Commerce Platform
- **Auditor**: Principal QA Automation Architect & CI/CD Specialist
- **Audit Date**: 20/11/2026
- **Test Infrastructure Target**: Real Backend (MongoDB Atlas + Redis Local), Playwright Chromium, FFmpeg 9.0.2 Transcoding Pipeline
- **Status**: AUDIT COMPLETE — INFRASTRUCTURE VERIFIED

---

## 1. System Architecture & Environment Audit

### 1.1 Web Application Stack
- **Frontend Architecture**: React 19 + TypeScript SPA bundled with Vite 8.3.8.
- **Styling & Layout**: Tailwind CSS 3.4 with custom Haute Couture theme tokens (Noir `#0e0e12`, Champagne `#d4af37`, Ivory `#fdfbf7`).
- **Storefront Layout**: `RootLayout` (`frontend/src/App.tsx`) including `AnnouncementBar`, `Header`, `Footer`, `CartDrawer`, `QuickSearchModal`, `ToastContainer`, `ScrollToTop`, `PromotionalPopup`, and `AiAssistantModal`.
- **Admin Layout**: `AdminLayout` (`frontend/src/pages/Admin/AdminLayout.tsx`) featuring collapsible sidebar, quick stats, notification drawer, and responsive drawer toggles for small viewports.
- **Local Dev Server**: Vite serving on `http://127.0.0.1:5180` with proxy to backend API at `http://127.0.0.1:5000`.

### 1.2 Backend API & Database Stack
- **Framework**: Express.js 4.18.2 running on Node.js v24.13.0 (ESM mode).
- **Primary Database**: MongoDB Atlas cluster (`minhhoanghtm2004_db_user`) hosting 34 collections.
- **Cache & Message Broker**: Redis 7.0 running in Docker (`redis_local:6379`).
- **Health Probes**:
  - `GET /api/health` -> `200 OK` (`{"status":"OK","services":{"mongodb":"connected","redis":"connected"}}`).
  - `GET /api/health/liveness` -> `200 OK`.
  - `GET /api/health/readiness` -> `200 OK`.
- **Integrity Rule**: 100% real backend API. Zero runtime mock data. No modifications to source repository at `D:\Project\REACT-WebFashion`.

---

## 2. Test & Recording Infrastructure Audit

### 2.1 Playwright Engine
- **Engine Version**: `@playwright/test` v1.52.0.
- **Browser Availability**: Chromium browser installed and verified.
- **Video Recording Mechanism**: Playwright native WebM recording (`recordVideo: { dir: ... }`) capturing native frame rendering.
- **Viewports Evaluated**:
  - Desktop: 1440×900 / 1920×1080.
  - Tablet: 768×1024.
  - Mobile: 390×844.

### 2.2 FFmpeg & Video Transcoding Pipeline
- **FFmpeg Version**: `9.0.2-full_build-www.gyan.dev`.
- **FFprobe Version**: `9.0.2-full_build-www.gyan.dev`.
- **Binary Locations**:
  - `ffmpeg`: `C:\Users\apple fix nts\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe`
  - `ffprobe`: `C:\Users\apple fix nts\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffprobe.exe`
- **Encoding Standard**: H.264 video codec (`libx264`), `yuv420p` pixel format, MP4 container, `+faststart` flag for instant streaming playback.
- **Validation**: Strict decode and container verification via `ffprobe` JSON metadata extraction (`format.format_name` includes `mp4`, `streams[0].codec_name === 'h264'`, `duration > 0`, `size > 0`).

### 2.3 Storage & Version Control Hygiene
- **Storage Directory Structure**:
  - `videos/UI/`: Contains UI exploration videos (`UIxx-DD-MM-YYYY.mp4`) and `UI_MANIFEST.json`.
  - `videos/function/`: Contains business flow execution videos (`function_name_xx-DD-MM-YYYY-cachxx.mp4`) and `FUNCTION_MANIFEST.json`.
- **Git & Docker Isolation**:
  - Root `.gitignore` includes `/videos/`, `videos/`, `*.mp4`, `*.webm`.
  - Root `.dockerignore` and `frontend/.dockerignore` include `videos/`.
  - Verified with `git check-ignore -v videos/UI/UI01-20-11-2026.mp4`.

---

## 3. Test Personas & Security Constraints

| Role | Test Persona | Context / Permissions | Data Safety Rule |
|---|---|---|---|
| **Guest / Anonymous** | Unauthenticated Visitor | Public Catalog, Cart, Lookbooks, Policy Pages | Zero sensitive data required |
| **Registered Patron** | `charlotte.vane@atelierverite.com` / `HauteCouture2026!` | Profile, Orders, Wishlist, Addresses, Loyalty | Test sandbox customer data only |
| **Creative Director / Admin** | `director@atelierverite.com` / `AtelierAdmin2026!` | Products, Categories, Orders, Campaigns, Page Builder, Chats, Policies, Tracking | No destructive deletes of core catalog |

- **Security Rule**: No tokens, cleartext passwords, OTPs, or API secrets recorded in video frames.
- **Payment Safety**: Test checkout executed with COD (Cash on Delivery) or MoMo test sandbox. Zero real money transactions.

---

## 4. Execution Readiness Sign-Off
- [x] FFmpeg and FFprobe installed and validated.
- [x] Backend running and MongoDB/Redis connected.
- [x] Frontend running on port 5180 with clean proxying.
- [x] Test directories initialized with strict Git exclusion.
- [x] Test suite strategy mapped for UI and Functional recordings.
