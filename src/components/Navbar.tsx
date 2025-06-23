import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // ✅




const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme(); // ✅

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
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

  {/* Dropdown */}
  <div className="relative" ref={dropdownRef}>
    <button
      onClick={() => setDropdownOpen(!dropdownOpen)}
      className="hover:text-yellow-400 transition flex items-center gap-1"
    >
      Start a Case
      <svg
        className={`w-4 h-4 transform transition duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
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

    {dropdownOpen && (
      <div className="absolute right-0 mt-2 bg-gray-800 text-white rounded shadow-lg w-48 z-50">
        <Link to="/case-type-selection" className="block px-4 py-2 hover:bg-yellow-500 hover:text-black transition">
          All Case Types
        </Link>
        <Link to="/document-builder/Eviction" className="block px-4 py-2 hover:bg-yellow-500 hover:text-black transition">
          Eviction
        </Link>
        <Link to="/document-builder/Small Claims" className="block px-4 py-2 hover:bg-yellow-500 hover:text-black transition">
          Small Claims
        </Link>
        <Link to="/document-builder/Family Law" className="block px-4 py-2 hover:bg-yellow-500 hover:text-black transition">
          Family Law
        </Link>
      </div>
    )}
  </div>

  <Link to="/documents" className="hover:text-yellow-400 transition">My Documents</Link>
  <Link to="/pricing" className="hover:text-yellow-400 transition">Pricing</Link>

  {user?.role === 'ADMIN' && (
    <Link to="/admin-dashboard" className="hover:text-yellow-400 transition">Admin</Link>
  )}
  <Link to="/login" className="hover:text-yellow-400 transition">Login</Link>
  <Link to="/signup" className="hover:text-yellow-400 transition">Sign Up</Link>

  {/* 🌗 Theme Toggle */}
  <button
    onClick={() => toggleDarkMode()}
    className="ml-2 px-3 py-1 rounded bg-indigo-600 dark:bg-yellow-400 text-white dark:text-black text-sm transition"
  >
    {darkMode ? '☀ Light' : '🌙 Dark'}
  </button>
</div>

    </nav>
  );
};

export default Navbar;
