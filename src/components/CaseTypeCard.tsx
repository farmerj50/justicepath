interface Props {
  title: string;
  icon: string;
  description: string;
  onClick: () => void;
  selected?: boolean;
}

const CaseTypeCard: React.FC<Props> = ({ title, icon, description, onClick, selected }) => {
  return (
    <div
      className={`case-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      aria-pressed={selected}
      style={{
        width: '240px',
        minHeight: '150px',
        padding: '1rem',
        textAlign: 'center',
        backgroundColor: '#1e1e1e',
        border: selected ? '2px solid #6366f1' : '1px solid #444',
        borderRadius: '12px',
        boxShadow: selected ? '0 0 10px #6366f1' : '0 0 5px #000',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
      }}
    >
      <div className="emoji-icon" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <strong>{title}</strong>
      <p className="card-description" style={{ marginTop: '0.5rem', color: '#ccc', fontSize: '0.85rem' }}>
        {description}
      </p>
    </div>
  );
};

export default CaseTypeCard;
