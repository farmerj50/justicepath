import { Routes, Route } from 'react-router-dom';
import CaseTypeSelection from './pages/CaseTypeSelection';
import DocumentBuilder from './pages/DocumentBuilder';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<CaseTypeSelection />} />
      <Route path="/document-builder/:caseType" element={<DocumentBuilder />} />
      <Route path="/document-builder" element={<p>Please select a case type from the homepage.</p>} />
    </Routes>
  );
};

export default App;
