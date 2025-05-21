interface Props {
  title: string;
  icon: string;
  onClick: () => void;
  selected?: boolean;
}

const CaseTypeCard: React.FC<Props> = ({ title, icon, onClick, selected }) => {
  return (
    <div
      className={`case-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      aria-pressed={selected}
    >
      <div className="emoji-icon">{icon}</div>
      <strong>{title}</strong>
    </div>
  );
};

export default CaseTypeCard;
