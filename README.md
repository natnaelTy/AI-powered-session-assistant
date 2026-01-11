 AI-powered-session-assistant

This repo hosts a Next.js frontend at the root and a NestJS backend in `backend/`.

## Environment
- Frontend (Next.js): `OPENAI_API_KEY` for transcription/summarization/embeddings in `/api/sessions`.
- Backend (NestJS): see `backend/.env.example` for Supabase and `FRONTEND_URL`/`PORT`.

## Getting Started

First, run the Next.js development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the frontend.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Backend (NestJS):

```bash
cd backend
cp .env.example .env # fill SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PORT
npm install
npm run start:dev
```

Backend runs at http://localhost:3001 (or your `PORT`).

## **Architecture Overview**
- **Frontend:** Next.js app with an upload UI (Kokonut-style audio player) and an API route at [`/app/api/sessions/route.ts`](app/api/sessions/route.ts).
- **Backend:** NestJS service in [`backend`](backend) prepared for Supabase/Postgres integration (CORS configured for the frontend).
- **Processing Flow:** Browser uploads audio → Next.js API handles transcription, summarization, and vectorization via OpenAI → in-memory session store (for now) → response returned to UI.
- **Future Storage:** Supabase (Postgres + pgvector) for persistent sessions and semantic search.

## **Data Model**
- **`SessionEntry`:**
	- **`id`**: unique id
	- **`filename`**: original audio filename
	- **`summary`**: short session summary
	- **`transcript`**: full text from audio
	- **`speakers`**: array of `{ name, role, note? }`
	- **`turns`**: speaker-labeled dialogue `{ speaker, text }[]`
	- **`embedding`**: vector (stored server-side only, omitted from responses)
	- **`vectorized`**: boolean indicator for embedding completion
	- **`createdAt`**: ISO timestamp

## **Processing Pipeline**
- **Transcription:** OpenAI `whisper-1` transcribes uploaded audio.
- **Summarization + Speakers:** OpenAI `gpt-4.1-mini` returns JSON with `summary`, `speakers`, and `turns` (speaker-labeled).
- **Vectorization:** OpenAI `text-embedding-3-small` generates embeddings from `summary` or `transcript`; stored alongside the session (not sent to client).
- **UI Display:** The frontend shows transcript, summary, speakers, and a “Vectorized/Vector pending” status chip.

## **Assumptions & Tradeoffs**
- **In-Memory Storage:** Sessions are ephemeral; restart clears data. Move to Supabase for persistence.
- **PHI Handling:** Summarization prompt avoids PHI and uses generic speaker names (Therapist/Client).
- **Model Access:** Uses broadly available OpenAI models; if your account lacks access, adjust model names.
- **Hydration Stability:** Deterministic date formatting and client-mount guard to reduce SSR/CSR mismatches.
- **Scalability:** Current single-process memory store; add DB + queue for large files or high concurrency.
- **Semantic Search:** Designed to store embeddings so you can add a `/api/search` endpoint backed by pgvector later.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
