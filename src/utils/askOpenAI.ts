// src/utils/askOpenAI.ts

export const askOpenAI = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/openai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: prompt }), // ✅ Match backend key
    });

    const data = await response.json();

    if (!data || typeof data.answer !== 'string') {
      console.warn('Unexpected response format from OpenAI backend:', data);
      return 'No response received.';
    }

    return data.answer; // ✅ Matches what generateLegalAdvice expects
  } catch (error) {
    console.error('askOpenAI error:', error);
    return 'Error communicating with assistant.';
  }
};
