import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAIChatResponse } from '../utils/chatAssistant';


const CaseSelection = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const handleChatSubmit = async () => {
  if (!chatInput.trim()) return;

  setChatHistory((prev) => [...prev, `🧑: ${chatInput}`]);
  setIsLoading(true);

  const aiReply = await getAIChatResponse(chatInput);
  setChatHistory((prev) => [...prev, `🤖: ${aiReply}`]);

  setChatInput('');
  setIsLoading(false);
};


  const caseOptions = [
    {
      id: 'Eviction',
      title: 'Eviction',
      description: 'For tenants facing eviction or landlords filing notices.',
      emoji: '📄',
    },
    {
      id: 'Small Claims',
      title: 'Small Claims',
      description: 'Resolve disputes involving money, property, or damages.',
      emoji: '⚖️',
    },
    {
      id: 'Family Law',
      title: 'Family Law',
      description: 'Divorce, custody, child support, or spousal support.',
      emoji: '👨‍👩‍👧',
    },
  ];

  const handleSelect = (caseType: string) => {
    setSelected(caseType);
  };

  const handleContinue = () => {
    if (selected) {
      navigate(`/document-builder/${selected}`);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
            ⚖️ JusticePath
          </h1>
          <p className="mt-4 text-lg font-medium">
            Select the type of legal issue you're dealing with:
          </p>
          <p className="mt-2 text-sm text-gray-400">
            This helps us determine the right forms for your case.
          </p>
        </div>

        <div className="w-full max-w-md space-y-6">
          {caseOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`w-full flex flex-col items-start p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                selected === option.id
                  ? 'bg-white text-black border-yellow-400 shadow-lg'
                  : 'bg-gray-900 border-gray-700 hover:border-yellow-400 hover:scale-[1.02]'
              }`}
            >
              <span className="text-3xl mb-2">{option.emoji}</span>
              <h2 className="text-xl font-semibold">{option.title}</h2>
              <p className="text-sm text-gray-400 mt-1">{option.description}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`mt-10 px-6 py-3 rounded-lg text-white font-semibold transition-colors duration-200 ${
            selected
              ? 'bg-yellow-500 hover:bg-yellow-600'
              : 'bg-gray-700 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>

      {/* AI Chat Assistant Floating Icon and Box */}
      <div className="fixed bottom-6 right-6 z-50">
        {showChat ? (
  <div className="bg-white text-black rounded-lg shadow-xl w-80 h-96 flex flex-col overflow-hidden">
    <div className="bg-yellow-500 p-4 font-semibold flex justify-between items-center">
      <span>AI Legal Assistant</span>
      <button
        onClick={() => setShowChat(false)}
        className="text-black hover:text-gray-800 text-xl"
      >
        ×
      </button>
    </div>
    <div className="flex-1 p-4 overflow-y-auto text-sm space-y-2 flex flex-col">
      {chatHistory.map((msg, idx) => (
        <div
  key={idx}
  className={`rounded px-3 py-2 ${
    msg.startsWith('🤖')
      ? 'bg-gray-100 text-gray-800 self-start'
      : 'bg-blue-600 text-white self-end'
  } max-w-[90%] whitespace-pre-wrap break-words`}
>
  {msg.replace(/^🤖: |^🧑: /, '')}
</div>

      ))}
      {isLoading && <p className="text-yellow-600 italic">Typing...</p>}
    </div>
    <div className="p-3 border-t flex gap-2">
      <input
        type="text"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
        placeholder="Type your question..."
        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
      />
      <button
        onClick={handleChatSubmit}
        className="px-3 py-2 text-sm bg-yellow-500 text-black rounded hover:bg-yellow-600"
      >
        Send
      </button>
    </div>
  </div>
) : (
  <button
    onClick={() => setShowChat(true)}
    className="bg-yellow-500 text-black p-3 rounded-full shadow-lg hover:scale-105 transition-all duration-200"
    aria-label="Open AI Chat"
  >
    💬
  </button>
)}

      </div>
    </>
  );
};

export default CaseSelection;
