import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ChatView() {
  return (
    <div className='h-full'>
      <div className='w-3/4 mx-auto flex flex-col items-center justify-between h-full'>
        {/* chat timeline */}
        <div className='border border-zinc-200 w-full grow shrink basis my-2 rounded-md'>
          <p>Chat timeline</p>
        </div>
        {/* chat footer and input */}
        <div className='grid w-full gap-2 grow-0 shrink basis-auto'>
          <Textarea placeholder='Type your message here.' />
          <Button>Send message</Button>
        </div>
      </div>
    </div>
  );
}
