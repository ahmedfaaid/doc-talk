import { PropsWithChildren } from 'react';
import { ToastContainer } from 'react-toastify';

interface ToastProviderProps extends PropsWithChildren {}

export default function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
