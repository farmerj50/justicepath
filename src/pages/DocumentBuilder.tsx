import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { generateLegalAdvice } from '../utils/agentHelper';

import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { State, City } from 'country-state-city';




import {
  isValidFullName,
  isValidIncome,
  isValidReason,
  isValidNoticeDate
} from '../utils/validation';


const persist = (key: string, value: any) => {
  localStorage.setItem(`justicepath-${key}`, JSON.stringify(value));
};



const DocumentBuilder: React.FC = () => {
  const datePickerRef = useRef<any>(null);
  const { caseType } = useParams<{ caseType: string }>();
  
  const { user } = useAuth();
  const navigate = useNavigate();




useEffect(() => {
  if (!user) {
    window.location.href = '/login';
  } else if (!user.plan) {
    window.location.href = '/select-plan';
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
  const [documentType, setDocumentType] = useState('advice');
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  useEffect(() => {
  if (state) {
    const result = City.getCitiesOfState('US', state);
    setCities(result.map((city) => city.name));
  }
}, [state]);

  
const formatCurrency = (value: string) => {
  if (!value) return '';

  const number = parseFloat(value);
  if (isNaN(number)) return '';

  // ✅ Keep up to 2 decimals, format with commas
  return `$${number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};


const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let rawValue = e.target.value;

  // ✅ Allow digits and at most one decimal point
  rawValue = rawValue.replace(/[^0-9.]/g, '');

  // ✅ Prevent multiple decimals
  const parts = rawValue.split('.');
  if (parts.length > 2) {
    rawValue = parts[0] + '.' + parts.slice(1).join('');
  }

  setIncome(rawValue);
  persist('income', rawValue);
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
        if (!state) {
          isValid = false;
          errorMsg = 'Please select a state.';
        }
         break;
       case 5:
        if (!city.trim()) {
           isValid = false;
           errorMsg = 'Please enter a city.';
        }
         break;

      case 6:
        if (!isValidIncome(income)) {
          isValid = false;
          errorMsg = 'Enter a valid income (e.g., 2500 or 2500.50).';
        }
        break;
      case 7:
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
    if (saved.state) setState(saved.state);
    if (saved.city) setCity(saved.city);

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
  4: 'State',
  5: 'City',
  6: 'Monthly Income',
  7: 'Your Situation',
  8: 'Review & Submit'
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
You are a legal assistant helping a user in ${city}, ${state} with a housing eviction issue.
Provide steps that comply with ${state} landlord-tenant laws and eviction procedure.
Include key deadlines, forms, defenses, and organizations that can help.
Mention ${state}-specific statutes (e.g., in Georgia, it's OCGA § 44-7) where applicable.
    `.trim();
    break;

  case 'Small Claims':
    contextDetails = `
You are a legal assistant helping a user in ${city}, ${state} with a small claims issue.
Outline the exact steps for filing a small claims lawsuit, including monetary limits, timelines, and ${state}-specific procedures.
Mention relevant statutes (e.g., in Georgia, OCGA Title 15 or 9) and name at least one legal aid organization or consumer office that helps in small claims.
    `.trim();
    break;

  case 'PII Misuse':
    contextDetails = `
You are a legal assistant helping a user in ${city}, ${state} whose personal information (PII) has been misused.
Give guidance under ${state} privacy laws and federal laws if relevant (such as the FTC or your state’s Fair Business Practices Act).
Mention official bodies (e.g., ${state === 'Georgia' ? 'Georgia Department of Law' : 'the appropriate state agency'}) and the FTC.
    `.trim();
    break;

  default:
    contextDetails = `
You are a legal assistant helping a user in ${city}, ${state} with a legal issue of type: ${caseType}.
Give detailed, actionable steps under ${state} law. Where possible, cite relevant ${state} statutes, forms, organizations, and local court procedures.
    `.trim();
    break;
}
  return `
${contextDetails}

User Details:
- Case Type: ${caseType}
- Full Name: ${fullName}
- City: ${city}
- State: ${state}
- Monthly Income: ${income}
${caseSpecifics ? caseSpecifics : ''}
- Case Reason / Situation: ${reason}

Please include:
1. Specific legal steps the user can take in ${state}.
2. At least one **${state} law or court rule** that applies.
3. One or more **${state}-based organizations or hotlines** they can contact for help.
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
    setLoading(true);
  try {
    const result = await generateLegalAdvice({
      caseType: caseType || '',
      fullName,
      income,
      state,
      city,
      reason,
      noticeDate,
      receivedNotice: !!receivedNotice,
      followUp: '',
      documentType
    });

    setAiResponse(result.main);
    setAiSuggestedFollowUp(result.suggestion);
    setFollowUpHistory([formatResponse(result.main)]);

  

    navigate('/documents', {
      state: {
        fromAI: true,
        documentType,
        generatedDocument: result.main,
        mimeType: 'text/plain' // <-- ADD THIS
      }
    });
  } catch (err) {
    alert('There was an error generating the summary.');
  } finally{
    setLoading(false);
  }
};




const askFollowUp = async () => {
  try {
    const result = await generateLegalAdvice({
      caseType: caseType || '',
      fullName,
      income,
      state,
      city,
      reason,
      noticeDate,
      receivedNotice: !!receivedNotice,
      followUp,
      documentType
    });
    setFollowUpHistory((prev) => [
      ...prev,
      `User: ${followUp}`,
      `AI: ${formatResponse(result.main)}`
    ]);
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
          {caseType === 'Eviction' && (
            <p className="text-black dark:text-white">Have you received a notice of eviction?</p>
          )}
          {caseType === 'Small Claims' && (
            <p className="text-black dark:text-white">What is the issue you're bringing to small claims court?</p>
          )}
          {caseType === 'Family Law' && (
            <p className="text-black dark:text-white">What family law issue are you dealing with? (e.g., divorce, custody)</p>
          )}

          {errors[step] && (
            <p className="text-red-400 dark:text-red-300">{errors[step]}</p>
          )}

          {caseType === 'Eviction' ? (
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => {
                  setReceivedNotice(true);
                  persist('receivedNotice', true);
                  next();
                }}
                className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:text-black transition shadow-md"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setReceivedNotice(false);
                  persist('receivedNotice', false);
                  next();
                }}
                className="px-6 py-2 rounded-full bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-300 dark:hover:bg-gray-400 dark:text-black transition shadow-md"
              >
                No
              </button>
            </div>
          ) : (
            <div>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  persist('reason', e.target.value);
                }}
                className="w-full p-3 rounded-xl border border-gray-500 shadow-md text-black dark:text-white bg-white dark:bg-gray-700 focus:outline-none"
                rows={4}
                placeholder="Briefly describe your situation"
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={next}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      );

    case 2:
      const getDateLabel = () => {
        switch (caseType) {
          case 'Eviction': return 'Date of Notice:';
          case 'Small Claims': return 'Date of Incident:';
          case 'Family Law': return 'Date of Event:';
          default: return 'Relevant Date:';
        }
      };

      return (
        <>
          <p>{getDateLabel()}</p>
          {errors[step] && <p className="text-red-400 dark:text-red-300">{errors[step]}</p>}
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
      {errors[step] && <p className="text-red-400 dark:text-red-300">{errors[step]}</p>}
      <input
        type="text"
        value={fullName}
        onChange={(e) => {
          setFullName(e.target.value);
          persist('fullName', e.target.value);
        }}
       className="w-full p-3 rounded-full border border-gray-500 shadow-md text-white dark:text-white bg-gray-800 dark:bg-gray-700 focus:outline-none text-center"
/>

      <div style={buttonRowStyle}>
        <button onClick={back} style={buttonStyle}>Back</button>
        <button onClick={next} style={buttonStyle}>Next</button>
      </div>
    </>
  );

  // CASE 4 - STATE
case 4:
  return (
    <>
      <p>State:</p>
      {errors[step] && <p className="text-red-400 dark:text-red-300">{errors[step]}</p>}
      <select
        value={state}
        onChange={(e) => {
          setState(e.target.value);
          persist('state', e.target.value);
        }}
        className="w-full p-3 rounded-full border border-gray-500 shadow-md text-white dark:text-white bg-gray-800 dark:bg-gray-700 focus:outline-none text-center"
     >
        <option value="">Select a state</option>
        <option value="GA">Georgia</option>
        <option value="NY">New York</option>
        <option value="CA">California</option>
        <option value="TX">Texas</option>
        <option value="FL">Florida</option>
        {/* Add more */}
      </select>
      <div style={buttonRowStyle}>
        <button onClick={back} style={buttonStyle}>Back</button>
        <button onClick={next} style={buttonStyle}>Next</button>
      </div>
    </>
  );

// CASE 5 - CITY
case 5:
  return (
    <>
      <p>City:</p>
      {errors[step] && (
        <p className="text-red-400 dark:text-red-300">{errors[step]}</p>
      )}
      <select
        value={city}
        onChange={(e) => {
          setCity(e.target.value);
          persist('city', e.target.value);
        }}
       className="w-full p-3 rounded-full border border-gray-500 shadow-md text-white dark:text-white bg-gray-800 dark:bg-gray-700 focus:outline-none text-center"
      >
        <option value="">Select a city</option>
        {cities.length > 0 ? (
          cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))
        ) : (
          <option disabled>Select a state first</option>
        )}
      </select>
      <div style={buttonRowStyle}>
        <button onClick={back} style={buttonStyle}>
          Back
        </button>
        <button onClick={next} style={buttonStyle}>
          Next
        </button>
      </div>
    </>
  );

    case 6:
      return (
        <>
          <p>Monthly Income:</p>
          {errors[step] && <p className="text-red-400 dark:text-red-300">{errors[step]}</p>}
          <input
  type="text"
  value={income}
  onChange={handleIncomeChange}
  onBlur={(e) => setIncome(parseFloat(e.target.value).toString())} // normalize when leaving
  className="w-full p-3 rounded-full border border-gray-500 shadow-md text-white dark:text-white bg-gray-800 dark:bg-gray-700 focus:outline-none text-center"
/>

          <div style={buttonRowStyle}>
            <button onClick={back} style={buttonStyle}>Back</button>
            <button onClick={next} style={buttonStyle}>Next</button>
          </div>
        </>
      );

    case 7:
      return (
        <>
          <p>Your Situation:</p>
          {errors[step] && <p className="text-red-400 dark:text-red-300">{errors[step]}</p>}
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              persist('reason', e.target.value);
            }}
            className="w-full p-3 rounded-xl border border-gray-500 shadow-md text-white dark:text-white bg-gray-800 dark:bg-gray-700 focus:outline-none"
          />
          <div style={buttonRowStyle}>
            <button onClick={back} style={buttonStyle}>Back</button>
            <button onClick={next} style={buttonStyle}>Review</button>
          </div>
        </>
      );
  case 8:
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

            <div style={{ marginTop: '1rem' }}>
              <label htmlFor="docType" style={{ display: 'block', color: '#fff', marginBottom: '0.5rem' }}>
                Select Document Type:
              </label>
              <select
                id="docType"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #555',
                  backgroundColor: '#111',
                  color: '#eee',
                  width: '100%',
                }}
              >
                <option value="advice">General Advice</option>
                <option value="motion">Motion</option>
                <option value="response">Response</option>
                <option value="reply">Reply to Motion</option>
                <option value="precedent">Legal Precedent Summary</option>
                <option value="contract">Contract Analysis</option>
                <option value="arbitration">Arbitration Assistance</option>
                <option value="award">Award Estimation</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
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

        {loading && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="animate-spin h-6 w-6 rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
            <p className="text-indigo-400 mt-2">Generating AI Document...</p>
          </div>
        )}

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