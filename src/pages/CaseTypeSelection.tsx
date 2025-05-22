import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CaseTypeCard from '../components/CaseTypeCard';
import Navbar from '../components/Navbar'; // ✅ Import Navbar

const caseOptions = {
  'Eviction': {
    icon: '📄',
    description: 'For tenants facing eviction or landlords filing notices.'
  },
  'Small Claims': {
    icon: '⚖️',
    description: 'Resolve disputes involving money, property, or damages.'
  },
  'Family Law': {
    icon: '👨‍👩‍👧‍👦',
    description: 'Divorce, custody, child support, or spousal support.'
  }
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
    <>
      <Navbar /> {/* ✅ Render Navbar here */}

      <div className="container">
        <header>
          <h1 className="title-heading">
            ⚖️ <span>JusticePath</span>
          </h1>
          <p className="subtitle-text">Select the type of legal issue you're dealing with:</p>
          <p className="header-help">This helps us determine the right forms for your case.</p>
        </header>

        <section className="card-container">
          {Object.entries(caseOptions).map(([label, { icon, description }]) => (
            <CaseTypeCard
              key={label}
              title={label}
              icon={icon}
              description={description}
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
    </>
  );
};

export default CaseTypeSelection;
