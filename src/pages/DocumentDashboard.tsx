import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UploadModal from '../components/UploadModal';
import PDFPreview from '../components/PDFPreview';

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
      return () => URL.revokeObjectURL(url);
    }
  }, [previewFile]);

  const handleFileUpload = (file: File) => {
    setPreviewFile(file);
    setShowModal(false);
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
          {/* Sidebar */}
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

            <Link
              to="/documents/new"
              className="block text-center bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 mb-4"
            >
              + New Document
            </Link>

            <div className="bg-gray-900 text-gray-300 rounded text-sm border border-gray-700 px-4 py-3 flex-1 overflow-y-auto">
              <h2 className="text-yellow-400 font-semibold text-base mb-2">📎 Preview</h2>
              {previewFile?.type === 'application/pdf' && previewURL ? (
                <PDFPreview fileUrl={previewURL} previewMode={true} />
              ) : previewFile ? (
                <p className="text-sm mt-2 text-gray-300">📄 {previewFile.name}</p>
              ) : (
                <p className="text-sm">No document selected.</p>
              )}
            </div>
          </div>

          {/* Main Document Viewer */}
          <div className="flex-1 bg-black overflow-auto p-4">
            {previewFile?.type === 'application/pdf' && previewURL && (
              <iframe
                src={previewURL}
                title="Full Document"
                className="w-full"
                style={{ height: 'calc(100vh - 120px)', border: 'none' }}
              />
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
