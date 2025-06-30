import React, { useState, useEffect } from 'react';

interface AutoFillAssistantProps {
  template: string;
  onComplete: (filledText: string) => void;
}

const questionMap: Record<string, string> = {
  "Your Name": "What is your full name?",
  "Your Address": "What is your current address?",
  "City, State, Zip Code": "What is your city, state, and zip code?",
  "Phone Number": "What is your phone number?",
  "Email Address": "What is your email address?",
  "Case Number": "Do you know your court case number?",
  "Landlord's Name": "What is your landlord’s name?",
  "Notice Date": "What is the date on the eviction notice?",
  "Current Date": "What is today’s date?",
  "Your Signature": "Enter your name to sign the document.",
};

const extractPlaceholders = (text: string): string[] => {
  const regex = /\[([^\]]+)\]/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
};

const fillTemplate = (template: string, values: Record<string, string>): string => {
  return template.replace(/\[([^\]]+)\]/g, (_, key) => values[key] || `[${key}]`);
};

const AutoFillAssistant: React.FC<AutoFillAssistantProps> = ({ template, onComplete }) => {
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [input, setInput] = useState('');

  useEffect(() => {
    const extracted = extractPlaceholders(template);
    setPlaceholders(extracted);
  }, [template]);

  const handleNext = () => {
    const currentField = placeholders[currentIndex];
    setResponses((prev) => ({ ...prev, [currentField]: input }));
    setInput('');
    if (currentIndex + 1 >= placeholders.length) {
      const filled = fillTemplate(template, { ...responses, [currentField]: input });
      onComplete(filled);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const currentField = placeholders[currentIndex];
  const question = questionMap[currentField] || `Please provide: ${currentField}`;

  return (
    <div className="bg-gray-800 text-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-8">
      <h2 className="text-lg font-bold mb-4 text-yellow-400">Help Us Complete Your Document</h2>
      <p className="mb-2">{question}</p>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-white mb-4"
      />
      <button
        onClick={handleNext}
        className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
      >
        {currentIndex + 1 === placeholders.length ? 'Finish' : 'Next'}
      </button>
    </div>
  );
};

export default AutoFillAssistant;
