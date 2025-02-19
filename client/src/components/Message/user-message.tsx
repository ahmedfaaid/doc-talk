import { Message } from '@/types';

interface UserMessage {
  message: Message;
}

export default function UserMessage({ message }: UserMessage) {
  return (
    <div className='send-chat flex justify-end'>
      <div className='mb-2 max-w-[80%] rounded bg-zinc-800 px-5 py-2 text-sm font-light text-white'>
        <p>{message.content}</p>
      </div>
    </div>
  );
}
