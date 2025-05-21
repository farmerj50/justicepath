import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CaseTypeCard from '../components/CaseTypeCard';

const icons = {
  'Eviction': '📄',
  'Small Claims': '⚖️',
  'Family Law': '👨‍👩‍👧‍👦'
};

const CaseTypeSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSelect = (type: string) => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    if (selectedType) {
      navigate(`/document-builder/${encodeURIComponent(selectedType)}`);
    }
  };

  return (
    <div className="container">
      <header>
        <h1 className="title-heading">
          ⚖️ <span>JusticePath</span>
        </h1>
        <p className="subtitle-text">Select the type of legal issue you're dealing with:</p>
      </header>
      <section className="card-container">
        {Object.entries(icons).map(([label, icon]) => (
          <CaseTypeCard
            key={label}
            title={label}
            icon={icon}
            onClick={() => handleSelect(label)}
            selected={selectedType === label}
          />
        ))}
      </section>
      <button
        className="continue-button"
        onClick={handleContinue}
        disabled={!selectedType}
      >
        {selectedType ? `Continue with ${selectedType}` : 'Continue'}
      </button>
    </div>
  );
};

export default CaseTypeSelection;
