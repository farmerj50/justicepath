import { askOpenAI } from './askOpenAI';

/**
 * Constructs a structured AI legal prompt and fetches a response.
 * If the user requests a motion or court reply, the AI formats it accordingly.
 */

type LegalAdviceInput = {
  caseType: string;
  fullName: string;
  income: string;
  reason: string;
  state: string,
  city: string,
  noticeDate?: string;
  receivedNotice?: boolean;
  followUp?: string;
  documentType?: string;
  fileContents?: string;
};

export const generateLegalAdvice = async (input: LegalAdviceInput) => {
  const {
    caseType,
    fullName,
    income,
    reason,
    state,
    city,
    noticeDate,
    receivedNotice,
    followUp = '',
    documentType = 'advice',
    fileContents = '',
  } = input;

  const context = `
You are an AI legal assistant generating legal help for a user located in ${city}, ${state}.

Depending on the request type, respond accordingly:

- For document requests (motion, response, reply), format your response as a valid legal pleading:
  1. Heading with court name, county, parties, and case type
  2. Title of the document (e.g., RESPONSE TO PLAINTIFF'S MOTION TO DISMISS)
  3. Introduction paragraph
  4. Numbered legal arguments with citations to ${state}-specific laws (${state === 'GA' ? 'OCGA' : state === 'NY' ? 'CPLR' : state === 'CA' ? 'California Civil Code' : 'relevant state laws'})
  5. Conclusion with prayer for relief
  6. Respectfully submitted line
  7. Signature block for the pro se litigant

- For contract analysis, review the uploaded text and identify key clauses, obligations, and potential issues.

- For arbitration assistance, draft an arbitration statement citing relevant rules and legal theory.

- For award estimation, analyze the case context and predict potential monetary outcomes based on ${state} precedent.

Otherwise, provide general legal guidance and ask a helpful follow-up. Reference local laws in ${city} and ${state} where applicable.
`.trim();


  const caseDetails = `
Case Type: ${caseType}
Full Name: ${fullName}
Income: $${income}
${receivedNotice !== undefined ? `Received Notice: ${receivedNotice ? 'Yes' : 'No'}` : ''}
${noticeDate ? `Notice Date: ${noticeDate}` : ''}
Reason: ${reason}
Request Type: ${documentType}
${fileContents ? `Uploaded Document Content:\n${fileContents}` : ''}
${followUp ? `Follow-up Question: ${followUp}` : ''}
`.trim();

  const prompt = `${context}

User Information:
${caseDetails}`;

  // 🔁 Call askOpenAI and parse response
  const fullReply = await askOpenAI(prompt);
  const [main, suggestion] = fullReply.split(/Suggested follow-up:/i);

  return {
    main: main.trim(),
    suggestion: suggestion?.trim() || '',
  };
};
