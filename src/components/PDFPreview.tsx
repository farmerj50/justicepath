import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFPreviewProps {
  fileUrl: string;
  previewMode?: boolean;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ fileUrl, previewMode = false }) => {
  const [pages, setPages] = useState<string[]>([]);

  useEffect(() => {
    const loadPdf = async () => {
      const pdf = await pdfjsLib.getDocument(fileUrl).promise;
      const pageImages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: previewMode ? 0.4 : 1.5 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport }).promise;
        pageImages.push(canvas.toDataURL());
      }

      setPages(pageImages);
    };

    loadPdf();
  }, [fileUrl, previewMode]);

  return (
    <div
      className={`flex ${previewMode ? 'flex-col gap-4' : 'flex-col items-center'} w-full overflow-y-auto`}
    >
      {pages.map((src, index) => (
        <div
          key={index}
          className={`bg-gray-800 rounded border border-gray-700 shadow ${
            previewMode ? 'w-full max-h-[350px] overflow-hidden' : 'w-auto mb-6'
          }`}
        >
          <img
            src={src}
            alt={`Page ${index + 1}`}
            className="w-full object-contain"
            style={previewMode ? { maxHeight: '320px' } : undefined}
          />
        </div>
      ))}
    </div>
  );
};

export default PDFPreview;
