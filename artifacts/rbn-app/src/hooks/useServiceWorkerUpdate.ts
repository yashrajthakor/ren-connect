import { useEffect, useState } from 'react';

export const useServiceWorkerUpdate = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const onControllerChange = () => {
        setShowUpdatePrompt(false);
        setNewWorker(null);
      };

      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNewWorker(newWorker);
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      });

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      };
    }
    return undefined;
  }, []);

  const updateApp = () => {
    if (newWorker) {
      const onControllerChange = () => {
        window.location.reload();
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      };

      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdatePrompt(false);
      setNewWorker(null);
      return;
    }

    window.location.reload();
  };

  const dismissPrompt = () => {
    setShowUpdatePrompt(false);
    setNewWorker(null);
  };

  return {
    showUpdatePrompt,
    updateApp,
    dismissPrompt,
  };
};