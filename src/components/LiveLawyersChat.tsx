// src/components/LiveLawyersChat.tsx
import React, { useEffect, useRef, useState } from 'react';

type MicState = 'unknown' | 'granted' | 'denied' | 'prompt';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const LiveLawyersChat: React.FC = () => {
  const [jurisdiction, setJurisdiction] = useState<string>(`${localStorage.getItem('city') || ''}${localStorage.getItem('state') ? (localStorage.getItem('city') ? ', ' : '') + localStorage.getItem('state') : ''}`);
  const [mode, setMode] = useState<'Court mode' | 'Normal'>('Court mode');
  const [role, setRole] = useState<'tenant' | 'landlord' | 'plaintiff' | 'defendant'>('tenant');

  const [micState, setMicState] = useState<MicState>('unknown');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [answerBlocks, setAnswerBlocks] = useState<string[]>([]);

  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const startedRef     = useRef(false);

  // --- Mic permission bootstrap
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        // Try to read current permission (may throw on some browsers)
        if ((navigator as any).permissions) {
          const status = await (navigator as any).permissions.query({ name: 'microphone' as any });
          if (!canceled) setMicState(status.state as MicState);
          status.onchange = () => setMicState(status.state as MicState);
        } else {
          setMicState('prompt'); // show button to request
        }
      } catch {
        setMicState('prompt');
      }
    })();
    return () => { canceled = true; };
  }, []);

  // --- Ask for the mic explicitly (this triggers the browser prompt)
  const askForMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      // We only needed permission; stop tracks right away
      stream.getTracks().forEach(t => t.stop());
      setMicState('granted');
      // optionally auto-start listening after grant
      handleStart();
    } catch {
      setMicState('denied');
    }
  };

  // --- Init SpeechRecognition
  const makeRecognizer = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = 'en-US';
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onstart = () => {
    startedRef.current = true;
    setListening(true);
  };
  rec.onend = () => {
    startedRef.current = false;
    setListening(false);
    // If the user still wants to listen, restart after a short delay
    if (listeningRef.current) {
      setTimeout(() => {
        try { rec.start(); } catch {}
      }, 250);
    }
  };
  rec.onerror = () => {
    // Let onend handle the auto-restart logic
  };

  rec.onresult = (e: any) => {
    let txt = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      txt += e.results[i][0].transcript;
    }
    setTranscript(prev => (prev + (prev && !prev.endsWith(' ') ? ' ' : '') + txt).trim());
  };

  return rec;
};

const requestMic = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true }
    });
    stream.getTracks().forEach(t => t.stop());
    setMicState('granted');
    // Do NOT auto-start here to avoid double-starts
  } catch {
    setMicState('denied');
  }
};

const handleStart = () => {
  if (startedRef.current) return;       // <-- guard
  const rec = (recognitionRef.current ||= makeRecognizer());
  if (!rec) {
    alert('Speech recognition not supported in this browser.');
    return;
  }
  listeningRef.current = true;
  try { rec.start(); } catch (err: any) {
    if (err?.name !== 'InvalidStateError') throw err;
  }
};

