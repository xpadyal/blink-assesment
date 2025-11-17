## Blink – AI Voice Keyboard

A full-stack AI voice keyboard application that converts speech to text in real-time, allowing users to speak instead of type for faster text input.

---

## Implementation Overview

### Problem Statement

Traditional dictation software produces low-quality transcriptions. Modern AI solutions like Whisper can achieve better results, but transcribing long audio files (5-10 minute sessions) is inefficient when uploading entire files after recording completes, resulting in poor user experience and long wait times.

### Proposed Solution

Sound clip slicing with a buffer—record in 5-second slices, upload each slice incrementally to a REST API, and merge results continuously. This reduces final processing delay to just the time needed to process the last slice.

### Our Implementation

We implemented a **real-time WebSocket streaming approach** that improves upon the proposed solution:

#### Audio Streaming Architecture

- **500ms audio chunks** (vs 5-second slices proposed)
  - `MediaRecorder` configured with `rec.start(500)` creates chunks every 500ms
  - Uses Opus codec (`audio/webm;codecs=opus`) for efficient compression
  - 128kbps bitrate for optimal quality/size balance

- **WebSocket streaming** (vs REST API uploads)
  - Direct WebSocket connection to **Deepgram's** streaming API
  - Audio chunks sent immediately as `ArrayBuffer` via `ws.send()`
  - No HTTP overhead, lower latency than REST uploads
  - Uses **Deepgram Nova-2/Nova-3** models for high-accuracy transcription

- **Real-time transcript merging**
  - `TranscriptMerger` class handles continuous merging of partial and final segments
  - Partial segments update live text as user speaks
  - Final segments commit to stable text
  - UI updates in real-time, not after recording stops

#### Key Improvements Over Proposed Solution

| Aspect | Proposed | Our Implementation | Benefit |
|--------|----------|-------------------|---------|
| **Transport** | REST API uploads | WebSocket streaming | Lower latency, persistent connection |
| **Chunk size** | 5 seconds | 500ms | 10x faster updates, smoother UX |
| **Processing** | Batch after upload | Real-time streaming | Live transcription as you speak |
| **User feedback** | Wait for final result | Instant visual updates | Better perceived performance |

### Deepgram Integration

#### Model Selection

- **Nova-2** (default): Faster processing, lower cost
- **Nova-3**: Supports keyterms for better recognition of specific phrases
- User-selectable in Settings page

#### Keyterms & Dictionary Integration

- **Dictionary entries** automatically sync to Deepgram keyterms when dictating
- Dictionary phrases sorted by weight (highest first) for prioritization
- Merged with manual keyterms from Settings
- Limited to 50 keyterms (Deepgram limit)
- Only sent when using Nova-3 model (keyterms not supported in Nova-2)

#### Streaming Configuration

- Ephemeral API keys generated per session (60-second TTL)
- Customizable transcription settings:
  - Smart format, punctuation, utterances
  - Profanity filter, utterance splitting
  - Find & replace patterns
- Settings persisted per user in database

### Technical Architecture

#### Frontend
- **Next.js App Router** with Server and Client Components
- **Real-time WebSocket** connection for audio streaming
- **MediaRecorder API** for audio capture and chunking
- **TranscriptMerger** utility for merging partial/final segments
- **ShadCN UI** components for modern, accessible interface
- **Tailwind CSS** for styling

#### Backend
- **Next.js Route Handlers** for all API endpoints
- **NextAuth.js v5** (Credentials provider) for authentication
- **Prisma ORM** with PostgreSQL database
- **Deepgram** for real-time speech-to-text transcription
- **TypeScript** with comprehensive type safety for all API responses

#### Database Schema
- User authentication (NextAuth tables)
- Dictations (text, duration, timestamps)
- Dictionary entries (phrases with weights)
- User settings (Deepgram options as JSON)

#### Security & Best Practices
- Authentication middleware in server layouts
- All database operations in Route Handlers
- Proper TypeScript types for API responses
- Environment variable validation
- Resource cleanup on component unmount

### Features Implemented

✅ **User Authentication**
- Email/password signup and signin
- NextAuth with Prisma adapter
- Protected routes with server-side checks

✅ **Dictation**
- Start/stop recording with single button
- Real-time transcript display
- Save transcriptions to database
- Copy-on-hover functionality
- Emoji insertion support
- History with pagination

✅ **Dictionary**
- CRUD operations for special words/phrases
- Weight-based prioritization (0-10)
- Automatic sync to Deepgram keyterms (Nova-3)

✅ **Settings**
- Model selection (Nova-2/Nova-3)
- Deepgram transcription options
- Keyterms management
- Find & replace patterns

✅ **Navigation**
- Sidebar navigation for logged-in users
- Clean, modern UI design

---

Setup

1) Install deps

```bash
npm install
```

2) Set env vars

Create `.env`:

```

```

3) Prisma

```bash
npx prisma migrate dev --name init
```

4) Dev

```bash
npm run dev
```

Deployment (Railway)

- Provision Postgres
- Set env vars above
- Build command: `npm run build`
- Start command: `npm run start`


