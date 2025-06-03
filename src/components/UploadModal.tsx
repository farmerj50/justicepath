import React from 'react';

interface UploadModalProps {
  onClose: () => void;
  onFileUpload: (file: File) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onFileUpload }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] text-white p-6 rounded-lg shadow-lg relative w-full max-w-md">
        <button
          className="absolute top-2 right-3 text-gray-300 hover:text-red-400 text-lg"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl text-yellow-400 font-semibold mb-4">Upload a Document</h2>
        <p className="text-sm mb-2 text-gray-400">Accepted: PDF, DOC, DOCX</p>
        <input type="file" onChange={handleChange} className="w-full" />
      </div>
    </div>
  );
};

export default UploadModal;
