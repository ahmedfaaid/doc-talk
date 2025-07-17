import { toast } from 'react-toastify';

export const success = (message: string) =>
  toast.success(message, {
    position: 'top-right',
    autoClose: 2000
  });

export const error = (message: string) =>
  toast.error(message, {
    position: 'top-right',
    autoClose: 2000
  });
