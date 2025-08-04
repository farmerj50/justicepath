import React from 'react';

interface UploadModalProps {
  
  onClose: () => void;
  onFileUpload: (file: File) => Promise<void>;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onFileUpload }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onFileUpload(e.target.files[0]);
      onClose(); // close after upload
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-lg w-full max-w-md text-white relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-300 hover:text-red-400 text-lg font-bold"
        >
          ×
        </button>
        <h2 className="text-xl font-semibold mb-4 text-yellow-400">Upload a Document</h2>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="w-full border border-gray-600 p-2 bg-black rounded"
        />
        <p className="text-gray-400 text-xs mt-2">Accepted: PDF, DOC, DOCX</p>
      </div>
    </div>
  );
};

export default UploadModal;
