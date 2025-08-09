import React, { useState } from 'react';

interface UploadModalProps {
  onClose: () => void;
  onFileUpload?: (file: File) => Promise<void>; // optional now
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onFileUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Optional callback for parent-side behavior
      if (onFileUpload) {
        await onFileUpload(file);
      }

      // Direct upload to backend
      const fd = new FormData();
      fd.append('file', file); // must match upload.single('file') on backend

      const token = localStorage.getItem('justicepath-token'); // adjust if stored differently

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/documents/upload`, {
        method: 'POST',
        body: fd, // DO NOT set Content-Type; the browser handles it
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Upload failed: ${res.status} ${res.statusText}`);
      }

      // Optionally consume response
      // const data = await res.json();
      // console.log('Uploaded:', data);

      onClose(); // close modal on success
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      // reset input so selecting the same file again re-triggers change
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-lg w-full max-w-md text-white relative">
        <button
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-2 right-3 text-gray-300 hover:text-red-400 text-lg font-bold disabled:opacity-50"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4 text-yellow-400">Upload a Document</h2>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          disabled={isUploading}
          className="w-full border border-gray-600 p-2 bg-black rounded disabled:opacity-50"
        />

        <p className="text-gray-400 text-xs mt-2">Accepted: PDF, DOC, DOCX</p>

        {isUploading && (
          <p className="text-sm mt-3">Uploading… don’t close this window.</p>
        )}
        {error && (
          <p className="text-sm mt-3 text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
