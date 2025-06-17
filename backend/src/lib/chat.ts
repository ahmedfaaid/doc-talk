import { BaseChatMessageHistory } from '@langchain/core/chat_history';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage
} from '@langchain/core/messages';
import { getMessages } from '../db/operations/message.operation';

export class DbChatMessageHistory extends BaseChatMessageHistory {
  public lc_namespace = ['langchain', 'memory', 'chat_message_histories'];
  private threadId: string;
  public messages: BaseMessage[] = [];

  constructor(threadId: string) {
    super();
    this.threadId = threadId;
    this.loadFromDatabase();
  }

  private async loadFromDatabase() {
    const dbMessages = await getMessages(this.threadId);
    this.messages = dbMessages.map(msg => {
      switch (msg.role) {
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        default:
          return new SystemMessage(msg.content);
      }
    });
  }

  async addMessage(message: BaseMessage): Promise<void> {
    this.messages.push(message);
  }

  async addUserMessage(message: string): Promise<void> {
    await this.addMessage(new HumanMessage(message));
  }

  async addAIChatMessage(message: string): Promise<void> {
    await this.addMessage(new AIMessage(message));
  }

  async getMessages(): Promise<BaseMessage[]> {
    return this.messages;
  }

  async clear(): Promise<void> {
    this.messages = [];
  }
}
