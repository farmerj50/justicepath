import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

type Doc = {
  id: string;
  title: string;
  type: string;
  content?: string;
  name?: string;
  court?: string;
  motionType?: string;
  caseNumber?: string;
  claimants?: string;
  respondents?: string;
};

const ViewDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let cancelled = false;

    const fetchDocument = async () => {
      try {
        const token = localStorage.getItem('justicepath-token') ?? '';
        const res = await fetch(`${API_URL}/api/documents/${id}`, {
          method: 'GET',
          credentials: 'include', // ✅ send jp_rt cookie
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: 'application/json',
          },
        });

        if (!res.ok) {
          // helpful console for 401/403
          console.warn('[ViewDocument] fetch failed:', res.status, res.statusText);
          throw new Error(String(res.status));
        }

        const data = (await res.json()) as Doc;
        if (!cancelled) setDoc(data);
      } catch (err) {
        if (!cancelled) setDoc(null);
        console.error('Failed to load document:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (id) fetchDocument();
    return () => {
      cancelled = true;
    };
  }, [id, API_URL]);

  const handleDownloadPDF = () => {
    if (!doc) return;
    const blob = new Blob([doc.content ?? ''], { type: 'application/pdf' });
    const a = window.document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${doc.title || 'document'}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handlePrint = () => {
    if (!doc) return;
    const w = window.open('', '_blank');
    w?.document.write(`
      <html>
        <head><title>${doc.title}</title></head>
        <body style="white-space: pre-wrap; font-family: sans-serif; padding: 2rem;">
          <h1>${doc.title}</h1>
          <p><strong>Type:</strong> ${doc.type}</p>
          <p><strong>Name:</strong> ${doc.name ?? 'N/A'}</p>
          <p><strong>Court:</strong> ${doc.court ?? 'N/A'}</p>
          <p><strong>Motion Type:</strong> ${doc.motionType ?? 'N/A'}</p>
          <p><strong>Case Number:</strong> ${doc.caseNumber ?? 'N/A'}</p>
          <p><strong>Claimants:</strong> ${doc.claimants ?? 'N/A'}</p>
          <p><strong>Respondents:</strong> ${doc.respondents ?? 'N/A'}</p>
          <hr />
          <pre>${doc.content ?? ''}</pre>
        </body>
      </html>
    `);
    w?.document.close();
    w?.print();
  };

  // ---- guard returns (keep only these two before the main return) ----
  if (loading) return <div className="text-white text-center mt-20">Loading document...</div>;
  if (!doc) return <div className="text-red-500 text-center mt-20">Document not found.</div>;

  // ---- main render ----
  return (
    <div className="min-h-screen bg-black text-white px-6 py-24 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{doc.title}</h1>
        <div className="flex gap-4">
          <button
            onClick={handleDownloadPDF}
            className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 text-sm"
          >
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
          >
            Print
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-6">Type: {doc.type}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
        <p><strong>Name:</strong> {doc.name ?? 'N/A'}</p>
        <p><strong>Court:</strong> {doc.court ?? 'N/A'}</p>
        <p><strong>Motion Type:</strong> {doc.motionType ?? 'N/A'}</p>
        <p><strong>Case Number:</strong> {doc.caseNumber ?? 'N/A'}</p>
        <p><strong>Claimants:</strong> {doc.claimants ?? 'N/A'}</p>
        <p><strong>Respondents:</strong> {doc.respondents ?? 'N/A'}</p>
      </div>

      <div className="bg-gray-800 p-4 rounded shadow text-sm whitespace-pre-wrap">
        {doc.content || 'No content available.'}
      </div>
    </div>
  );
};

export default ViewDocument;
