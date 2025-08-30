import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;
const PASSWORD_HINT =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.';

export default function ResetPassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('justicepath-token');

  const parseResponse = async (resp: Response) => {
    const text = await resp.text();
    try { return JSON.parse(text); } catch { return text; }
  };
  const errText = (raw: unknown) =>
    typeof raw === 'string' ? raw
    : (raw && typeof raw === 'object' && typeof (raw as any).error === 'string')
    ? (raw as any).error
    : (raw && typeof raw === 'object' && typeof (raw as any).message === 'string')
    ? (raw as any).message
    : 'Request failed.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setMessage('❌ You are not logged in.'); return; }
    if (!passwordRegex.test(newPassword)) { setMessage('❌ ' + PASSWORD_HINT); return; }
    if (newPassword !== confirm) { setMessage('❌ New password and confirmation do not match.'); return; }

    setBusy(true); setMessage('');
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await parseResponse(resp);

      if (resp.status === 401) {
        setMessage('❌ Session expired. Please log in again.');
        localStorage.removeItem('justicepath-token');
        localStorage.removeItem('justicepath-user');
        setTimeout(() => navigate('/login'), 1200);
        return;
      }
      if (!resp.ok) { setMessage('❌ ' + errText(data)); return; }

      setMessage('✅ Password updated. Please log in with your new password.');
      localStorage.removeItem('justicepath-token');
      localStorage.removeItem('justicepath-user');
      setTimeout(() => navigate('/login'), 1200);
    } catch (e) {
      console.error(e);
      setMessage('❌ Network or server error.');
    } finally {
      setBusy(false);
    }
  };

  const strong = passwordRegex.test(newPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-yellow-400">Reset Password</h2>

        <input type="password" placeholder="Current Password" value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)} required
          className="w-full px-4 py-2 mb-4 border rounded dark:bg-gray-700 dark:text-white" />

        <input type="password" placeholder="New Password" value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)} required
          className="w-full px-4 py-2 mb-2 border rounded dark:bg-gray-700 dark:text-white" />
        {newPassword && (
          <p className="text-xs mb-2 text-gray-600 dark:text-gray-300">
            {strong ? '✅ Meets requirements' : '⚠️ ' + PASSWORD_HINT}
          </p>
        )}

        <input type="password" placeholder="Confirm New Password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} required
          className="w-full px-4 py-2 mb-6 border rounded dark:bg-gray-700 dark:text-white" />

        <button
          type="submit"
          disabled={busy || !strong || newPassword !== confirm}
          className={`w-full ${busy || !strong || newPassword !== confirm ? 'opacity-60 cursor-not-allowed' : ''} bg-yellow-500 hover:bg-yellow-600 text-black py-2 rounded font-bold transition`}
        >
          {busy ? 'Updating…' : 'Update Password'}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-red-500 dark:text-yellow-400">{message}</p>
        )}
      </form>
    </div>
  );
}
