import { useEffect, useRef } from 'react';
import { GAME_SETTINGS } from '../../config/settings';

/**
 * Hook personalizat pentru salvarea automată a progresului la intervalul specificat
 * @param saveFunction Funcția de salvare care va fi apelată
 * @param deps Dependențe pentru reactivarea hook-ului
 */
const useAutoSave = (
  saveFunction: () => Promise<void>,
  deps: any[] = []
) => {
  // Referință pentru a stoca ID-ul intervalului
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Configurăm intervalul pentru salvare automată
    intervalRef.current = setInterval(() => {
      saveFunction();
    }, GAME_SETTINGS.AUTOSAVE_INTERVAL);

    // Salvăm la prima încărcare
    saveFunction();

    // Curățăm intervalul la demontarea componentei
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, deps);

  // Metodă pentru a forța salvarea
  const forceSave = () => {
    saveFunction();
  };

  return { forceSave };
};

export default useAutoSave; 