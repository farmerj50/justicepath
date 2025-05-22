// src/components/Navbar.tsx
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#111827',
    color: '#fff',
    width: '100%',
    position: 'fixed',   // <-- Keeps it on top while scrolling
    top: 0,
    left: 0,
    zIndex: 1000
  }}
>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <h2 style={{ fontWeight: 600 }}>⚖️ JusticePath</h2>
  </div>
  <div style={{ display: 'flex', gap: '1.5rem' }}>
    <Link to="/" style={{ color: '#fff' }}>Home</Link>
    <Link to="/pricing" style={{ color: '#fff' }}>Pricing</Link>
    <Link to="/login" style={{ color: '#fff' }}>Login</Link>
    <Link to="/signup" style={{ color: '#fff' }}>Sign Up</Link>
  </div>
</nav>

  );
};

export default Navbar;
