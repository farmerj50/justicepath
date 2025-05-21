import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import openai from '../utils/openaiClient';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt } from 'react-icons/fa';

const DocumentBuilder: React.FC = () => {
  const { caseType } = useParams<{ caseType: string }>();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [reason, setReason] = useState('');
  const [income, setIncome] = useState('');
  const [receivedNotice, setReceivedNotice] = useState<boolean | null>(null);
  const [noticeDate, setNoticeDate] = useState('');
  const [noticeDateObject, setNoticeDateObject] = useState<Date | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiSuggestedFollowUp, setAiSuggestedFollowUp] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [followUpHistory, setFollowUpHistory] = useState<string[]>([]);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const generatePrompt = (includeFollowUp = false) => {
    const base = `
You are a legal assistant. A user has filled out the following information:

Case Type: ${caseType}
Name: ${fullName}
Monthly Income: ${income}
Reason: ${reason}
${includeFollowUp ? `\nFollow-up question: ${followUp}` : ''}
`;

    const evictionAddendum = `
Received Notice: ${receivedNotice ? 'Yes' : 'No'}
Notice Date: ${noticeDate}
`;

    const promptIntro = {
      Eviction: `This user is facing a possible eviction. Provide clear legal next steps for someone in this situation.`,
      'Small Claims': `This user is pursuing a small claims case. Provide a list of realistic actions they can take to proceed.`,
      'Family Law': `This user is dealing with a family law issue. Offer appropriate steps based on the context (e.g., divorce, custody, support).`,
    };

    return `${base}${caseType === 'Eviction' ? evictionAddendum : ''}

${promptIntro[caseType as keyof typeof promptIntro] ?? ''}

Respond in a helpful tone. Avoid suggesting legal counsel as the only solution. End with one helpful follow-up question they might want to ask.`;
  };

  const formatResponse = (text: string) =>
    text.replace(/(\d+)\.\s*/g, (_, n) => `\n\n${n}. `).trim();

  const submitToAI = async () => {
    const prompt = generatePrompt();
    try {
      const response = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
      });
      const content = response.choices[0].message.content || '';
      const [main, suggestion] = content.split(/Suggested follow-up:/i);
      setAiResponse(main.trim());
      setAiSuggestedFollowUp(suggestion?.trim() || '');
      setFollowUpHistory([formatResponse(main.trim())]);
    } catch (err) {
      alert('There was an error generating the summary.');
    }
  };

  const askFollowUp = async () => {
    const prompt = generatePrompt(true);
    try {
      const response = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
      });
      const content = response.choices[0].message.content || 'No response.';
      setFollowUpHistory((prev) => [...prev, `User: ${followUp}`, `AI: ${formatResponse(content)}`]);
      setFollowUp('');
    } catch (err) {
      alert('There was an error with your follow-up.');
    }
  };

  const MotionButton = motion.button;

  const inputStyle = {
    width: '60%',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    borderRadius: '999px',
    border: '1px solid #888',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    fontSize: '1rem',
    color: '#fff',
    backgroundColor: '#1f1f1f',
    minHeight: '48px',
  };

  const buttonStyle = {
    padding: '0.5rem 1.5rem',
    borderRadius: '999px',
    background: 'linear-gradient(to right, #4f46e5, #6366f1)',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
    cursor: 'pointer',
  };

  const stepTitleMap: Record<number, string> = {
    1: 'Eviction Notice',
    2: 'Date of Notice',
    3: 'Your Full Name',
    4: 'Monthly Income',
    5: 'Your Situation',
    6: 'Review & Submit',
  };

  const stepContent = () => {
    return (
      <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>{stepTitleMap[step]}</h2>
        <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>Step {step} of 6</p>
        {/* Insert your existing step logic here */}
      </motion.div>
    );
  };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#111827', padding: '2rem', borderRadius: '1rem', maxWidth: '500px', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>{caseType} Form</h1>
        <AnimatePresence mode="wait">
          <div aria-live="polite">
            {stepContent()}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DocumentBuilder;
