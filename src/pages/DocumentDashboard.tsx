import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import UploadModal from '../components/UploadModal';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import { useAuth } from '../context/AuthContext';
import { generateLegalAdvice } from '../utils/agentHelper';
//import samplePDF from '../assets/sample.pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentType {
  id: string;
  title: string;
  type: string;
  createdAt: string;
}

const DocumentsDashboard = () => {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [filter, setFilter] = useState('All');
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [docTypeParam, setDocTypeParam] = useState<string>('');
  const [followUp, setFollowUp] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [followUpInput, setFollowUpInput] = useState('');
  const state = localStorage.getItem('state') || '';
  const city = localStorage.getItem('city') || '';
  const [followUpLoading, setFollowUpLoading] = useState(false);
  // put near the top of the component
const isCleanSuggestion = (s?: string) =>
  !!s &&
  s.trim().length > 0 &&
  s.trim().length < 180 &&
  !/[{}[\]]/.test(s) &&         // no JSON-y braces
  !/\n/.test(s) &&              // single line
  /[?!.]$/.test(s.trim());      // ends like a sentence



  const API_URL = import.meta.env.VITE_API_URL;
  console.log("🔥 API URL:", import.meta.env.VITE_API_URL);
  // turn arrays or strings into bullets
const bullets = (v: any): string =>
  Array.isArray(v) ? v.map((x) => `- ${x}`).join('\n') : String(v || '');

// handle objects like { Next Steps: [...], Motions/Filings: [...], Deadlines: '...' }
const bulletsFromObject = (obj: Record<string, any>): string =>
  Object.entries(obj || {})
    .map(([k, v]) => `*${k}*\n${bullets(v)}`)
    .join('\n\n');

// build a single text block from the structured JSON
const buildFollowUpBlock = (q: string, data: any) => {
  const { analysis = '', strategy = [], defenses = [], citations = [], clarify = [] } = data || {};

  const strategyText = Array.isArray(strategy)
    ? bullets(strategy)
    : bulletsFromObject(strategy); // <-- handles the [object Object] case

  const analysisText =
    typeof analysis === 'string'
      ? analysis
      : bulletsFromObject(analysis);

  return (
    `\n\nQ: ${q}\nA (Attorney analysis):\n\n` +
    `**Analysis**\n${analysisText}\n\n` +
    `**Strategy / Next steps**\n${strategyText}\n\n` +
    `**Defenses**\n${bullets(defenses)}\n\n` +
    `**Citations**\n${bullets(citations)}\n\n` +
    `**Clarify**\n${bullets(clarify)}\n`
  );
};


  const location = useLocation();
  const navigate = useNavigate();
  const samplePDF: string = '/sample.pdf';
  const testPdfUrl = samplePDF;
  console.log(samplePDF);

  const { generatedDocument, documentType, fromAI, mimeType } = location.state || {};
  const { user } = useAuth();
const handleDelete = async (id: string, type?: string) => {
  if (!window.confirm('Are you sure you want to delete this document?')) return;

  const token = localStorage.getItem('justicepath-token');
  if (!token) {
    alert('User not authenticated');
    return;
  }

  const url = type === 'ai'
    ? `${API_URL}/api/documents/${id}?type=ai`
    : `${API_URL}/api/documents/${id}`;

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`, // 🔐 Include token
      },
    });

    if (!res.ok) {
      throw new Error('Failed to delete document');
    }

    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  } catch (err) {
    console.error('❌ Failed to delete:', err);
    alert('Could not delete document. Please try again.');
  }
};

const handleFollowUp = async () => {
  if (!followUpInput.trim()) return;

  setFollowUpLoading(true); // ⏳ show spinner

  try {
    const res = await fetch(`${API_URL}/api/ai/follow-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        previousAnswer: aiResponse,
        question: followUpInput,
        documentType: documentType || docTypeParam || '',
        state,
        city,
        caseType: documentType || docTypeParam || '',
        jurisdiction: state ? `${city}, ${state}` : '',
        // force draft mode when user asks to draft/provide/write a motion
        forceAction:
          /\b(draft|write|prepare|compose|generate|provide|give|supply|make)\b/i.test(followUpInput) ||
          /\bmotion(?:\s+to)?\b/i.test(followUpInput),
      }),
    });

    const data = await res.json();

    if (!res.ok || data?.error) {
      console.error('❌ Follow-up failed:', data);
      alert(data?.message || data?.error || 'Follow-up failed.');
      return;
    }

    // ➊ Prefer drafted document if present (or if it *looks* like a pleading)
    const maybeDoc = (data?.doc || data?.answer || '').trim();
    const looksLikeDoc =
      /^(COMMONWEALTH OF|IN THE .*COURT|MOTION|COMPLAINT|AFFIDAVIT|DECLARATION|DEMAND LETTER|NOTICE|MEMORANDUM|PETITION)/i
        .test(maybeDoc);

    if (maybeDoc && (data?.doc || looksLikeDoc)) {
      const block = `\n\nQ: ${followUpInput}\nA (Draft document):\n\n${maybeDoc}\n`;
      setAiResponse(prev => (prev || '') + block);
      setFollowUpInput('');
      return; // ⛔ skip analysis rendering
    }

    // ➋ Fallback: structured analysis block
    const addition = buildFollowUpBlock(followUpInput, data);
    setAiResponse(prev => (prev || '') + addition);
    setFollowUpInput('');
  } catch (err) {
    console.error('❌ Network error during follow-up:', err);
    alert('Network error during follow-up.');
  } finally {
    setFollowUpLoading(false); // ✅ always hide spinner
  }
};

  useEffect(() => {
    const runAgent = async () => {
      if (!docTypeParam || !user?.fullName || aiResponse) return;

      const result = await generateLegalAdvice({
  caseType: docTypeParam || '', // <-- This is your legal issue type
  fullName: user.fullName,
  income: '0',
  reason: 'I need help with this legal issue',
  state: localStorage.getItem('state') || '',
  city: localStorage.getItem('city') || '',
});


      setAiResponse(result.main);
      setSuggestion(result.suggestion);
    };

    runAgent();
  }, [docTypeParam, user, aiResponse]);

  useEffect(() => {
    if (location.pathname === '/documents') {
      setShowModal(true);
    }
  }, [location.pathname]);

  useEffect(() => {
  const fetchDocuments = async () => {
    if (!user) return;

    const token = localStorage.getItem('justicepath-token');
    const res = await fetch(`${API_URL}/api/documents/user/${user.id}`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    setDocuments(data);
  };

  fetchDocuments();
}, [user]);

  useEffect(() => {
    console.log("👁️ Watching previewFile change:", previewFile);
    return () => {
      if (previewFile && typeof previewFile === 'string') {
        URL.revokeObjectURL(previewFile);
      }
    };
  }, [previewFile]);

  const refreshToken = async (): Promise<string | null> => {
  try {
    const r = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',              // or 'GET' if that's what your API expects
      credentials: 'include',
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (j?.token) {
      localStorage.setItem('justicepath-token', j.token);
      return j.token;
    }
    return null;
  } catch {
    return null;
  }
};

const handleFileUpload = async (file: File) => {
  const token0 = localStorage.getItem('justicepath-token');
  if (!user?.id || !token0) {
    alert('You need to be logged in to upload.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  // helper to do one upload attempt (optionally with a token header)
  const uploadOnce = async (token?: string) => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`; // some routes require this

    return fetch(`${API_URL}/api/documents/upload`, {
      method: 'POST',
      credentials: 'include',     // send cookies for cookie-based auth
      headers,
      body: formData,
    });
  };

  try {
    // 1) first try with the current token
    let res = await uploadOnce(token0);

    // 2) if unauthorized, refresh and retry once
    if (res.status === 401) {
      const token1 = await refreshToken();
      if (token1) {
        res = await uploadOnce(token1);
      }
    }

    // 3) some dev setups only use cookie auth; if still 401 and we sent a header, try cookie-only
    if (res.status === 401) {
      res = await uploadOnce(undefined);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('❌ Upload failed:', res.status, errText);
      alert('Upload failed. Check the console for details.');
      return;
    }

    const result = await res.json();
    console.log('✅ Upload result:', result);

    // Show preview
    const blobUrl = URL.createObjectURL(file);
    setPreviewFile(blobUrl);
    setShowModal(false);
    setSelectedPage(1);

    // Refresh user documents list
    const token = localStorage.getItem('justicepath-token');
    const docRes = await fetch(`${API_URL}/api/documents/user/${user.id}`, {
      credentials: 'include',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!docRes.ok) {
      throw new Error('Failed to fetch updated documents');
    }
    const data = await docRes.json();
    setDocuments(data);
    navigate('/documents'); // optional
  } catch (err) {
    console.error('❌ Upload or fetch failed:', err);
    alert('Upload failed. Check the console for details.');
  }
};

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log("✅ PDF Loaded:", numPages);
    setNumPages(numPages);
    setSelectedPage(1);
  };

const filteredDocs =
  Array.isArray(documents) && documents.length > 0
    ? filter === 'All'
      ? documents
      : documents.filter((doc) => doc?.type === filter)
    : [];

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const docType = query.get('doc');
    if (docType) {
      setDocTypeParam(docType);
      console.log(`AI should begin asking questions to build: ${docType}`);
    }
  }, [location.search]);

  useEffect(() => {
    const handleDropdownMessage = (event: MessageEvent) => {
      if (event.data?.type === 'navigate-to-documents' && event.data.payload) {
        navigate(`/documents?doc=${encodeURIComponent(event.data.payload)}`);
      }
    };
    window.addEventListener('message', handleDropdownMessage);
    return () => window.removeEventListener('message', handleDropdownMessage);
  }, [navigate]);

  
  useEffect(() => {
    const saveAndRender = async () => {
      if (fromAI && generatedDocument) {
        if (!user?.id || !documentType || !generatedDocument) {
          console.error('❌ Missing required fields for AI document save.');
          navigate('/documents', { replace: true, state: null });
          return;
        }

        let blob: Blob;

        if (mimeType === 'application/pdf' && generatedDocument instanceof Uint8Array) {
       const u8 = new Uint8Array(generatedDocument);        // <-- strips the generic
       blob = new Blob([u8], { type: mimeType });
        } else if (typeof generatedDocument === 'string') {
          const trimmed = generatedDocument.trim();
          const isLikelyHTML = trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html');

          if (isLikelyHTML) {
            console.warn('🚫 Generated document is HTML. Cannot render as PDF.');
            setAiResponse('⚠️ AI failed to return a valid document. Please try again or select another type.');
            setShowModal(false);
            return;
          }

          setAiResponse(generatedDocument);
          setShowModal(false);

          try {
            const analysisRes = await fetch(`${API_URL}/api/ai/analyze-document`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: generatedDocument, documentType }),
            });

            const analysisData = await analysisRes.json();
            if (analysisData.main) {
              setSuggestion(analysisData.main);
              setFollowUp('What are next steps?');
            }
          } catch (error) {
            console.error('❌ AI backend analysis failed:', error);
          }

          const documentPayload = {
            userId: user.id,
            documentType,
            title: `${documentType} Draft`,
            content: generatedDocument,
            followUps: suggestion ? [{ question: 'What is next?', answer: suggestion }] : [],
            aiSuggestion: suggestion,
            source: 'form',
            status: 'draft',
          };

          try {
            const saveRes = await fetch(`${API_URL}/api/ai/save-ai-document`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(documentPayload),
            });
            const saveData = await saveRes.json();
            console.log('✅ AI document saved:', saveData);
          } catch (err) {
            console.error('❌ Failed to save AI document to DB:', err);
          }

          navigate('/documents', { replace: true, state: null });
          return;
        } else {
          console.warn('Unsupported document format.');
          return;
        }

        try {
          const blobUrl = URL.createObjectURL(blob);
          console.log("📎 Generated Blob URL:", blobUrl);
          setPreviewFile(blobUrl);
          setSelectedPage(1);
          setShowModal(false);
          navigate('/documents', { replace: true, state: null });

          return () => URL.revokeObjectURL(blobUrl);
        } catch (err) {
          console.error('❌ Failed to render PDF blob:', err);
        }
      }
    };

    saveAndRender();
  }, [fromAI, generatedDocument, mimeType, documentType, user, navigate]);

  useEffect(() => {
    if (docTypeParam && aiResponse) {
      window.postMessage(
        {
          type: 'navigate-to-documents',
          payload: docTypeParam,
        },
        window.location.origin
      );
    }
  }, [docTypeParam, aiResponse]);

  useEffect(() => {
    const handleAiGenerated = (event: MessageEvent) => {
      if (event.data?.type === 'set-ai-response') {
        setAiResponse(event.data.payload || '');
      }
    };
    window.addEventListener('message', handleAiGenerated);
    return () => window.removeEventListener('message', handleAiGenerated);
  }, []);
  console.log("📄 Sample docs:", filteredDocs.slice(0, 10));


  return (
    <>
      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onFileUpload={handleFileUpload}
        />
      )}

      <div className="bg-black text-white min-h-screen w-full flex flex-col">
        <div className="w-full bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-yellow-400">📄 My Legal Documents</h1>
          <div className="space-x-2 text-sm text-gray-400 italic">
            <span>🖊️ Editor Controls Coming Soon</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 bg-[#121212] p-6 border-r border-gray-800 flex flex-col">
            <label className="block text-gray-400 text-sm mb-2">Filter by type:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 mb-4"
            >
              <option>All</option>
              <option>Eviction</option>
              <option>Small Claims</option>
              <option>Family Law</option>
            </select>

            <button
              onClick={() => setShowModal(true)}
              className="block text-center bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 mb-4"
            >
              + New Document
            </button>

            <div className="bg-gray-900 text-gray-300 rounded text-sm border border-gray-700 px-4 py-3 flex-1">
              <h2 className="text-yellow-400 font-semibold text-base mb-2">📎 Preview</h2>
              <div className="flex flex-col gap-3 overflow-y-auto">
                {Array.from({ length: numPages }, (_, index) => (
                  <div
                    key={index}
                    className={`bg-gray-900 border border-gray-700 rounded shadow p-1 w-full aspect-[3/4] cursor-pointer hover:ring-2 hover:ring-yellow-400 transition ${selectedPage === index + 1 ? 'ring-2 ring-yellow-400' : ''}`}
                    onClick={() => setSelectedPage(index + 1)}
                  >
                    <div className="w-full h-full flex justify-center items-center overflow-hidden">
<Document
  file={previewFile || testPdfUrl}
  onLoadSuccess={onDocumentLoadSuccess}
  onLoadError={(err) => console.error("❌ PDF load error:", err)} // <-- ADD THIS LINE
  loading={<p className="text-sm text-gray-400">Loading preview...</p>}
  noData={<p className="text-sm text-red-500">No file provided.</p>}
>
  <Page
    pageNumber={index + 1}
    height={230}
    renderAnnotationLayer={false}
    renderTextLayer={false}
  />
</Document>

                    </div>
                  </div>
                ))}
                {numPages === 0 && <p className="text-sm">No document selected.</p>}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-black overflow-auto p-4">
            {previewFile ? (
  <div className="w-full h-full flex justify-center">
    <Document
      file={previewFile}
      onLoadSuccess={onDocumentLoadSuccess}
      onLoadError={(err) => console.error("❌ PDF load error:", err)}
      loading={<p className="text-sm text-gray-400">Loading full document...</p>}
      noData={<p className="text-sm text-red-500">No file provided.</p>}
    >
      <Page
        pageNumber={selectedPage || 1}
        width={800}
        renderAnnotationLayer={true}
        renderTextLayer={true}
      />
    </Document>
  </div>
) : (
  <div className="p-8">
    {aiResponse && (
      <div className="mb-6">
        <button
          onClick={() => {
            setAiResponse('');
            setPreviewFile(null);
            setShowModal(false);
          }}
          className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600 transition"
        >
          Show My Documents
        </button>
      </div>
    )}

    {aiResponse ? (
      <div className="bg-gray-800 text-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-yellow-400">AI Response</h2>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
  {aiResponse.split('\n').map((line, i) => {
    const isQuestion = line.trim().startsWith('Q:');
    return (
      <div
        key={i}
        className={isQuestion ? 'text-yellow-300 font-medium' : ''}
      >
        {line}
      </div>
    );
  })}
</div>

        {isCleanSuggestion(suggestion) && (
          <div className="mt-4 p-4 bg-gray-700 rounded text-sm text-gray-300 border-t border-gray-600">
            <strong className="text-yellow-400">💡 Follow-up:</strong> {suggestion}
          </div>
        )}
        {aiResponse && (
          <div className="mt-6">
            <label className="block text-sm text-yellow-300 mb-1">
              Ask follow-up or add details to improve this response:
            </label>
            <div className="flex gap-2 items-center">
  <input
    type="text"
    value={followUpInput}
    onChange={(e) => setFollowUpInput(e.target.value)}
    className="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white text-sm"
    placeholder="e.g. Include a reference to OCGA § 44-7-7"
  />

  {/* 👇 Upload button */}
  <button
    type="button"
    onClick={() => setShowModal(true)}
    className="w-8 h-8 rounded-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg flex items-center justify-center"
    title="Upload a document"
    aria-label="Upload a document"
  >
    +
  </button>

  <button
    onClick={handleFollowUp}
    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
    disabled={followUpLoading}
  >

  {followUpLoading ? (
    <>
      <svg
        className="animate-spin h-4 w-4 mr-2 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8z"
        />
      </svg>
      Sending...
    </>
  ) : (
    'Send'
  )}
</button>

            </div>
          </div>
        )}
      </div>
    ) : filteredDocs.length === 0 ? (
      <p className="text-gray-400">No documents found.</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        


        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-gray-800 rounded-lg p-5 shadow hover:shadow-xl transition"
          >
            <h3 className="text-lg font-semibold text-yellow-400">{doc.title}</h3>
            <p className="text-sm text-gray-400 mt-1">Type: {doc.type}</p>
            <p className="text-sm text-gray-500 mt-1">
              <p className="text-sm text-gray-500 mt-1">
  Created: {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : <em className="text-gray-400">Not available</em>}
</p>

            </p>
            <div className="mt-4 flex gap-4">
              <Link
                to={`/documents/${doc.id}`}
                className="text-blue-400 hover:underline text-sm"
              >
                View / Edit
              </Link>
              <button className="text-red-400 hover:underline text-sm"
              onClick={() => handleDelete(doc.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentsDashboard;