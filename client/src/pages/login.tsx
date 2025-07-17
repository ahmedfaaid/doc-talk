import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth';
import { error, success } from '@/lib/toasts';
import * as Form from '@radix-ui/react-form';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('second');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await login({ email, password });

    if (!res.success) {
      error(res.message as string);
      return;
    }

    success(res.message as string);
    navigate('/');
  };

  return (
    <div className='flex h-screen w-full flex-col items-center justify-center'>
      <h2 className='mt-6 text-center text-3xl font-extrabold leading-9 text-gray-900'>
        Sign in to your account
      </h2>
      <div className='h-90 my-10 w-1/4 max-w-xl rounded bg-white px-8 py-6 shadow-xl'>
        <Form.Root onSubmit={handleSubmit}>
          <Form.Field name='email' className='mb-6'>
            <Form.Label className='block font-bold text-gray-800'>
              Email
            </Form.Label>
            <Form.Control asChild>
              <Input
                type='email'
                placeholder='your@email.com'
                required
                className=':ring-indigo-600 mt-2 w-full rounded border border-gray-300 py-2 pl-3 outline-none focus:ring-indigo-600'
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Control>
            <div>
              <Form.Message match='valueMissing'>
                Please enter your email
              </Form.Message>
              <Form.Message match='typeMismatch' className='text-red-400'>
                Please provide a valid email
              </Form.Message>
            </div>
          </Form.Field>
          <Form.Field name='password' className='mb-6'>
            <Form.Label className='block font-bold text-gray-800'>
              Password
            </Form.Label>
            <Form.Control asChild>
              <Input
                type='password'
                placeholder='********'
                required
                className=':ring-indigo-600 mt-2 w-full rounded border border-gray-300 py-2 pl-3 outline-none focus:ring-indigo-600'
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Control>
            <div>
              <Form.Message match='valueMissing'>
                Please enter your password
              </Form.Message>
              <Form.Message match='typeMismatch' className='text-red-400'>
                Please provide a valid password
              </Form.Message>
            </div>
          </Form.Field>
          <Form.Submit asChild>
            <Button
              className='mt-6 block w-full cursor-pointer rounded bg-indigo-500 px-4 py-2 text-center font-bold text-white disabled:opacity-30'
              disabled={loading}
            >
              Login
            </Button>
          </Form.Submit>
        </Form.Root>
      </div>
    </div>
  );
}
