# Installing and Running Ollama with Deepseek-R 1.5B

This guide walks through installing Ollama and running the Deepseek-R 1.5B model on your local machine.

## Prerequisites

- A Linux, macOS, or Windows system with WSL2
- At least 8GB RAM (16GB recommended)
- 4GB free disk space
- NVIDIA GPU recommended but not required

## Installing Ollama

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### macOS
Download and install from https://ollama.com/download

### Windows
1. Install WSL2 if not already installed
2. Follow Linux installation instructions within WSL2

## Getting Started

1. Start the Ollama service:
```bash
systemctl start ollama    # Linux with systemd
ollama serve             # macOS or manual start
```

2. Pull the Deepseek-R 1.5B model:
```bash
ollama pull deepseek-coder:1.5b
```

## Running the Model

### Command Line Interface
```bash
ollama run deepseek-coder:1.5b
```

### API Usage
Start making requests to the local API endpoint:
```bash
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "deepseek-coder:1.5b",
  "prompt": "Write a Python function to calculate fibonacci numbers"
}'
```

## Common Parameters

Adjust these parameters when running the model:

- Temperature (creativity): `--temperature 0.7`
- Context length: `--ctx-size 2048`
- System prompt: `--system "You are a helpful coding assistant"`

Example with parameters:
```bash
ollama run deepseek-coder:1.5b --temperature 0.7 --ctx-size 2048
```

## Troubleshooting

1. If the model fails to load:
   - Check available system memory
   - Ensure GPU drivers are up to date (if using GPU)
   - Verify model was downloaded successfully

2. If you get API connection errors:
   - Confirm Ollama service is running
   - Check if port 11434 is available
   - Verify firewall settings

## Resources

- Ollama documentation: https://ollama.com/docs
- Deepseek-R model card: https://ollama.com/library/deepseek-coder
- Community Discord: https://discord.gg/ollama

## Additional Tips

- Use `ctrl+c` to exit the chat interface
- Use `ollama list` to see installed models
- Use `ollama rm deepseek-coder:1.5b` to remove the model


### sadfsafd

    private processPrompt(userMessage: string): string {
        const selectedCode = this.getSelectedCode();

        const systemPrompt = `You are an expert programming assistant. Format your responses using these rules:
            1. Use markdown formatting with proper code blocks
            2. Separate explanations and code with clear headings using markdown (##)
            3. Keep explanations concise and focused
            4. Structure complex responses in sections
            `;

        const prompt = `
            ${selectedCode ? `**Context (Selected Code):** \`\`\` ${selectedCode} \`\`\`\n` : ''}
            **User Query:** ${userMessage}
            **Task:** Provide a clear, well-structured response that directly addresses the query. Include relevant code examples where appropriate.
        `;

        return prompt;
        // const response = await this.getResponseText(prompt);
        // return response;
    }


    const  generateResponse = async (message: string) => {
            try{
                const prompt = this.processPrompt(message);
                this.showLoader(webviewView.webview);

                const stream = await ollama.generate({
                    model: 'deepseek-r1:1.5b', // Model name
                    prompt, // Your prompt
                    stream: true, // Enable streaming
                });
                
                //   {
                //     model: "deepseek-r1:1.5b",
                //     created_at: "2025-02-05T13:16:35.875786Z",
                //     response: "<think>",
                //     done: false,
                //   }
                // Process each chunk as it arrives
                for await (const chunk of stream) {
                    // process.stdout.write(chunk.response); // Print chunks to the console
                    this.addMessageToWebview(webviewView.webview, chunk.response, 'bot');
                }
                this.hideLoader(webviewView.webview);

            }catch(err){
                console.log('Error', err);
                this.hideLoader(webviewView.webview);
            }
              
        }