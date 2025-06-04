import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UploadModal from '../components/UploadModal';
import * as pdfjsLib from 'pdfjs-dist';
import { getAIChatResponse } from '../utils/chatAssistant';
import PDFPreview from '../components/PDFPreview';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Document {
  id: string;
  title: string;
  type: string;
  createdAt: string;
}

const DocumentsDashboard = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState('All');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [thumbnailPages, setThumbnailPages] = useState<string[]>([]);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/documents') {
      setShowModal(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchDocuments = async () => {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
    };
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (previewFile) {
      const url = URL.createObjectURL(previewFile);
      setPreviewURL(url);
      generateThumbnails(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [previewFile]);

  const generateThumbnails = async (url: string) => {
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport }).promise;
        pages.push(canvas.toDataURL());
      }
      setThumbnailPages(pages);
    } catch (err) {
      console.error('Failed to generate thumbnails', err);
    }
  };

  const handleFileUpload = (file: File) => {
    setPreviewFile(file);
    setShowModal(false);
  };

  const handleAIChat = async () => {
    if (!selectedDocType) return;
    setShowChat(true);
    setChatHistory([`🤖: What should this ${selectedDocType} document help you accomplish?`]);
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    setChatHistory((prev) => [...prev, `🧑: ${chatInput}`]);
    setIsLoading(true);
    const aiReply = await getAIChatResponse(chatInput);
    setChatHistory((prev) => [...prev, `🤖: ${aiReply}`]);
    setChatInput('');
    setIsLoading(false);
  };

  const filteredDocs =
    filter === 'All' ? documents : documents.filter((doc) => doc.type === filter);

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

            <div className="bg-gray-900 text-gray-300 rounded text-sm border border-gray-700 px-4 py-3">
              <h2 className="text-yellow-400 font-semibold text-base mb-2">📎 Preview</h2>
              {previewFile ? (
                previewFile.type === 'application/pdf' && previewURL ? (
                  <iframe
                    src={previewURL}
                    title="PDF Preview"
                    className="w-full h-40 rounded border border-gray-700"
                  />
                ) : (
                  <p className="text-sm mt-2 text-gray-300">📄 {previewFile.name}</p>
                )
              ) : (
                <p className="text-sm">No document selected.</p>
              )}
            </div>
          </div>

          <div className="flex-1 bg-black overflow-auto p-4">
            {previewFile?.type === 'application/pdf' && previewURL && (
              <iframe
                src={previewURL}
                title="Full Document"
                className="w-full"
                style={{ height: 'calc(100vh - 120px)', border: 'none' }}
              />
            )}

            {previewFile && (
              <div className="mt-6">
                <label className="block text-white mb-2 font-medium">Select Document Type:</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-64 bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
                >
                  <option value="">-- Select --</option>
                  <option>General Advice</option>
                  <option>Motion</option>
                  <option>Response</option>
                  <option>Reply to Motion</option>
                  <option>Legal Precedent Summary</option>
                  <option>Contract Analysis</option>
                  <option>Arbitration Assistance</option>
                  <option>Award Estimation</option>
                </select>
                <button
                  onClick={handleAIChat}
                  className="ml-4 px-4 py-2 rounded bg-yellow-500 text-black font-semibold hover:bg-yellow-600"
                >
                  Ask AI
                </button>
              </div>
            )}

            {showChat && (
              <div className="fixed bottom-6 right-6 w-96 h-96 bg-white text-black rounded-lg shadow-lg flex flex-col">
                <div className="bg-yellow-500 p-3 flex justify-between items-center font-semibold">
                  <span>AI Legal Assistant</span>
                  <button onClick={() => setShowChat(false)}>×</button>
                </div>
                <div className="flex-1 p-3 overflow-y-auto text-sm space-y-2">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-2 rounded whitespace-pre-wrap break-words max-w-[90%] ${
                        msg.startsWith('🤖') ? 'bg-gray-200 text-gray-900 self-start' : 'bg-blue-600 text-white self-end'
                      }`}
                    >
                      {msg.replace(/^🤖: |^🧑: /, '')}
                    </div>
                  ))}
                  {isLoading && <p className="text-yellow-600 italic">Typing...</p>}
                </div>
                <div className="border-t p-3 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                    placeholder="Ask follow-up..."
                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                  />
                  <button
                    onClick={handleChatSubmit}
                    className="bg-yellow-500 px-4 py-2 rounded text-black hover:bg-yellow-600"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {!previewFile && (
              <div className="p-8">
                {filteredDocs.length === 0 ? (
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
                          <button className="text-red-400 hover:underline text-sm">Delete</button>
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
