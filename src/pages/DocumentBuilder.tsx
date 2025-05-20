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

  const generatePrompt = (includeFollowUp = false) => `
You are a legal assistant. A user has filled out the following case info:

Case Type: ${caseType}
Name: ${fullName}
Monthly Income: ${income}
${caseType === 'Eviction' ? `Received Notice: ${receivedNotice ? 'Yes' : 'No'}\nNotice Date: ${noticeDate}` : ''}
Reason: ${reason}
${includeFollowUp ? `\nFollow-up question: ${followUp}` : ''}

Please give practical next steps this person can take, and recommendations. Be detailed but avoid recommending legal counsel as the only step.
Also suggest one helpful follow-up question the user might want to ask next.
`;

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
      console.error('OpenAI Error:', err);
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
      setFollowUpHistory((prev) => [
        ...prev,
        `User: ${followUp}`,
        `AI: ${formatResponse(content)}`,
      ]);
      setFollowUp('');
    } catch (err) {
      console.error('Follow-up Error:', err);
      alert('There was an error with your follow-up.');
    }
  };

  const fadeVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
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
  };

  const buttonRowStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '1rem',
  };

  const Button = ({ onClick, children }: any) => (
    <button onClick={onClick} style={buttonStyle}>{children}</button>
  );

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div variants={fadeVariant} initial="hidden" animate="visible" exit="exit">
            <p>Have you received a notice of eviction?</p>
            <div style={buttonRowStyle}>
              <Button onClick={() => { setReceivedNotice(true); next(); }}>Yes</Button>
              <Button onClick={() => { setReceivedNotice(false); next(); }}>No</Button>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div variants={fadeVariant} initial="hidden" animate="visible" exit="exit">
            <label htmlFor="notice-date" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              What date did you receive the notice?
            </label>
            <div style={{ position: 'relative', display: 'inline-block', width: '60%' }}>
              <DatePicker
                id="notice-date"
                selected={noticeDateObject}
                onChange={(date: Date | null) => {
                  if (date) {
                    setNoticeDateObject(date);
                    setNoticeDate(date.toISOString().split('T')[0]);
                  }
                }}
                placeholderText="mm/dd/yyyy"
                dateFormat="yyyy-MM-dd"
                className="custom-datepicker-input"
                calendarClassName="custom-datepicker-calendar"
                aria-label="Notice date picker"
              />
              <FaCalendarAlt style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#fff',
                fontSize: '1.2rem',
                pointerEvents: 'none'
              }} />
            </div>
            <div style={buttonRowStyle}>
              <Button onClick={back}>Back</Button>
              <Button onClick={next}>Next</Button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div variants={fadeVariant} initial="hidden" animate="visible" exit="exit">
            <p>What is your full name?</p>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
            <div style={buttonRowStyle}>
              <Button onClick={back}>Back</Button>
              <Button onClick={next}>Next</Button>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div variants={fadeVariant} initial="hidden" animate="visible" exit="exit">
            <p>What is your monthly income?</p>
            <input type="text" value={income} onChange={(e) => setIncome(e.target.value)} style={inputStyle} />
            <div style={buttonRowStyle}>
              <Button onClick={back}>Back</Button>
              <Button onClick={next}>Next</Button>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div variants={fadeVariant} initial="hidden" animate="visible" exit="exit">
            <p>Briefly describe your situation or dispute:</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} cols={50} style={{ ...inputStyle, width: '70%', borderRadius: '1rem' }} />
            <div style={buttonRowStyle}>
              <Button onClick={back}>Back</Button>
              <Button onClick={next}>Review</Button>
            </div>
          </motion.div>
        );
      case 6:
        return (
          <motion.div variants={fadeVariant} initial="hidden" animate="visible" exit="exit">
            <h2>Review</h2>
            <p><strong>Case Type:</strong> {caseType}</p>
            {caseType === 'Eviction' && (
              <>
                <p><strong>Received Notice:</strong> {receivedNotice ? 'Yes' : 'No'}</p>
                <p><strong>Date of Notice:</strong> {noticeDate}</p>
              </>
            )}
            <p><strong>Name:</strong> {fullName}</p>
            <p><strong>Income:</strong> ${income}</p>
            <p><strong>Reason:</strong> {reason}</p>
            <div style={buttonRowStyle}>
              <Button onClick={back}>Back</Button>
              <Button onClick={submitToAI}>Submit to AI</Button>
            </div>

            {followUpHistory.length > 0 && (
              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#222', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto', textAlign: 'left' }}>
                <h3 style={{ color: '#fff' }}>AI Conversation</h3>
                {followUpHistory.map((entry, index) => (
                  <p key={index} style={{
                    marginBottom: '1.5rem',
                    whiteSpace: 'pre-line',
                    color: entry.startsWith('User:') ? '#8ab4f8' : '#ddd',
                    fontWeight: entry.startsWith('User:') ? 'bold' : 'normal'
                  }}>{entry}</p>
                ))}
                {aiSuggestedFollowUp && (
                  <p style={{ marginTop: '1rem', color: '#aaa', fontStyle: 'italic' }}>{aiSuggestedFollowUp}</p>
                )}
                <div style={{ marginTop: '1rem' }}>
                  <input
                    type="text"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    placeholder="Ask a follow-up question"
                    style={{
                      width: '70%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #555',
                      marginRight: '0.5rem',
                      backgroundColor: '#111',
                      color: '#eee'
                    }}
                  />
                  <Button onClick={askFollowUp}>Ask</Button>
                </div>
              </div>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      backgroundColor: '#000',
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: '#111827',
        padding: '2rem',
        borderRadius: '1rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        color: '#fff',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      }}>
        <h1 style={{ fontFamily: 'Segoe UI', fontSize: '2rem', marginBottom: '2rem' }}>{caseType} Form</h1>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          >
            {stepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DocumentBuilder;
