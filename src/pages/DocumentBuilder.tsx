import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import openai from '../utils/openaiClient';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';


import {
  isValidFullName,
  isValidIncome,
  isValidReason,
  isValidNoticeDate
} from '../utils/validation';

const DocumentBuilder: React.FC = () => {
  const datePickerRef = useRef<any>(null);
  const { caseType } = useParams<{ caseType: string }>();
  const { user } = useAuth();

useEffect(() => {
  if (!user) {
    window.location.href = '/login';
  }
}, [user]);

if (!user) return null;

  const STORAGE_KEY = `formData-${caseType}`;

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
  const [errors, setErrors] = useState<Record<number, string>>({});

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
    minHeight: '48px'
  };

  const buttonStyle = {
    padding: '0.5rem 1.5rem',
    borderRadius: '999px',
    background: 'linear-gradient(to right, #4f46e5, #6366f1)',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
    cursor: 'pointer'
  };

  const buttonRowStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '1rem'
  };

  const validateStep = (): boolean => {
    let isValid = true;
    let errorMsg = '';

    switch (step) {
      case 1:
        if (caseType === 'Eviction' && receivedNotice === null) {
          isValid = false;
          errorMsg = 'Please select an option.';
        }
        break;
      case 2:
        if (caseType === 'Eviction' && !isValidNoticeDate(noticeDate)) {
          isValid = false;
          errorMsg = 'Please select a valid date.';
        }
        break;
      case 3:
        if (!isValidFullName(fullName)) {
          isValid = false;
          errorMsg = 'Please enter your full name.';
        }
        break;
      case 4:
        if (!isValidIncome(income)) {
          isValid = false;
          errorMsg = 'Enter a valid income (e.g., 2500 or 2500.50).';
        }
        break;
      case 5:
        if (!isValidReason(reason)) {
          isValid = false;
          errorMsg = 'Please describe your situation in more detail.';
        }
        break;
      default:
        break;
    }

    if (!isValid) {
      setErrors((prev) => ({ ...prev, [step]: errorMsg }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[step];
        return newErrors;
      });
    }

    return isValid;
  };

  const persist = (key: string, value: any) => {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, [key]: value }));
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.fullName) setFullName(saved.fullName);
    if (saved.income) setIncome(saved.income);
    if (saved.reason) setReason(saved.reason);
    if (saved.receivedNotice !== undefined) setReceivedNotice(saved.receivedNotice);
    if (saved.noticeDate) {
      setNoticeDate(saved.noticeDate);
      setNoticeDateObject(new Date(saved.noticeDate));
    }
  }, [caseType]);

  const next = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
    }
  };

  const back = () => setStep((s) => s - 1);

  const stepTitleMap: Record<number, string> = {
    1: 'Eviction Notice',
    2: 'Date of Notice',
    3: 'Your Full Name',
    4: 'Monthly Income',
    5: 'Your Situation',
    6: 'Review & Submit'
  };

  const generatePrompt = (includeFollowUp = false) => {
  let contextDetails = '';
  let caseSpecifics = '';

  switch (caseType) {
    case 'Eviction':
      caseSpecifics = `
- Received Eviction Notice: ${receivedNotice ? 'Yes' : 'No'}
- Date of Notice: ${noticeDate}
      `.trim();
      contextDetails = `
You are a legal assistant helping a user in Georgia with a housing eviction issue.
Provide steps that comply with Georgia landlord-tenant laws and eviction procedure.
Include key deadlines, forms, defenses, and organizations that can help.
Mention Georgia-specific statutes (like OCGA § 44-7) where applicable.
      `.trim();
      break;

    case 'Small Claims':
      contextDetails = `
You are a legal assistant helping a user in Georgia with a small claims issue.
Outline the exact steps for filing a small claims lawsuit, including monetary limits, timelines, and Georgia-specific procedures.
Mention specific statutes (such as OCGA Title 15 or 9), and name at least one legal aid organization or consumer office that helps in small claims.
      `.trim();
      break;

    case 'PII Misuse':
      contextDetails = `
You are a legal assistant helping a user in Georgia whose personal information (PII) has been used without their consent.
Give guidance under Georgia privacy laws and federal law if relevant (like the FTC or Georgia Fair Business Practices Act).
Mention official bodies like the Georgia Department of Law or the FTC.
      `.trim();
      break;

    default:
      contextDetails = `
You are a legal assistant helping a user in Georgia with a legal issue of type: ${caseType}.
Give detailed, actionable steps under Georgia law. Where possible, cite relevant Georgia statutes, forms, organizations, and local court procedures.
      `.trim();
      break;
  }

  return `
${contextDetails}

User Details:
- Case Type: ${caseType}
- Full Name: ${fullName}
- Monthly Income: ${income}
${caseSpecifics ? caseSpecifics : ''}
- Case Reason / Situation: ${reason}

Please include:
1. Specific legal steps the user can take in Georgia.
2. At least one **Georgia law or court rule** that applies.
3. One or more **Georgia-based organizations or hotlines** they can contact for help.
4. Step-by-step breakdown of any court process involved.
5. General recommendations to improve their legal standing.

${includeFollowUp ? `Also answer this follow-up: "${followUp}"` : ''}

**Do not suggest simply contacting an attorney.** Provide practical, direct help.

End with a helpful follow-up question they might ask next.
  `.trim();
};


  const formatResponse = (text: string) =>
    text.replace(/(\d+)\.\s*/g, (_, n) => `\n\n${n}. `).trim();

  const submitToAI = async () => {
    const prompt = generatePrompt();
    try {
      const response = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo'
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
        model: 'gpt-3.5-turbo'
      });
      const content = response.choices[0].message.content || 'No response.';
      setFollowUpHistory((prev) => [...prev, `User: ${followUp}`, `AI: ${formatResponse(content)}`]);
      setFollowUp('');
    } catch (err) {
      alert('There was an error with your follow-up.');
    }
  };
  // 👇 Paste this inside the DocumentBuilder component, just before return (
