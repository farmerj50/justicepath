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
    // If parent provided an uploader, use it so it can set preview/refresh.
    if (onFileUpload) {
      await onFileUpload(file);   // ⬅️ this will set previewFile, refresh list, etc.
      onClose();
      return;                     // ⬅️ IMPORTANT: do not also do internal upload
    }

    // Fallback: do internal upload w/ refresh-and-retry
    const API_URL = import.meta.env.VITE_API_URL;

    const uploadWithRefresh = async (formData: FormData) => {
      const tryUpload = () => {
        const token = localStorage.getItem('justicepath-token') || '';
        return fetch(`${API_URL}/api/documents/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData, // do NOT set Content-Type manually
        });
      };

      let res = await tryUpload();

      if (res.status === 401) {
        const r = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // send jp_rt cookie
        });
        if (r.ok) {
          const { token } = await r.json();
          if (token) localStorage.setItem('justicepath-token', token);
          res = await tryUpload();
        }
      }
      return res;
    };

    const fd = new FormData();
    fd.append('file', file);

    const res = await uploadWithRefresh(fd);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Upload failed: ${res.status} ${res.statusText}`);
    }

    onClose(); // internal path: just close; dashboard won't auto-preview
  } catch (err: any) {
    setError(err?.message || 'Upload failed');
  } finally {
    setIsUploading(false);
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
