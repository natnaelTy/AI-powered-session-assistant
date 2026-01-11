"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Loader2, Upload, Sparkles, Waves } from "lucide-react";

type SessionEntry = {
  id: string;
  filename: string;
  summary: string;
  transcript: string;
  speakers: { name: string; role: string; note?: string }[];
  turns: { speaker: string; text: string }[];
  vectorized: boolean;
  createdAt: string;
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<SessionEntry | null>(null);

  const formatDateTime = useCallback((value: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(new Date(value));
    } catch {
      return value;
    }
  }, []);

  const formatTime = useCallback((value: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeStyle: "short",
        timeZone: "UTC",
      }).format(new Date(value));
    } catch {
      return value;
    }
  }, []);

  useEffect(() => {
    loadSessions();
    setMounted(true);
  }, []);

  const audioPlayer = useMemo(() => {
    if (!previewUrl) return null;
    return (
      <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/15 via-sky-500/10 to-emerald-400/15 p-4 ring-1 ring-white/50 backdrop-blur-xl shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(45,212,191,0.18),transparent_25%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.18),transparent_30%)]" />
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Waves className="h-4 w-4 text-indigo-500" />
            Ready to review audio
          </div>
          <audio controls className="w-full rounded-xl bg-white/70 p-2 shadow-sm backdrop-blur">
            <source src={previewUrl} />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    );
  }, [previewUrl]);

  const loadSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) return;
      const data = (await res.json()) as { sessions: SessionEntry[] };
      setSessions(data.sessions);
      setActiveSession(data.sessions[0] ?? null);
    } catch (err) {
      console.error(err);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setError(null);
    if (f) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  };

  const submit = async () => {
    if (!file) {
      setError("Please select an audio file.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/sessions", { method: "POST", body: form });
      if (!res.ok) {
        const msg = (await res.json())?.error || "Upload failed";
        throw new Error(msg);
      }
      const saved = (await res.json()) as SessionEntry;
      setSessions((prev) => [saved, ...prev]);
      setActiveSession(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process session.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_25%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,0.12),transparent_20%)]" />
      <main className="relative mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered session assistant
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Upload therapy sessions, get transcripts and summaries.
            </h1>
            <p className="max-w-2xl text-sm text-white/70">
              Drop an audio file, we call OpenAI to transcribe and summarize, and keep recent sessions handy for review.
            </p>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white/60">Upload audio</p>
                <h2 className="text-lg font-semibold">Therapy session file</h2>
              </div>
            </div>

            <label
              htmlFor="file"
              className="group mt-2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center transition hover:border-white/40 hover:bg-white/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-200 ring-1 ring-white/20">
                <Upload className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium text-white">Click to choose or drag an audio file</span>
                <span className="text-xs text-white/60">WAV, MP3, or M4A — up to a few minutes recommended.</span>
              </div>
              <input id="file" type="file" accept="audio/*" className="hidden" onChange={onFileChange} />
            </label>

            {file ? (
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                <div className="truncate text-white/80">{file.name}</div>
                <button
                  type="button"
                  className="text-xs font-medium text-indigo-200 hover:text-white"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  Clear
                </button>
              </div>
            ) : null}

            {audioPlayer}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Processing..." : "Transcribe & Summarize"}
              </button>
            </div>

            {error ? <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Latest session</h2>
              <span className="text-xs text-white/60">{sessions.length} stored</span>
            </div>

            {activeSession ? (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-100 ring-1 ring-emerald-500/30">
                    Transcribed
                  </span>
                  <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-100 ring-1 ring-sky-500/30">
                    Summarized
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 ring-1 ${
                      activeSession.vectorized
                        ? 'bg-indigo-500/15 text-indigo-100 ring-indigo-500/30'
                        : 'bg-white/5 text-white/60 ring-white/20'
                    }`}
                  >
                    {activeSession.vectorized ? 'Vectorized' : 'Vector pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{formatDateTime(activeSession.createdAt)}</span>
                  <span className="truncate">{activeSession.filename}</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">Summary</p>
                  <p className="mt-1 text-base text-white">{activeSession.summary}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-white/50">Speakers</p>
                  <div className="flex flex-wrap gap-2">
                    {activeSession.speakers?.map((sp, idx) => (
                      <span
                        key={`${sp.name}-${idx}`}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-white"
                        title={sp.note || sp.role}
                      >
                        {sp.name} — {sp.role}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">Transcript</p>
                  <div className="mt-1 max-h-48 overflow-auto rounded-xl border border-white/10 bg-white/5 p-3 text-white/80">
                    {activeSession.transcript || "No transcript"}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">Speaker-labeled transcript</p>
                  <div className="mt-1 max-h-48 overflow-auto rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 space-y-2">
                    {activeSession.turns?.length ? (
                      activeSession.turns.map((t, idx) => (
                        <div key={`${t.speaker}-${idx}`} className="text-sm leading-relaxed">
                          <span className="font-semibold text-white">{t.speaker}:</span>{" "}
                          <span className="text-white/80">{t.text}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-white/60">No speaker-labeled transcript available.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/60">
                No sessions yet. Upload an audio file to see results here.
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>History</span>
                <button
                  type="button"
                  onClick={loadSessions}
                  className="text-indigo-200 hover:text-white"
                >
                  Refresh
                </button>
              </div>
              <div className="flex max-h-60 flex-col gap-2 overflow-auto rounded-xl border border-white/10 bg-white/5 p-2">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSession(s)}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10 ${
                      activeSession?.id === s.id ? "bg-white/10 ring-1 ring-indigo-400/40" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span className="truncate">{s.filename}</span>
                      <span>{formatTime(s.createdAt)}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-white/80">{s.summary}</div>
                  </button>
                ))}
                {sessions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-white/60">
                    Nothing yet. Process a file to populate the history.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