const stepContent = () => {
  switch (step) {
    case 1:
      return (
        <>
          <p>Have you received a notice of eviction?</p>
          {errors[step] && <p style={{ color: 'salmon' }}>{errors[step]}</p>}
          <div style={buttonRowStyle}>
            <button
              onClick={() => {
                setReceivedNotice(true);
                persist('receivedNotice', true);
                next();
              }}
              style={buttonStyle}
            >
              Yes
            </button>
            <button
              onClick={() => {
                setReceivedNotice(false);
                persist('receivedNotice', false);
                next();
              }}
              style={buttonStyle}
            >
              No
            </button>
          </div>
        </>
      );
    case 2:
      return (
        <>
          <p>Date of Notice:</p>
          {errors[step] && <p style={{ color: 'salmon' }}>{errors[step]}</p>}
          <div style={{ position: 'relative', width: '60%', margin: '0 auto' }}>
            <DatePicker
              selected={noticeDateObject}
              onChange={(date: Date | null) => {
                if (date) {
                  setNoticeDateObject(date);
                  const iso = date.toISOString().split('T')[0];
                  setNoticeDate(iso);
                  persist('noticeDate', iso);
                }
              }}
              dateFormat="yyyy-MM-dd"
              placeholderText="mm/dd/yyyy"
              className="custom-datepicker-input"
              ref={datePickerRef}
              maxDate={new Date()}
            />
            <FaCalendarAlt
              onClick={() => datePickerRef.current?.setFocus?.()}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#aaa',
                cursor: 'pointer'
              }}
            />
          </div>
          <div style={buttonRowStyle}>
            <button onClick={back} style={buttonStyle}>Back</button>
            <button onClick={next} style={buttonStyle}>Next</button>
          </div>
        </>
      );
    case 3:
      return (
        <>
          <p>Full Name:</p>
          {errors[step] && <p style={{ color: 'salmon' }}>{errors[step]}</p>}
          <input
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              persist('fullName', e.target.value);
            }}
            style={inputStyle}
          />
          <div style={buttonRowStyle}>
            <button onClick={back} style={buttonStyle}>Back</button>
            <button onClick={next} style={buttonStyle}>Next</button>
          </div>
        </>
      );
    case 4:
      return (
        <>
          <p>Monthly Income:</p>
          {errors[step] && <p style={{ color: 'salmon' }}>{errors[step]}</p>}
          <input
            type="text"
            value={income}
            onChange={(e) => {
              setIncome(e.target.value);
              persist('income', e.target.value);
            }}
            style={inputStyle}
          />
          <div style={buttonRowStyle}>
            <button onClick={back} style={buttonStyle}>Back</button>
            <button onClick={next} style={buttonStyle}>Next</button>
          </div>
        </>
      );
    case 5:
      return (
        <>
          <p>Your Situation:</p>
          {errors[step] && <p style={{ color: 'salmon' }}>{errors[step]}</p>}
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              persist('reason', e.target.value);
            }}
            style={{ ...inputStyle, width: '100%', borderRadius: '1rem' }}
          />
          <div style={buttonRowStyle}>
            <button onClick={back} style={buttonStyle}>Back</button>
            <button onClick={next} style={buttonStyle}>Review</button>
          </div>
        </>
      );
    case 6:
  return (
    <>
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
        <button onClick={back} style={buttonStyle}>Back</button>
        <button onClick={submitToAI} style={buttonStyle}>Submit to AI</button>
      </div>

      {followUpHistory.length > 0 && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#222',
          borderRadius: '8px',
          maxHeight: '300px',
          overflowY: 'auto',
          textAlign: 'left'
        }}>
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
            <p style={{ marginTop: '1rem', color: '#aaa', fontStyle: 'italic' }}>
              {aiSuggestedFollowUp}
            </p>
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
                color: '#eee',
              }}
            />
            <button onClick={askFollowUp} style={buttonStyle}>Ask</button>
          </div>
        </div>
      )}
    </>
  );

    default:
      return null;
  }
};



  return (
  <>
    <Navbar />
    <div style={{ backgroundColor: '#000', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#111827', padding: '2rem', borderRadius: '1rem', maxWidth: '500px', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>{caseType} Form</h1>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          {Object.entries(stepTitleMap).map(([index, title]) => (
            <div
              key={index}
              title={title}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: Number(index) === step ? '#4f46e5' : '#444',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                boxShadow: Number(index) === step ? '0 0 8px #6366f1' : undefined
              }}
            >
              {index}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {stepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  </>
);

};

export default DocumentBuilder;
