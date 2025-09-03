// src/pages/DocumentDashboard.tsx

// PDF worker (keep this at the very top)
import { pdfjs } from 'react-pdf';

// ✅ always use the exact worker version that matches the API in use
pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UploadModal from '../components/UploadModal';
import { Document, Page } from 'react-pdf';
import { useAuth } from '../context/AuthContext';

type DocumentType = {
  id: string;
  title: string;
  type: string;
  createdAt: string;
};

const DocumentsDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [filter, setFilter] = useState<'All' | 'Eviction' | 'Small Claims' | 'Family Law'>('All');

  const [showModal, setShowModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const samplePdfUrl = '/sample.pdf' as const; // used when nothing uploaded in this session
  const fileToShow = previewFile || samplePdfUrl;
  

  const clearPreview = () => {
  if (previewFile) URL.revokeObjectURL(previewFile);
  setPreviewFile(null);
  setNumPages(0);
  setSelectedPage(null);
};


  // ---------- Data ----------
  const fetchDocuments = async () => {
    if (!user) return;
    const token = localStorage.getItem('justicepath-token') || '';

    const res = await fetch(`${API_URL}/api/documents/user/${user.id}`, {
      method: 'GET',
      credentials: 'include', // ✅ send jp_rt HttpOnly cookie
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch documents');
      return;
    }
    const data: DocumentType[] = await res.json();
    setDocuments(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ---------- Upload ----------
  const handleFileUpload = async (file: File) => {
    const token = localStorage.getItem('justicepath-token');
    if (!user?.id || !token) {
      console.error('❌ Missing user or token');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1) Upload
      const uploadRes = await fetch(`${API_URL}/api/documents/upload`, {
        method: 'POST',
        credentials: 'include', // ✅ cookie
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      await uploadRes.json();

      // 2) Show local preview
      const blobUrl = URL.createObjectURL(file);
      setPreviewFile(blobUrl);
      setSelectedPage(1);
      setShowModal(false);

      // 3) Refresh list
      await fetchDocuments();
      navigate('/documents');
    } catch (err) {
      console.error('❌ Upload or fetch failed:', err);
      alert('Upload failed. Check the console for details.');
    }
  };

  // ---------- Delete ----------
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    const token = localStorage.getItem('justicepath-token');
    if (!token) {
      alert('User not authenticated');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'DELETE',
        credentials: 'include', // ✅ cookie
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete document');
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('❌ Failed to delete:', err);
      alert('Could not delete document. Please try again.');
    }
  };

  // ---------- PDF ----------
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setSelectedPage(1);
  };

  useEffect(() => {
    return () => {
      if (previewFile) URL.revokeObjectURL(previewFile);
    };
  }, [previewFile]);
  // When the file changes (new blob/sample), reset page state
useEffect(() => {
  setNumPages(0);
  setSelectedPage(null);
}, [fileToShow]);


  // ---------- Filtering ----------
  const filteredDocs =
    filter === 'All' ? documents : documents.filter((d) => d.type === filter);

  // ---------- UI ----------
  return (
    <>
      {showModal && (
        <UploadModal onClose={() => setShowModal(false)} onFileUpload={handleFileUpload} />
      )}

      <div className="bg-black text-white min-h-screen w-full flex flex-col">
        {/* Header */}
        <div className="w-full bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-yellow-400">📄 My Legal Documents</h1>
          <div className="space-x-2 text-sm text-gray-400 italic">
            <span>🖊️ Editor Controls Coming Soon</span>
          </div>
        </div>

        {/* Main */}
      <div className="flex flex-1 overflow-hidden">
  {/* LEFT: controls + preview */}
  <div className="w-72 bg-[#121212] p-6 border-r border-gray-800 flex flex-col">
    <label className="block text-gray-400 text-sm mb-2">Filter by type:</label>
    <select
      value={filter}
      onChange={(e) =>
        setFilter(e.target.value as 'All' | 'Eviction' | 'Small Claims' | 'Family Law')
      }
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
        {Array.from({ length: numPages }, (_, idx) => (
          <div
            key={idx}
            className={`bg-gray-900 border border-gray-700 rounded shadow p-1 w-full aspect-[3/4] cursor-pointer hover:ring-2 hover:ring-yellow-400 transition ${
              selectedPage === idx + 1 ? 'ring-2 ring-yellow-400' : ''
            }`}
            onClick={() => setSelectedPage(idx + 1)}
            title={`Page ${idx + 1}`}
          >
            <div className="w-full h-full flex justify-center items-center overflow-hidden">
              <Document
                file={fileToShow}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(e: unknown) => console.error('❌ PDF load error (thumb):', e)}
                loading={<p className="text-sm text-gray-400">Loading preview…</p>}
                noData={<p className="text-sm text-red-500">No file provided.</p>}
              >
                <Page
                  pageNumber={idx + 1}
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

  {/* RIGHT: big viewer + grid */}
  <div className="flex-1 bg-black overflow-auto p-6 space-y-6">
    {/* 👇 BIG PDF VIEWER (drives thumbnails & selectedPage) */}
    <div className="w-full flex justify-center">
      <Document
        key={`main-${fileToShow}`}        // re-mount when file changes
        file={fileToShow}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(e: unknown) => console.error('❌ react-pdf load error (main):', e)}
        loading={<p className="text-sm text-gray-400">Loading full document…</p>}
        noData={<p className="text-sm text-red-500">No file provided.</p>}
      >
        <Page
          pageNumber={selectedPage || 1}
          width={800}
          renderAnnotationLayer
          renderTextLayer
        />
      </Document>
    </div>

    {/* 👇 Hide the grid while a preview is active */}
    {!previewFile && (
      filteredDocs.length === 0 ? (
        <p className="text-gray-400">No documents found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="bg-gray-800 rounded-lg p-5 shadow hover:shadow-xl transition">
              <h3 className="text-lg font-semibold text-yellow-400">{doc.title}</h3>
              <div className="text-sm text-gray-400 mt-1">Type: {doc.type}</div>
              <div className="text-sm text-gray-500 mt-1">
                Created:{' '}
                {doc.createdAt ? (
                  new Date(doc.createdAt).toLocaleDateString()
                ) : (
                  <em className="text-gray-400">Not available</em>
                )}
              </div>
              <div className="mt-4 flex gap-4">
                <Link to={`/documents/${doc.id}`} className="text-blue-400 hover:underline text-sm">
                  View / Edit
                </Link>
                <button
                  className="text-red-400 hover:underline text-sm"
                  onClick={() => handleDelete(doc.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )
    )}
  </div>
</div>
</div>
    </>
  );
};

export default DocumentsDashboard;
