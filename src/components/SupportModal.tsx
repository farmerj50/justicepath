import React, { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  apiUrl: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

const SupportModal: React.FC<Props> = ({ open, onClose, apiUrl, userId, userEmail, userName }) => {
  const [name, setName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!subject.trim() || !message.trim()) return alert('Please add a subject and message.');
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, subject, message, userId }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        console.error('❌ support send failed:', data);
        alert(data?.error || 'Failed to send message.');
        return;
      }
      alert('Message sent. We’ll get back to you soon.');
      setSubject(''); setMessage('');
      onClose();
    } catch (e) {
      console.error('❌ support send error:', e);
      alert('Network error.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="w-full max-w-lg bg-gray-900 text-white border border-gray-700 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-yellow-400">Contact Support</h2>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>✕</button>
        </div>

        <div className="space-y-3">
          <input
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
            placeholder="Your name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
            placeholder="Your email (optional)"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
            placeholder="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
          <textarea
            className="w-full h-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
            placeholder="How can we help?"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
            onClick={submit}
            disabled={sending}
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
