// App.tsx
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CaseTypeSelection from './pages/CaseTypeSelection';
import DocumentBuilder from './pages/DocumentBuilder';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Pricing from './pages/Pricing';

const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<CaseTypeSelection />} />
        <Route path="/document-builder/:caseType" element={<DocumentBuilder />} />
        <Route path="/document-builder" element={<p>Please select a case type from the homepage.</p>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </>
  );
};

export default App;
