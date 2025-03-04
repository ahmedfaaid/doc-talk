import { Message as Msg } from '@/types';
import AiMessage from './ai-message';
import UserMessage from './user-message';

interface MessageProps {
  message: Msg;
}

export default function Message({ message }: MessageProps) {
  switch (message.role) {
    case 'user':
      return <UserMessage message={message} />;
    case 'assistant':
      return <AiMessage message={message} />;
    default:
      throw new Error(`Invalid role ${message.role}`);
  }
}
