import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import UploadModal from '../components/UploadModal';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
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
  const location = useLocation();
  const navigate = useNavigate();

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
    return () => {
      if (previewFile && typeof previewFile === 'string') {
        URL.revokeObjectURL(previewFile);
      }
    };
  }, [previewFile]);

  const handleFileUpload = (file: File) => {
    const blobUrl = URL.createObjectURL(file);
    setPreviewFile(blobUrl);
    setShowModal(false);
    setSelectedPage(1);
    setTimeout(() => navigate('/documents'), 300);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setSelectedPage(1);
  };

  const filteredDocs =
    filter === 'All' ? documents : documents.filter((doc) => doc.type === filter);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const aiDocType = query.get('doc');
    if (aiDocType) {
      console.log(`AI should begin asking questions to build: ${aiDocType}`);
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
            {previewFile && selectedPage && (
              <div className="w-full h-full flex justify-center">
                <Document file={previewFile as string} onLoadSuccess={onDocumentLoadSuccess} className="text-white">
                  <Page
                    pageNumber={selectedPage}
                    width={900}
                  />
                </Document>
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
