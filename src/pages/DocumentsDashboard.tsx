import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Document {
  id: string;
  title: string;
  type: string;
  createdAt: string;
}

const DocumentsDashboard = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    // Replace with actual fetch call to your backend
    const fetchDocuments = async () => {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
    };
    fetchDocuments();
  }, []);

  const filteredDocs =
    filter === 'All' ? documents : documents.filter((doc) => doc.type === filter);

  return (
    <div className="min-h-screen bg-black text-white px-6 py-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Documents</h1>
        <Link
          to="/documents/new"
          className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
        >
          + New Document
        </Link>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-300 mr-2">Filter by type:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1"
        >
          <option>All</option>
          <option>Eviction</option>
          <option>Small Claims</option>
          <option>Family Law</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-yellow-400 mb-1">{doc.title}</h3>
            <p className="text-sm text-gray-400">Type: {doc.type}</p>
            <p className="text-sm text-gray-500">Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</p>
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
    </div>
  );
};

export default DocumentsDashboard;
