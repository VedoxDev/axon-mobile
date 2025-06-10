import { useState, useCallback } from 'react';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title?: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'error' | 'success' | 'warning' | 'info';
}

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertOptions & { visible: boolean }>({
    visible: false,
    message: '',
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertConfig({
      ...options,
      visible: true,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // Convenience methods for different alert types
  const showError = useCallback((message: string, title?: string, buttons?: AlertButton[]) => {
    showAlert({ type: 'error', title, message, buttons });
  }, [showAlert]);

  const showSuccess = useCallback((message: string, title?: string, buttons?: AlertButton[]) => {
    showAlert({ type: 'success', title, message, buttons });
  }, [showAlert]);

  const showWarning = useCallback((message: string, title?: string, buttons?: AlertButton[]) => {
    showAlert({ type: 'warning', title, message, buttons });
  }, [showAlert]);

  const showInfo = useCallback((message: string, title?: string, buttons?: AlertButton[]) => {
    showAlert({ type: 'info', title, message, buttons });
  }, [showAlert]);

  return {
    alertConfig,
    showAlert,
    hideAlert,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
}; 