import { ChatThread } from '@/types';
import { MessageSquare } from 'lucide-react';
import { Badge } from './ui/badge';

interface ThreadProps {
  thread: ChatThread;
}

export default function Thread({ thread }: ThreadProps) {
  return (
    <div className='hover:bg-palette-white hover:border-palette-pink cursor-pointer rounded-lg border border-transparent p-3 transition-all duration-200 hover:shadow-sm'>
      <div className='flex items-start gap-3'>
        <div className='from-palette-purple to-palette-pink rounded-full bg-gradient-to-r p-2'>
          <MessageSquare className='text-palette-white h-4 w-4' />
        </div>
        <div className='min-w-0 flex-1'>
          <h3 className='text-palette-navy truncate text-sm font-medium'>
            {thread.title}
          </h3>
          <p className='text-palette-blue mt-1 truncate text-xs'>
            {thread.lastMessage}
          </p>
          <div className='mt-2 flex items-center justify-between'>
            <span className='text-palette-blue text-xs'>
              {thread.timestamp}
            </span>
            <Badge
              variant='secondary'
              className='bg-palette-cool-gray text-palette-navy text-xs'
            >
              {thread.messageCount}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
