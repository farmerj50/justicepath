interface Props {
  title: string;
  icon: string;
  onClick: () => void;
  selected?: boolean;
  description?: string;
}

const CaseTypeCard: React.FC<Props> = ({ title, icon, onClick, selected, description }) => {
  return (
    <div
      className={`case-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      aria-pressed={selected}
    >
      <div className="emoji-icon">{icon}</div>
      <strong>{title}</strong>
      {description && (
  <p className="card-description">{description}</p>
)}


    </div>
  );
};

export default CaseTypeCard;
