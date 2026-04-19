import { toast } from 'sonner';

export type ToastOptions = {
  id?: string | number;
  duration?: number;
  [key: string]: any;
};

type PromiseData<T> = {
  loading: string;
  success: string;
  error: string;
};

export const useToast = () => {
  const showSuccess = (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: 5000,
      ...options
    });
  };

  const showError = (message: string, options?: ToastOptions) => {
    return toast.error(message, { 
      duration: 7000,
      ...options 
    });
  };

  const showInfo = (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      duration: 5000,
      ...options
    });
  };

  const showWarning = (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      duration: 5000,
      ...options
    });
  };

  const showLoading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, options);
  };

  const promiseToast = <T,>(
    promise: Promise<T> | (() => Promise<T>),
    messages: PromiseData<T>
  ) => {
    return toast.promise(promise, messages);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    promiseToast
  };
};

export default useToast;