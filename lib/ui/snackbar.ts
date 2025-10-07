import toast, { ToastOptions } from 'react-hot-toast';

const SHORT_SUCCESS_DURATION = 2000;

type SnackbarOptions = Omit<ToastOptions, 'duration'>;

export function showSuccess(message: string, options?: SnackbarOptions) {
  toast.success(message, {
    duration: SHORT_SUCCESS_DURATION,
    ...options,
  });
}
