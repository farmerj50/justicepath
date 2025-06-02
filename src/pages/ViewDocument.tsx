import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const ViewDocument = () => {
  const { id } = useParams();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await fetch(`/api/documents/${id}`);
        if (res.status === 403) throw new Error('Unauthorized');
        const data = await res.json();
        setDocument(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load document:', err);
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleDownloadPDF = () => {
    const blob = new Blob([document.content], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${document.title || 'document'}.pdf`;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <head><title>${document.title}</title></head>
        <body style="white-space: pre-wrap; font-family: sans-serif; padding: 2rem;">
          <h1>${document.title}</h1>
          <p><strong>Type:</strong> ${document.type}</p>
          <p><strong>Name:</strong> ${document.name || 'N/A'}</p>
          <p><strong>Court:</strong> ${document.court || 'N/A'}</p>
          <p><strong>Motion Type:</strong> ${document.motionType || 'N/A'}</p>
          <p><strong>Case Number:</strong> ${document.caseNumber || 'N/A'}</p>
          <p><strong>Claimants:</strong> ${document.claimants || 'N/A'}</p>
          <p><strong>Respondents:</strong> ${document.respondents || 'N/A'}</p>
          <hr />
          <pre>${document.content || ''}</pre>
        </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

  if (loading) {
    return <div className="text-white text-center mt-20">Loading document...</div>;
  }

  if (!document) {
    return <div className="text-red-500 text-center mt-20">Document not found.</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-24 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{document.title}</h1>
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

      <p className="text-sm text-gray-400 mb-6">Type: {document.type}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
        <p><strong>Name:</strong> {document.name || 'N/A'}</p>
        <p><strong>Court:</strong> {document.court || 'N/A'}</p>
        <p><strong>Motion Type:</strong> {document.motionType || 'N/A'}</p>
        <p><strong>Case Number:</strong> {document.caseNumber || 'N/A'}</p>
        <p><strong>Claimants:</strong> {document.claimants || 'N/A'}</p>
        <p><strong>Respondents:</strong> {document.respondents || 'N/A'}</p>
      </div>

      <div className="bg-gray-800 p-4 rounded shadow text-sm whitespace-pre-wrap">
        {document.content || 'No content available.'}
      </div>
    </div>
  );
};

export default ViewDocument;
