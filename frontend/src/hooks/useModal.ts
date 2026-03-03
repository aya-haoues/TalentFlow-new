// src/hooks/useModal.ts
import { useState, useCallback } from 'react';

export const useModal = <T = unknown>(initialState = false) => {   
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((payload?: T) => {   //mode création / mode édition
    console.log('🔓 [useModal] open() appelé avec:', payload);  
    setData(payload ?? null);
    setIsOpen(true); 
  }, []);

  const close = useCallback(() => {
    console.log('🔒 [useModal] close() appelé'); // Debug
    setIsOpen(false);
    setData(null);
  }, []);

  console.log('🔄 [useModal] render → isOpen:', isOpen, 'data:', data); // Debug

  return { isOpen, open, close, data };
};