import { useEffect, useRef } from 'react';
import { GAME_SETTINGS } from '../../config/settings';

/**
 * Hook personalizat pentru generarea de vizualizări pasive la intervalul specificat
 * @param addPassiveViews Funcția pentru adăugarea vizualizărilor pasive
 * @param passiveViews Numărul de vizualizări pasive per secundă
 */
const usePassiveIncome = (
  addPassiveViews: (amount: number) => void,
  passiveViews: number
) => {
  // Referință pentru a stoca ID-ul intervalului
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Dacă nu există vizualizări pasive, oprim intervalul
    if (passiveViews <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    
    // Curățăm orice interval existent înainte de a crea unul nou
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Dacă există vizualizări pasive, creăm un nou interval
    if (passiveViews > 0) {
      intervalRef.current = setInterval(() => {
        addPassiveViews(passiveViews);
      }, GAME_SETTINGS.PASSIVE_INTERVAL_MS);
    }

    // Curățăm intervalul la demontarea componentei
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [passiveViews, addPassiveViews]);
};

export default usePassiveIncome; 