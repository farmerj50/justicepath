import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

const PremiumUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Generate preview URL when file is selected
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewURL(url);

      return () => URL.revokeObjectURL(url);
    }
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file to upload.');
      return;
    }

    const userJson = localStorage.getItem('justicepath-user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?.id;

    if (!userId) {
      setMessage('User not logged in.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('userId', userId);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'Upload failed');
      }

      console.log('✅ Upload success:', result);
      setMessage(`✅ File "${selectedFile.name}" uploaded successfully.`);
    } catch (error) {
      console.error('❌ Upload error:', error);
      setMessage('Upload failed. Check console for details.');
    }
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
          maxWidth: '600px',
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
            <p style={{ marginTop: '1rem', color: message.startsWith('✅') ? 'lightgreen' : 'red' }}>
              {message}
            </p>
          )}

          {previewURL && selectedFile?.type === 'application/pdf' && (
            <iframe
              src={previewURL}
              title="PDF Preview"
              style={{
                width: '100%',
                height: '400px',
                marginTop: '1.5rem',
                border: '1px solid #444',
                borderRadius: '8px',
                backgroundColor: '#fff'
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default PremiumUpload;
