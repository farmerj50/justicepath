import React, { useState } from 'react';
import Navbar from '../components/Navbar';

const PremiumUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessage('');
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setMessage('Please select a file to upload.');
      return;
    }

    // Placeholder upload logic (replace with backend integration)
    setTimeout(() => {
      setMessage(`✅ File "${selectedFile.name}" uploaded successfully.`);
    }, 1000);
  };

  return (
    <>
      <Navbar />
      <div style={{
        backgroundColor: '#000',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        color: '#fff'
      }}>
        <div style={{
          backgroundColor: '#1f2937',
          padding: '2rem',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📎 Upload a Document</h2>

          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            style={{ marginBottom: '1rem', display: 'block', color: '#fff' }}
          />

          <button
            onClick={handleUpload}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '999px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Upload
          </button>

          {message && (
            <p style={{ marginTop: '1rem', color: 'lightgreen' }}>{message}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default PremiumUpload;
