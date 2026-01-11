import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export type SessionEntry = {
  id: string;
  filename: string;
  summary: string;
  transcript: string;
  embedding: number[];
  speakers: { name: string; role: string; note?: string }[];
  turns: { speaker: string; text: string }[];
  vectorized: boolean;
  createdAt: string;
};

type PublicSession = Omit<SessionEntry, 'embedding'>;

const sessions: SessionEntry[] = [];

const getOpenAI = () => {
  const key = process.env.OPENAI_API_KEY!;

  console.log('Using OpenAI API key:', key);

  if (!key) return null;
  return new OpenAI({ apiKey: key });
};

export async function GET() {
  const payload: PublicSession[] = sessions.map(({ embedding, ...rest }) => rest);
  return NextResponse.json({ sessions: payload });
}

export async function POST(req: Request) {
  try {
    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not set' }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'No audio file received' }, { status: 400 });
    }

    const filename = (file as File).name || 'session.wav';
    const buffer = Buffer.from(await file.arrayBuffer());
    const aiFile = new File([buffer], filename, { type: file.type || 'audio/wav' });

    const transcription = await openai.audio.transcriptions.create({
      file: aiFile,
      model: 'whisper-1',
    });

    const transcript = transcription.text ?? '';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a therapist assistant. Given a transcript, respond as JSON with keys: summary (<=120 words), speakers (array of at least two items, each with name and role, optional note), and turns (array of dialogue turns with speaker and text, at least 4 turns if possible). Avoid PHI and keep speaker names generic like Therapist, Client, Partner.',
        },
        { role: 'user', content: transcript || 'No transcript content available.' },
      ],
    });

    const parsed = (() => {
      try {
        const raw = completion.choices[0]?.message?.content ?? '{}';
        return JSON.parse(raw) as {
          summary?: string;
          speakers?: { name: string; role: string; note?: string }[];
          turns?: { speaker: string; text: string }[];
        };
      } catch (err) {
        console.warn('Failed to parse JSON completion', err);
        return {};
      }
    })();

    const summary = parsed.summary || 'No summary available.';
    const speakers = (parsed.speakers?.length ? parsed.speakers : [
      { name: 'Speaker 1', role: 'Therapist' },
      { name: 'Speaker 2', role: 'Client' },
    ]) as { name: string; role: string; note?: string }[];
    const turns = (parsed.turns?.length
      ? parsed.turns
      : [
          { speaker: 'Therapist', text: summary || 'No transcript content available.' },
          { speaker: 'Client', text: transcript.slice(0, 220) || 'No transcript content available.' },
        ]) as { speaker: string; text: string }[];

    const embeddingInput = summary || transcript || 'No content available';
    const embeddingResp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: embeddingInput,
    });
    const embedding = embeddingResp.data?.[0]?.embedding ?? [];

    const entry: SessionEntry = {
      id: crypto.randomUUID(),
      filename,
      summary,
      transcript,
      embedding,
      speakers,
      turns,
      vectorized: embedding.length > 0,
      createdAt: new Date().toISOString(),
    };

    sessions.unshift(entry);

    const { embedding: _omit, ...publicEntry } = entry;
    return NextResponse.json(publicEntry, { status: 201 });
  } catch (error) {
    console.error('Error processing session', error);
    return NextResponse.json({ error: 'Failed to process session' }, { status: 500 });
  }
}
