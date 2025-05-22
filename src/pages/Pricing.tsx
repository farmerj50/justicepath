import React from 'react';
import Navbar from '../components/Navbar'; // ✅ Make sure this is imported

const planCard = (name: string, desc: string, price: string) => (
  <div style={{
    backgroundColor: '#1f2937',
    borderRadius: '1rem',
    padding: '1.5rem',
    width: '250px',
    color: '#fff',
    boxShadow: '0 0 10px rgba(0,0,0,0.3)',
    textAlign: 'center'
  }}>
    <h3 style={{ fontSize: '1.5rem' }}>{name}</h3>
    <p style={{ margin: '1rem 0' }}>{desc}</p>
    <strong>{price}</strong>
    <button style={{
      marginTop: '1rem',
      padding: '0.5rem 1rem',
      borderRadius: '999px',
      backgroundColor: '#4f46e5',
      color: '#fff'
    }}>
      Select
    </button>
  </div>
);

const Pricing = () => (
  <>
    <Navbar /> {/* ✅ Inserted at the top */}
    <div style={{
      backgroundColor: '#000',
      minHeight: '100vh',
      padding: '4rem 2rem',
      color: '#fff',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2rem' }}>Choose a Plan</h1>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        marginTop: '2rem',
        flexWrap: 'wrap'
      }}>
        {planCard("Free", "Basic AI document prep", "$0")}
        {planCard("Plus", "Includes file upload", "$15/mo")}
        {planCard("Pro", "Live trial prep & voice-to-text", "$49/mo")}
      </div>
    </div>
  </>
);

export default Pricing;
