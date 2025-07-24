import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import UploadModal from '../components/UploadModal';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import { useAuth } from '../context/AuthContext';
import { generateLegalAdvice } from '../utils/agentHelper';

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
  const API_URL = import.meta.env.VITE_API_URL;
  console.log("🔥 API URL:", import.meta.env.VITE_API_URL);

  const location = useLocation();
  const navigate = useNavigate();
  const { generatedDocument, documentType, fromAI, mimeType } = location.state || {};
  const { user } = useAuth();
  const handleDelete = async (id: string) => {
  if (!window.confirm('Are you sure you want to delete this document?')) return;

  try {
    const res = await fetch(`${API_URL}/api/ai/ai-documents/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to delete document');
    }

    // Remove from local state
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  } catch (err) {
    console.error('❌ Failed to delete:', err);
    alert('Could not delete document. Please try again.');
  }
};


  const handleFollowUp = async () => {
    if (!followUpInput.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/ai/analyze-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: aiResponse + `\n\nUser added: ${followUpInput}`,
          documentType: documentType || 'document',
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        console.error('❌ Server returned an error:', res.status, text);
        return;
      }

      try {
        const data = JSON.parse(text);
        console.log('✅ Follow-up result:', data);

        if (data?.main) {
          setAiResponse((prev) => prev + '\n\n' + data.main);
          setFollowUpInput('');
        } else {
          console.warn('⚠️ No "main" field in AI response:', data);
        }
      } catch (parseErr) {
        console.error('❌ JSON parsing error:', parseErr);
        console.warn('⚠️ Raw response text:', text);
      }
    } catch (err) {
      console.error('❌ Network error during follow-up:', err);
    }
  };

  useEffect(() => {
    const runAgent = async () => {
      if (!docTypeParam || !user?.fullName || aiResponse) return;

      const result = await generateLegalAdvice({
        caseType: docTypeParam,
        fullName: user.fullName,
        income: '0',
        reason: 'I need help with this legal issue',
        documentType: 'document',
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
      console.log('Token:', token); // Debug line

      const res = await fetch(`${API_URL}/api/documents/user/${user.id}`, {
  headers: {
    'Authorization': `Bearer ${token}`, // <-- Your login token here
    'Content-Type': 'application/json',
  }
});

      const data = await res.json();
      setDocuments(data);
    };
    fetchDocuments();
  }, []);

  useEffect(() => {
    return () => {
      if (previewFile && typeof previewFile === 'string') {
        URL.revokeObjectURL(previewFile);
      }
    };
  }, [previewFile]);

  const handleFileUpload = async (file: File) => {
  const blobUrl = URL.createObjectURL(file);
  setPreviewFile(blobUrl);
  setShowModal(false);
  setSelectedPage(1);

  // ✅ Re-fetch documents
  const token = localStorage.getItem('justicepath-token');
  if (user?.id && token) {
    try {
      const res = await fetch(`${API_URL}/api/documents/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('❌ Failed to fetch updated documents:', err);
    }
  }

  navigate('/documents'); // optional: refresh view state
};


  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setSelectedPage(1);
  };

  const filteredDocs =
    filter === 'All' ? documents : documents.filter((doc) => doc.type === filter);

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
          return;
        }

        let blob: Blob;

        if (mimeType === 'application/pdf' && generatedDocument instanceof Uint8Array) {
          blob = new Blob([generatedDocument], { type: mimeType });
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

          return () => URL.revokeObjectURL(blobUrl);
        } catch (err) {
          console.error('❌ Failed to render PDF blob:', err);
        }
      }
    };

    saveAndRender();
  }, [fromAI, generatedDocument, mimeType, documentType, user]);

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
                        file={previewFile as string}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading=""
                        noData=""
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
            {!previewFile && (
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
        <pre className="whitespace-pre-wrap text-sm">{aiResponse}</pre>
        {suggestion && (
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
              <button
                onClick={() => setShowModal(true)}
                className="text-white px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded"
                title="Attach a document"
              >
                ➕
              </button>
              <button
                onClick={handleFollowUp}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Send
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
              Created: {new Date(doc.createdAt).toLocaleDateString()}
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
