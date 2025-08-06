// src/pages/ResetPassword.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('justicepath-auth');

    if (!token) {
      setMessage('❌ You are not logged in. Please log in and try again.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // 🔐 Include token
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Password updated successfully.');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMessage(data.error || '❌ Failed to update password.');
      }
    } catch (error) {
      console.error('Reset error:', error);
      setMessage('❌ An error occurred.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-yellow-400">
          Reset Password
        </h2>

        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="w-full px-4 py-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full px-4 py-2 mb-6 border rounded dark:bg-gray-700 dark:text-white"
        />

        <button
          type="submit"
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-2 rounded font-bold transition"
        >
          Update Password
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-red-500 dark:text-yellow-400">
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default ResetPassword;
