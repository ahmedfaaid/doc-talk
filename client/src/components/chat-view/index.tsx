import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SelectedDirectoryContext } from '@/context/directory-dialog';
import { UserMessage } from '@/types';
import { FormEvent, useContext, useState } from 'react';

export default function ChatView() {
  const { directory } = useContext(SelectedDirectoryContext);
  const [messages, setMessages] = useState<UserMessage[] | []>([]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSubmitMessage = async (e: FormEvent) => {
    e.preventDefault();

    const userMessage = { id: Date.now(), role: 'user', content: inputMessage };
    setMessages((prevState) => [...prevState, userMessage]);
    setInputMessage('');

    try {
      const res = await fetch('http://localhost:5155/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: inputMessage, directoryPath: directory })
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      let aiResponse = '';

      while (true) {
        const { done, value } = (await reader?.read()) || {};
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);

        const jsonChunks = chunk
          .split('\n')
          .filter((line) => line.startsWith('data: '))
          .map((line) => line.replace('data: ', '').trim());

        for (const jsonChunk of jsonChunks) {
          try {
            const parsedChunk = JSON.parse(jsonChunk);
            const data = parsedChunk.answer || '';

            if (data) {
              aiResponse += data;
              setMessages((prevState) => {
                const lastMessage = prevState[prevState.length - 1];
                if (lastMessage?.role === 'assistant') {
                  return [
                    ...prevState.slice(0, -1),
                    { ...lastMessage, content: aiResponse }
                  ];
                }
                return [
                  ...prevState,
                  { id: Date.now(), role: 'assistant', content: aiResponse }
                ];
              });
            }
          } catch (error) {
            alert('Chunk Error:' + (error as Error).message);
          }
        }
      }
    } catch (error) {
      alert('Streaming Error: ' + (error as Error).message);
    }
  };

  return (
    <div className='h-full'>
      <div className='mx-auto flex h-full w-3/4 flex-col items-center justify-between'>
        {/* chat timeline */}
        <div className='basis my-2 w-full shrink grow rounded-md border border-zinc-200 p-2'>
          {messages.map((message) =>
            message.role === 'assistant' ? (
              <div
                className='receive-chat relative flex justify-start'
                key={message.id}
              >
                <div className='mb-2 max-w-[80%] rounded bg-zinc-200 px-5 py-2 text-sm font-light text-black'>
                  <p>{message.content}</p>
                </div>
              </div>
            ) : (
              <div className='send-chat flex justify-end' key={message.id}>
                <div className='mb-2 max-w-[80%] rounded bg-zinc-800 px-5 py-2 text-sm font-light text-white'>
                  <p>{message.content}</p>
                </div>
              </div>
            )
          )}
        </div>
        {/* chat footer and input */}
        <form
          className='grid w-full shrink grow-0 basis-auto gap-2'
          onSubmit={handleSubmitMessage}
        >
          <Textarea
            placeholder='Type your message here.'
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitMessage(e)}
          />
          <Button>Send message</Button>
        </form>
      </div>
    </div>
  );
}
