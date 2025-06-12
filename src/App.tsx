import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import CaseTypeSelection from './pages/CaseTypeSelection';
import DocumentBuilder from './pages/DocumentBuilder';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Pricing from './pages/Pricing';
import PremiumUpload from './pages/PremiumUpload'; // ✅ import the premium upload page
import ProtectedRoute from './components/ProtectedRoute';
import SelectPlan from './pages/SelectPlan';
import PlanDetails from './pages/PlanDetails';
import LandingPage from './pages/LandingPage';
import ViewDocument from './pages/ViewDocument';
import DocumentsDashboard from './pages/DocumentDashboard';
import AdminDashboard from './pages/AdminDashboard';




const App: React.FC = () => {
  return (
    <>
      <Navbar />

      <Routes>
         <Route path="/" element={<LandingPage />} />

         <Route path="/case-type-selection" element={<CaseTypeSelection />} />

  <Route
    path="/document-builder/:caseType"
    element={
      <ProtectedRoute>
        <DocumentBuilder />
      </ProtectedRoute>
    }
  />
  <Route
  path="/documents"
  element={
    <ProtectedRoute>
      <DocumentsDashboard />
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

  <Route path="/select-plan" element={<SelectPlan />} />


  <Route path="/document-builder" element={<p>Please select a case type from the homepage.</p>} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/pricing" element={<Pricing />} />
  <Route path="/plan-details" element={<PlanDetails />} />
  <Route path="/documents/:id/view" element={<ViewDocument />} />
  <Route path="/admin-dashboard" element={<AdminDashboard />} />


</Routes>

    </>
  );
};

export default App;