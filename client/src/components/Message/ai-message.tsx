import { Message } from '@/types';
import Markdown from 'react-markdown';

interface AiMessageProps {
  message: Message;
}

export default function AiMessage({ message }: AiMessageProps) {
  return (
    <div className='receive-chat relative flex justify-start'>
      <div className='mb-2 max-w-[80%] rounded bg-zinc-200 px-5 py-2 text-sm font-light text-black'>
        <Markdown>{message.content}</Markdown>
      </div>
    </div>
  );
}
