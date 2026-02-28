// src/hooks/useModal.ts
import { useState, useCallback } from 'react';

export const useModal = <T = unknown>(initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((payload?: T) => {
    console.log('🔓 [useModal] open() appelé avec:', payload); // Debug
    setData(payload ?? null);
    setIsOpen(true); // ← C'est cette ligne qui doit changer l'état !
  }, []);

  const close = useCallback(() => {
    console.log('🔒 [useModal] close() appelé'); // Debug
    setIsOpen(false);
    setData(null);
  }, []);

  console.log('🔄 [useModal] render → isOpen:', isOpen, 'data:', data); // Debug

  return { isOpen, open, close, data };
};