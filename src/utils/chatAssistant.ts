// utils/chatAssistant.ts
import openai from './openaiClient';

export const getAIChatResponse = async (message: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful legal assistant helping users understand legal issues and select the appropriate legal path.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content;
    return reply || 'I couldn’t generate a response at this time.';
  } catch (error) {
    console.error('OpenAI error:', error);
    return 'There was an error generating the response.';
  }
};
