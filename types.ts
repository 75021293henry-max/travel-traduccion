
export interface Message {
  role: 'user' | 'model';
  text: string;
  attachment?: {
    data: string;
    mimeType: string;
    fileName: string;
  };
}

export interface PromptConfig {
  fullPrompt: string;
  shortPrompt: string;
  instructions: {
    gemini: string;
    chatgpt: string;
    claude: string;
  };
}
