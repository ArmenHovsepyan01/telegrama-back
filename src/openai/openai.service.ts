import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';

@Injectable()
export class OpenAIService {
  public openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      defaultHeaders: { 'OpenAI-Beta': 'assistants=v2' }
    });
  }

  async generateText(): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1-nano-2025-04-14',
      messages: [{ role: 'user', content: 'Hello?' }],
      max_completion_tokens: 12
    });

    return response.choices[0].message.content;
  }

  async createThread(
    initialMessage: string,
    transcription: string,
    assistantInitialMessage: string
  ) {
    try {
      const thread = await this.openai.beta.threads.create({
        messages: [
          { role: 'user', content: initialMessage },
          { role: 'assistant', content: assistantInitialMessage },
          { role: 'user', content: transcription }
        ]
      });

      return thread.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw new Error('Failed to create thread');
    }
  }

  async createMessage(threadId: string, message: string) {
    try {
      return await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message
      });
    } catch (error) {
      console.error('Error createMessage:', error);
      throw new Error('Failed to create message');
    }
  }

  async createRunWithStream(threadId: string, stream = true) {
    try {
      return this.openai.beta.threads.runs.create(threadId, {
        assistant_id: process.env.ASSISTANT_ID,
        stream,
        parallel_tool_calls: true
      });
    } catch (error) {
      console.error('Error createRunWithStream:', error);
      throw new Error('Failed to create run');
    }
  }
}
