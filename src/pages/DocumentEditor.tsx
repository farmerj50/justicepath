import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAIChatResponse } from '../utils/chatAssistant';

const DocumentEditor = () => {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [content, setContent] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [fields, setFields] = useState({
    name: '',
    court: '',
    motionType: '',
    caseNumber: '',
    claimants: '',
    respondents: ''
  });

  useEffect(() => {
    if (id) {
      // Fetch existing document data by ID
      fetch(`/api/documents/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setTitle(data.title);
          setType(data.type);
          setContent(data.content);
          setFields({
            name: data.name || '',
            court: data.court || '',
            motionType: data.motionType || '',
            caseNumber: data.caseNumber || '',
            claimants: data.claimants || '',
            respondents: data.respondents || '',
          });
        });
    }
  }, [id]);

  const handleAIImprove = async () => {
    const response = await getAIChatResponse(
      `Suggest improvements for this legal document:\n\n${content}`
    );
    setAiSuggestion(response);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-24 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Document</h1>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Document Title"
          className="bg-gray-800 text-white rounded px-4 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-gray-800 text-white rounded px-4 py-2"
        >
          <option value="">Select Type</option>
          <option>Eviction</option>
          <option>Small Claims</option>
          <option>Family Law</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(fields).map(([key, value]) => (
          <input
            key={key}
            type="text"
            placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
            className="bg-gray-800 text-white rounded px-4 py-2"
            value={value}
            onChange={(e) =>
              setFields((prev) => ({ ...prev, [key]: e.target.value }))
            }
          />
        ))}
      </div>

      <textarea
        className="w-full h-64 bg-gray-800 text-white rounded px-4 py-2 mb-4"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter your legal document content here..."
      />

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleAIImprove}
          className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
        >
          Analyze & Suggest Improvements
        </button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Save Document
        </button>
      </div>

      {aiSuggestion && (
        <div className="bg-gray-800 rounded p-4 text-sm text-gray-300">
          <h2 className="font-semibold text-yellow-400 mb-2">AI Suggestions:</h2>
          <p>{aiSuggestion}</p>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;