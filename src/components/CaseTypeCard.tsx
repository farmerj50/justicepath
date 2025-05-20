interface CaseTypeCardProps {
  title: string;
  icon: string;
  onClick: () => void;
}

const CaseTypeCard: React.FC<CaseTypeCardProps> = ({ title, icon, onClick }) => {
  return (
    <div className="case-card" onClick={onClick}>
      <span className="emoji-icon" style={{ fontSize: '2rem' }}>{icon}</span>
      <h3>{title}</h3>
    </div>
  );
};

export default CaseTypeCard;