const handleStop = () => {
  listeningRef.current = false;
  startedRef.current = false;
  try { recognitionRef.current?.stop?.(); } catch {}
};

  // --- Send the latest utterance chunk to backend on pause (optional enhancement)
  // For a first cut, add a small “Send to AI” button:
  const sendToAI = async () => {
    const utterance = transcript.trim();
    if (!utterance) return;

    const API_URL = import.meta.env.VITE_API_URL;
    const resp = await fetch(`${API_URL}/api/live/advise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        utterance,
        jurisdiction,
        caseType: role,
        courtroomMode: mode === 'Court mode',
        forceAction: /\b(draft|write|motion|prepare|create)\b/i.test(utterance)
      })
    });

    const data = await resp.json();

    // Prefer a drafted document if provided; otherwise render structured analysis
    const maybeDoc = (data?.doc || data?.answer || '').trim();
    const looksLikeDoc =
      /^(COMMONWEALTH OF|STATE OF|IN THE .*COURT|MOTION|COMPLAINT|AFFIDAVIT|DECLARATION|DEMAND LETTER|NOTICE|MEMORANDUM|PETITION)/i
        .test(maybeDoc);

    let block = '';
    if (maybeDoc && (data?.doc || looksLikeDoc)) {
      block = `**Draft document**\n\n${maybeDoc}`;
    } else {
      const { analysis = '', strategy = [], defenses = [], citations = [], clarify = [] } = data || {};
      const bullets = (v: any) => Array.isArray(v) ? v.map((x: string) => `- ${x}`).join('\n') : String(v || '');
      const analysisText = typeof analysis === 'string'
        ? analysis
        : Object.entries(analysis || {}).map(([k, v]) => `*${k}*\n${bullets(v)}`).join('\n\n');

      block = [
        '**Advice**',
        analysisText,
        '',
        '**Strategy / Next steps**',
        bullets(strategy),
        '',
        '**Defenses**',
        bullets(defenses),
        '',
        '**Citations**',
        bullets(citations),
        '',
        '**If needed, clarify**',
        bullets(clarify),
      ].join('\n');
    }

    setAnswerBlocks(prev => [block, ...prev]);
    setTranscript(''); // clear after send
  };

  // --- UI
  return (
    <div className="pt-16 bg-black text-white min-h-screen">
      {/* Full-width workspace below the fixed navbar */}
      <div className="w-full h-[calc(100vh-64px)] grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Left: controls + transcript */}
        <div className="flex flex-col bg-[#0b1016] border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <input
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              placeholder="Jurisdiction (e.g., Atlanta, GA)"
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 w-full md:w-1/2"
            />
            <select
              value={mode}
              onChange={e => setMode(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
            >
              <option>Court mode</option>
              <option>Normal</option>
            </select>
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
            >
              <option value="tenant">tenant</option>
              <option value="landlord">landlord</option>
              <option value="plaintiff">plaintiff</option>
              <option value="defendant">defendant</option>
            </select>
          </div>

          <p className="text-xs text-amber-300 mb-2">
            ⚠️ Make sure recording is allowed where you are. Many courts forbid recording devices.
          </p>

          {/* Mic controls */}
          <div className="flex items-center gap-2 mb-3">
            {micState !== 'granted' ? (
              <button
                onClick={askForMic}
                className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400"
              >
                Enable microphone
              </button>
            ) : listening ? (
              <button onClick={handleStop} className="bg-red-600 px-4 py-2 rounded hover:bg-red-500">
                Stop listening
              </button>
            ) : (
              <button onClick={handleStart} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500">
                Start listening
              </button>
            )}

            <button
              onClick={sendToAI}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-500"
              disabled={!transcript.trim()}
            >
              Send to AI
            </button>
          </div>

          {/* Transcript area fills remaining height */}
          <div className="text-sm bg-black/40 border border-slate-800 rounded p-3 h-full overflow-auto">
            <div className="text-slate-400 mb-1">Live Transcript</div>
            <pre className="whitespace-pre-wrap text-slate-200">{transcript || '—'}</pre>
          </div>
        </div>

        {/* Right: results */}
        <div className="flex flex-col bg-[#0b1016] border border-slate-800 rounded-xl p-4 overflow-hidden">
          <div className="text-slate-300 mb-2">Advice & Drafts</div>
          <div className="flex-1 overflow-auto space-y-4">
            {answerBlocks.length === 0 ? (
              <div className="text-slate-500 text-sm">Nothing yet—speak and click “Send to AI”.</div>
            ) : (
              answerBlocks.map((b, i) => (
                <div key={i} className="bg-black/40 border border-slate-800 rounded p-3 whitespace-pre-wrap text-sm leading-relaxed">
                  {b}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveLawyersChat;
