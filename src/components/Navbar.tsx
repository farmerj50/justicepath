import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);

  const caseDropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const handleLogout = () => {
  localStorage.removeItem('justicepath-user');
  localStorage.removeItem('justicepath-token');
  navigate('/login');
};

  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDocumentsClick = () => {
    if (location.pathname === '/documents') {
      window.dispatchEvent(new Event('show-documents-list'));
    } else {
      navigate('/documents');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        caseDropdownRef.current &&
        !caseDropdownRef.current.contains(event.target as Node)
      ) {
        setCaseDropdownOpen(false);
      }
      if (
        settingsDropdownRef.current &&
        !settingsDropdownRef.current.contains(event.target as Node)
      ) {
        setSettingsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900 text-white px-6 py-4 z-50 shadow-lg flex justify-between items-center">
      <div className="flex items-center gap-2 text-xl font-bold text-yellow-400">
        ⚖️ JusticePath
      </div>

      <div className="flex items-center gap-6">
        <Link to="/" className="hover:text-yellow-400 transition">Home</Link>

        {/* Start a Case Dropdown */}
        <div className="relative" ref={caseDropdownRef}>
          <button
            onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}
            className="hover:text-yellow-400 transition flex items-center gap-1"
          >
            Start a Case
            <svg
              className={`w-4 h-4 transform transition duration-200 ${caseDropdownOpen ? 'rotate-180' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
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

        <button onClick={handleDocumentsClick} className="hover:text-yellow-400 transition">
          My Documents
        </button>

        <Link to="/pricing" className="hover:text-yellow-400 transition">Pricing</Link>

        {user?.role === 'ADMIN' && (
          <Link to="/admin-dashboard" className="hover:text-yellow-400 transition">Admin</Link>
        )}

        <Link to="/login" className="hover:text-yellow-400 transition">Login</Link>
        <Link to="/signup" className="hover:text-yellow-400 transition">Sign Up</Link>

        {/* Settings Dropdown */}
        <div className="relative pr-2" ref={settingsDropdownRef}>

          <button
            onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
            className="hover:text-yellow-400 transition"
            aria-label="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09A1.65 1.65 0 008 4.6V4a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.09a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09c.22.64.87 1.09 1.51 1.09H21a2 2 0 010 4h-.09c-.64 0-1.2.45-1.51 1z"
              />
            </svg>
          </button>

{settingsDropdownOpen && (
  <div className="absolute right-0 mt-2 bg-gray-800 text-white rounded shadow-lg w-40 z-50">
    <button
      onClick={() => {
        setSettingsDropdownOpen(false);
        navigate('/reset-password');
      }}
      className="block w-full text-left px-4 py-2 hover:bg-yellow-500 hover:text-black transition"
    >
      Reset Password
    </button>
    <button
      onClick={() => {
        setSettingsDropdownOpen(false);
        handleLogout();
      }}
      className="block w-full text-left px-4 py-2 hover:bg-yellow-500 hover:text-black transition"
    >
      Logout
    </button>
  </div>
)}
</div>


        {/* 🌗 Theme Toggle (commented out for now) */}
        {/*
        <button
          onClick={toggleDarkMode}
          className="ml-2 px-3 py-1 rounded bg-indigo-600 dark:bg-yellow-400 text-white dark:text-black text-sm transition"
        >
          {darkMode ? '☀ Light' : '🌙 Dark'}
        </button>
        */}
      </div>
    </nav>
  );
};

export default Navbar;
