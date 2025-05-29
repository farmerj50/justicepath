import openai from './openaiClient';

interface LegalAdviceInput {
  caseType: string;
  fullName: string;
  income: string;
  reason: string;
  noticeDate?: string;
  receivedNotice?: boolean;
  followUp?: string;
  previousMessages?: { role: 'user' | 'assistant'; content: string }[];
}

export const generateLegalAdvice = async ({
  caseType,
  fullName,
  income,
  reason,
  noticeDate,
  receivedNotice,
  followUp = '',
  previousMessages = []
}: LegalAdviceInput) => {
  let caseSpecifics = '';
  let context = '';

  switch (caseType) {
    case 'Eviction':
      caseSpecifics = `- Received Eviction Notice: ${receivedNotice ? 'Yes' : 'No'}\n- Date of Notice: ${noticeDate}`;
      context = `You are a legal assistant helping a user in Georgia with an eviction issue. Follow Georgia landlord-tenant laws like OCGA § 44-7. Be detailed and practical.`;
      break;
    // Add other caseType branches as needed
    default:
      context = `You are a Georgia-based legal assistant. Respond helpfully and cite state laws and processes.`;
  }

  const systemMessage = {
    role: 'system' as const,
    content: context
  };

  const userIntro = {
    role: 'user' as const,
    content: `
User Details:
- Case Type: ${caseType}
- Full Name: ${fullName}
- Monthly Income: ${income}
${caseSpecifics}
- Reason: ${reason}

Provide clear legal advice based on Georgia law.
`.trim()
  };

  const messages = [systemMessage, userIntro, ...previousMessages];

  if (followUp) {
    messages.push({ role: 'user', content: followUp });
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages
  });

  const content = response.choices[0].message.content || '';
  const [main, suggestion] = content.split(/Suggested follow-up:/i);

  return {
    main: main.trim(),
    suggestion: suggestion?.trim() || '',
    newMessage: { role: 'assistant', content: content.trim() }
  };
};
