// utils/chatAssistant.ts

export const getAIChatResponse = async (message: string): Promise<string> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/openai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: message }), // Backend expects 'question'
    });

    const data = await response.json();

    if (!data || typeof data.answer !== 'string') {
      console.warn('Unexpected OpenAI response format:', data);
      return 'I couldn’t generate a response at this time.';
    }

    return data.answer;
  } catch (error) {
    console.error('OpenAI backend error:', error);
    return 'There was an error generating the response.';
  }
};
