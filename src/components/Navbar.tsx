// Navbar.tsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Settings, Menu, X } from 'lucide-react'; // ⬅ add Menu/X

const Navbar = () => {
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // ⬅ mobile state

  const caseDropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('justicepath-user');
    localStorage.removeItem('justicepath-token');
    navigate('/login');
  };

  const handleDocumentsClick = () => {
    if (location.pathname === '/documents') {
      window.dispatchEvent(new Event('show-documents-list'));
    } else {
      navigate('/documents');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (caseDropdownRef.current && !caseDropdownRef.current.contains(event.target as Node)) {
        setCaseDropdownOpen(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setSettingsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900 text-white z-50 border-b border-gray-800">
      <div className="mx-auto max-w-screen-xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-yellow-400 whitespace-nowrap">
          ⚖️ JusticePath
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="hover:text-yellow-400 transition whitespace-nowrap">Home</Link>

          {/* Start a Case (desktop dropdown) */}
          <div className="relative" ref={caseDropdownRef}>
            <button
              onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}
              className="hover:text-yellow-400 transition flex items-center gap-1 whitespace-nowrap"
            >
              Start a Case
              <svg className={`w-4 h-4 transform transition duration-200 ${caseDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {caseDropdownOpen && (
              <div className="absolute right-0 mt-2 bg-gray-800 text-white rounded shadow-lg w-48 z-50">
                <Link to="/case-type-selection" className="block px-4 py-2 hover:bg-yellow-500 hover:text-black transition">All Case Types</Link>
                <Link to="/document-builder/Eviction" className="block px-4 py-2 hover:bg-yellow-500 hover:text-black transition">Eviction</Link>
                <Link to="/document-builder/Small Claims" className="block px-4 py-2 hover:bg-yellow-500 hover:text-black transition">Small Claims</Link>
                <Link to="/document-builder/Family Law" className="block px-4 py-2 hover:bg-yellow-500 hover:text-black transition">Family Law</Link>
              </div>
            )}
          </div>

          <button onClick={handleDocumentsClick} className="hover:text-yellow-400 transition whitespace-nowrap">My Documents</button>
          <Link to="/pricing" className="hover:text-yellow-400 transition whitespace-nowrap">Pricing</Link>
          {user?.role === 'ADMIN' && <Link to="/admin-dashboard" className="hover:text-yellow-400 transition whitespace-nowrap">Admin</Link>}
          <Link to="/login" className="hover:text-yellow-400 transition whitespace-nowrap">Login</Link>
          <Link to="/signup" className="hover:text-yellow-400 transition whitespace-nowrap">Sign Up</Link>

          {/* Settings (desktop) */}
          <div className="relative pr-2" ref={settingsDropdownRef}>
            <button
              onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
              className="hover:text-yellow-400 transition p-2 rounded-full flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
            {settingsDropdownOpen && (
              <div className="absolute right-0 mt-2 bg-gray-800 text-white rounded shadow-lg w-40 z-50">
                <button onClick={() => { setSettingsDropdownOpen(false); navigate('/reset-password'); }} className="block w-full text-left px-4 py-2 hover:bg-yellow-500 hover:text-black transition">Reset Password</button>
                <button onClick={() => { setSettingsDropdownOpen(false); handleLogout(); }} className="block w-full text-left px-4 py-2 hover:bg-yellow-500 hover:text-black transition">Logout</button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="md:hidden p-2 text-slate-200"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-3 space-y-2">
          <Link to="/" className="block py-2" onClick={() => setMobileOpen(false)}>Home</Link>

          {/* Start a Case (mobile sublist) */}
          <details className="group">
            <summary className="list-none flex items-center justify-between py-2 cursor-pointer">
              <span>Start a Case</span>
              <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </summary>
            <div className="pl-4 space-y-1">
              <Link to="/case-type-selection" className="block py-1" onClick={() => setMobileOpen(false)}>All Case Types</Link>
              <Link to="/document-builder/Eviction" className="block py-1" onClick={() => setMobileOpen(false)}>Eviction</Link>
              <Link to="/document-builder/Small Claims" className="block py-1" onClick={() => setMobileOpen(false)}>Small Claims</Link>
              <Link to="/document-builder/Family Law" className="block py-1" onClick={() => setMobileOpen(false)}>Family Law</Link>
            </div>
          </details>

          <button onClick={() => { setMobileOpen(false); handleDocumentsClick(); }} className="block w-full text-left py-2">My Documents</button>
          <Link to="/pricing" className="block py-2" onClick={() => setMobileOpen(false)}>Pricing</Link>
          {user?.role === 'ADMIN' && <Link to="/admin-dashboard" className="block py-2" onClick={() => setMobileOpen(false)}>Admin</Link>}
          <Link to="/login" className="block py-2" onClick={() => setMobileOpen(false)}>Login</Link>
          <Link to="/signup" className="block py-2" onClick={() => setMobileOpen(false)}>Sign Up</Link>

          {/* Settings (mobile) */}
          <div className="pt-2 border-t border-gray-800">
            <button onClick={() => { setMobileOpen(false); navigate('/reset-password'); }} className="block w-full text-left py-2">Reset Password</button>
            <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="block w-full text-left py-2">Logout</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
