import React, { useState } from 'react';

const PremiumUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0] || null;
    setFile(uploaded);
    setMessage('');
  };

  const handleUpload = () => {
    if (!file) {
      setMessage('Please select a file.');
      return;
    }
    // Simulate upload
    setTimeout(() => {
      setMessage(`✅ ${file.name} uploaded successfully.`);
    }, 1000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#111827', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <h1>Premium Upload</h1>
        <p style={{ color: '#aaa', marginBottom: '1rem' }}>Upload documents for advanced AI processing.</p>

        <input
          type="file"
          onChange={handleFileChange}
          style={{ marginBottom: '1rem', backgroundColor: '#1f1f1f', color: '#fff' }}
        />

        <div>
          <button
            onClick={handleUpload}
            style={{
              background: 'linear-gradient(to right, #4f46e5, #6366f1)',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '1rem'
            }}
          >
            Upload
          </button>
        </div>

        {message && <p style={{ marginTop: '1rem', color: 'lightgreen' }}>{message}</p>}
      </div>
    </div>
  );
};

export default PremiumUpload;
