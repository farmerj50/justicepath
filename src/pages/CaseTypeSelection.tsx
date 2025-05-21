import React from 'react';
import { useNavigate } from 'react-router-dom';
import CaseTypeCard from '../components/CaseTypeCard';

// Replace with your real icons later
const evictionIcon = '📄';
const smallClaimsIcon = '⚖️';
const familyLawIcon = '👨‍👩‍👧‍👦';

const CaseTypeSelection: React.FC = () => {
  const navigate = useNavigate();

  const handleSelect = (type: string) => {
  console.log(`Case Type Selected: ${type}`);
  navigate(`/document-builder/${encodeURIComponent(type)}`);
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
        <CaseTypeCard title="Eviction" icon={evictionIcon} onClick={() => handleSelect('Eviction')} />
        <CaseTypeCard title="Small Claims" icon={smallClaimsIcon} onClick={() => handleSelect('Small Claims')} />
        <CaseTypeCard title="Family Law" icon={familyLawIcon} onClick={() => handleSelect('Family Law')} />
      </section>
      <button className="continue-button" onClick={() => navigate('/document-builder')}>
        Continue
      </button>
    </div>
  );
};

export default CaseTypeSelection;
