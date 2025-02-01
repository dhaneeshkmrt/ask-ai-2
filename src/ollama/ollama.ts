import { Ollama } from 'ollama';

// Initialize the Ollama client
export const ollama = new Ollama({ host: 'http://localhost:11434' });

/// Function to stream responses
export async function streamResponse(message: string) {
  const stream = await ollama.generate({
    model: 'llama2', // Model name
    prompt: message, // Prompt
    stream: false, // Enable streaming
  });

  return stream;
}