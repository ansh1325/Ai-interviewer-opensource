import { InterviewConfig, Message } from '../types';
import { PERSONAS } from '../constants';

export async function queryOllama(
  config: InterviewConfig,
  messages: Message[],
  systemPromptAddition: string = ''
): Promise<string> {
  const endpoint = config.providerSettings.ollamaEndpoint || 'http://localhost:11434';
  const model = config.providerSettings.ollamaModel || 'llama3.2';
  const persona = PERSONAS.find(p => p.id === config.persona) || PERSONAS[0];

  const systemInstruction = `You are ${persona.name}, ${persona.title}. 
Interview Style: ${persona.style}
You are conducting a live technical interview for a ${config.level} level engineer in ${config.domain}.
Be concise, articulate, and realistic. Never give away answers directly. Ask probing questions or acknowledge good answers and transition smoothly.
${systemPromptAddition}`;

  const formattedMessages = [
    { role: 'system', content: systemInstruction },
    ...messages.map(m => ({
      role: m.role === 'interviewer' ? 'assistant' : 'user',
      content: m.content + (m.codeSnippet ? `\n\nCode:\n${m.codeSnippet}` : '')
    }))
  ];

  const response = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      stream: false,
      options: {
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama returned status ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.message?.content || 'I have noted your response. Let us continue.';
}
