import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFPreviewProps {
  fileUrl: string;
  previewMode?: boolean;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ fileUrl, previewMode = false }) => {
  const [pages, setPages] = useState<string[]>([]);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        const images: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: previewMode ? 0.3 : 1 });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context!, viewport }).promise;
          images.push(canvas.toDataURL());
        }

        setPages(images);
      } catch (err) {
        console.error('PDF preview error:', err);
      }
    };

    loadPdf();
  }, [fileUrl, previewMode]);

  return (
    <div className="w-full max-h-[400px] overflow-y-auto flex flex-col gap-3 pr-1">
      {pages.map((src, index) => (
        <div
          key={index}
          className="bg-gray-900 rounded border border-gray-700 shadow w-full p-1 hover:ring hover:ring-yellow-400 transition"
        >
          <img
            src={src}
            alt={`Page ${index + 1}`}
            className="w-full h-auto rounded object-contain"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
};

export default PDFPreview;
