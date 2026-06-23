import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Audio narration for a slide deck via the Web Speech API.
 *
 * Defaults to muted. When toggled on, the current slide is spoken and — when
 * the utterance ends — the deck auto-advances, creating an auto-slideshow.
 *
 * As speech proceeds, `progress` (0–1) advances via `onboundary` events so
 * the slide body can highlight the line currently being read — "the voice
 * moving with the slide."
 *
 * Voice selection prefers high-quality "natural" English voices (Apple's
 * Premium/Enhanced families on macOS/iOS, Microsoft Natural on Windows,
 * Google's neural voices on Chrome). Long slides are chunked at sentence
 * boundaries to work around Chrome's ~200-char utterance cut-off.
 */
export interface SlideNarration {
  enabled: boolean;
  supported: boolean;
  toggle: () => void;
  /** 0..1 progress through the currently-spoken slide. */
  progress: number;
  /** Slide idx currently being narrated, or -1 if none. */
  narratingIdx: number;
}

export function useSlideNarration(
  texts: string[],
  idx: number,
  setIdx: Dispatch<SetStateAction<number>>,
): SlideNarration {
  const [enabled, setEnabled] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [narratingIdx, setNarratingIdx] = useState(-1);
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;
  const activeQueue = useRef<SpeechSynthesisUtterance[]>([]);

  // Voices populate asynchronously on Chrome. Refresh on `voiceschanged`.
  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const refresh = () => {
      if (synth.getVoices().length) setVoicesReady(true);
    };
    refresh();
    synth.addEventListener('voiceschanged', refresh);
    return () => synth.removeEventListener('voiceschanged', refresh);
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    activeQueue.current = [];
    setProgress(0);
    setNarratingIdx(-1);

    if (!enabled) return;

    const text = (texts[idx] || '').trim();
    if (!text) {
      // No text to speak (e.g. a visual-only slide). Hold for a calm
      // beat, then advance so the slideshow keeps moving.
      if (idx < texts.length - 1) {
        const t = setTimeout(() => {
          setIdx((i) => (i === idx ? i + 1 : i));
        }, 3500);
        return () => clearTimeout(t);
      }
      return;
    }

    const voice = pickSoothingVoice(window.speechSynthesis.getVoices());
    const chunks = chunkForSpeech(text);
    const totalLen = chunks.reduce((s, c) => s + c.length, 0) || 1;

    let cumulative = 0;
    const utterances: SpeechSynthesisUtterance[] = chunks.map((chunk) => {
      const u = new SpeechSynthesisUtterance(chunk);
      if (voice) u.voice = voice;
      u.rate = 0.86;     // unhurried, contemplative
      u.pitch = 1.0;     // natural
      u.volume = 1.0;
      u.lang = voice?.lang || 'en-US';

      const chunkOffset = cumulative;
      cumulative += chunk.length;

      u.onstart = () => {
        if (!activeQueue.current.includes(u)) return;
        setNarratingIdx(idx);
        // Snap progress to the start of this chunk so the highlight
        // never jumps backwards between sentences.
        setProgress(Math.min(0.999, chunkOffset / totalLen));
      };

      u.onboundary = (e) => {
        if (e.name !== 'word' && e.name !== 'sentence') return;
        if (!activeQueue.current.includes(u)) return;
        const pos = chunkOffset + e.charIndex + (e.charLength || 0);
        setProgress(Math.min(0.999, pos / totalLen));
      };

      return u;
    });

    activeQueue.current = utterances;

    // The LAST chunk in the chain triggers auto-advance on end.
    const last = utterances[utterances.length - 1];
    last.onend = () => {
      if (activeQueue.current[activeQueue.current.length - 1] !== last) return;
      setProgress(1);
      setIdx((i) => (i < texts.length - 1 ? i + 1 : i));
    };

    for (const u of utterances) window.speechSynthesis.speak(u);
  }, [enabled, idx, texts, setIdx, supported, voicesReady]);

  // Cancel speech on unmount so navigating away doesn't keep speaking.
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    enabled,
    supported,
    progress,
    narratingIdx,
    toggle: () => setEnabled((v) => !v),
  };
}

/* ────────── Voice selection ────────── */

const VOICE_PREFERENCES: RegExp[] = [
  // Apple Premium tier — the smoothest on Mac/iPhone.
  /Samantha.*Premium/i,
  /Ava.*Premium/i,
  /Allison.*Premium/i,
  /Tessa.*Premium/i,
  /Serena.*Premium/i,
  /Karen.*Premium/i,
  /Moira.*Premium/i,
  /Samantha.*Enhanced/i,
  /Ava.*Enhanced/i,
  /Allison.*Enhanced/i,

  // Microsoft Natural family (Windows / Edge).
  /Aria.*Natural/i,
  /Jenny.*Natural/i,
  /Sara.*Natural/i,
  /Emma.*Natural/i,
  /Microsoft.*Natural.*\(/i,

  // Google Chrome neural / "Wavenet" voices.
  /Google.*US English.*Female/i,
  /Google.*UK English Female/i,

  // Standard Apple voices — still nicer than synthetic.
  /^Samantha$/i,
  /^Ava$/i,
  /^Allison$/i,
  /^Tessa$/i,
  /^Karen$/i,
  /^Moira$/i,
  /^Serena$/i,

  // Generic Google English.
  /Google US English/i,
  /Google UK English/i,

  /female/i,
];

function pickSoothingVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const pool = en.length ? en : voices;

  for (const pat of VOICE_PREFERENCES) {
    const match = pool.find((v) => pat.test(v.name));
    if (match) return match;
  }
  return pool[0];
}

/* ────────── Text chunking ────────── */

/**
 * Split text at sentence boundaries when a slide is long enough to risk
 * Chrome's ~200-character utterance cut-off. Short slides return as a
 * single chunk so cadence stays uninterrupted.
 */
function chunkForSpeech(text: string, MAX = 180): string[] {
  if (text.length <= MAX) return [text];
  const sentences = text.match(/[^.!?]+[.!?]?/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if ((current + ' ' + s).trim().length > MAX && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = current ? `${current} ${s}` : s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
