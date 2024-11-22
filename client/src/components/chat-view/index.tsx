import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ChatView() {
  return (
    <div className='h-full'>
      <div className='mx-auto flex h-full w-3/4 flex-col items-center justify-between'>
        {/* chat timeline */}
        <div className='basis my-2 w-full shrink grow rounded-md border border-zinc-200 p-2'>
          <div className='receive-chat relative flex justify-start'>
            <div className='mb-2 max-w-[80%] rounded bg-zinc-200 px-5 py-2 text-sm font-light text-black'>
              <p>
                I got two tickets to go to see this awesome band called, Lorem
                ipsum dollar !! Do you want to come ?
              </p>
            </div>
          </div>
          <div className='send-chat flex justify-end'>
            <div className='mb-2 max-w-[80%] rounded bg-zinc-800 px-5 py-2 text-sm font-light text-white'>
              <p>
                I got two tickets to go to see this awesome band called, Lorem
                ipsum dollar !! Do you want to come ?
              </p>
            </div>
          </div>
        </div>
        {/* chat footer and input */}
        <form className='grid w-full shrink grow-0 basis-auto gap-2'>
          <Textarea placeholder='Type your message here.' />
          <Button>Send message</Button>
        </form>
      </div>
    </div>
  );
}
