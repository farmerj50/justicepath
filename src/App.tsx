import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CaseTypeSelection from './pages/CaseTypeSelection';
import DocumentBuilder from './pages/DocumentBuilder';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Pricing from './pages/Pricing';
import PremiumUpload from './pages/PremiumUpload'; // ✅ import the premium upload page
import ProtectedRoute from './components/RoleProtectedRouteProps';


const App: React.FC = () => {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<CaseTypeSelection />} />

        <Route
          path="/document-builder/:caseType"
          element={
            <ProtectedRoute>
              <DocumentBuilder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedTiers={['free', 'plus', 'pro']}>
              <PremiumUpload />
            </ProtectedRoute>
          }
        />

        <Route path="/document-builder" element={<p>Please select a case type from the homepage.</p>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </>
  );
};

export default App;
