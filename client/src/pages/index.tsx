import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare } from 'lucide-react';

export default function NoChat() {
  return (
    <div className='flex h-full flex-1 flex-col'>
      {/* Chat Messages Area */}
      <div className='bg-palette-warm-white flex-1 p-6'>
        <div className='mx-auto flex h-full max-w-4xl items-center justify-center'>
          <div className='py-20 text-center'>
            <div className='from-palette-purple to-palette-pink mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r p-6 shadow-lg'>
              <MessageSquare className='text-palette-white h-12 w-12' />
            </div>
            <h3 className='text-palette-navy mb-2 text-xl font-semibold'>
              Ready to start chatting
            </h3>
            <p className='text-palette-blue mx-auto mb-6 max-w-md'>
              Upload your documents using the sidebar, then start a conversation
              to get insights from your content.
            </p>
            <Button className='from-palette-coral to-palette-orange hover:from-palette-orange hover:to-palette-amber text-palette-white rounded-full bg-gradient-to-r px-8 shadow-lg transition-all duration-200'>
              Start New Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className='bg-palette-white p-4 shadow-md'>
        <div className='mx-auto max-w-4xl'>
          <div className='flex h-10 gap-3'>
            <Input
              placeholder='Ask a question about your documents...'
              className='bg-palette-warm-white border-palette-light-gray text-palette-navy focus:ring-palette-pink flex-1 rounded-full px-6'
            />
            <Button className='from-palette-pink to-palette-coral hover:from-palette-coral hover:to-palette-orange text-palette-white rounded-full bg-gradient-to-r px-6 shadow-md transition-all duration-200'>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
