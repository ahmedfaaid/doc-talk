import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SelectedDirectoryContext } from '@/context/directory-dialog';
import { Message as Msg } from '@/types';
import { FormEvent, useContext, useState } from 'react';
import Message from '../message';

export default function ChatView() {
  const { directory } = useContext(SelectedDirectoryContext);
  const [messages, setMessages] = useState<Msg[] | []>([]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSubmitMessage = async (e: FormEvent) => {
    e.preventDefault();

    const userMessage = { id: Date.now(), role: 'user', content: inputMessage };
    setMessages((prevState) => [...prevState, userMessage]);
    setInputMessage('');

    const abortController = new AbortController();

    try {
      const res = await fetch('http://localhost:5155/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: inputMessage, directoryPath: directory }),
        signal: abortController.signal
      });

      if (!res.body) {
        throw new Error('Response body is undefined');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      let aiResponse = '';

      while (true) {
        const { done, value } = (await reader?.read()) || {};
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

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
    } finally {
      abortController.abort();
    }
  };

  return (
    <div className='h-full'>
      <div className='mx-auto flex h-full w-3/4 flex-col items-center justify-between'>
        {/* chat timeline */}
        <div className='basis my-2 w-full shrink grow rounded-md border border-zinc-200 p-2'>
          {messages.map((message) => (
            <Message message={message} key={message.id} />
          ))}
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
