import { useEffect } from 'react';
import { AppRouter } from './router/AppRouter';
import { stolotoApi, type StolotoGame } from '@/lib';

const STORAGE_KEY = 'stoloto_lotteries_with_new';

type StoredLottery = StolotoGame & {
  isNew: boolean;
  new: boolean;
};

function getDrawNumber(lottery: StolotoGame | StoredLottery): number | null {
  if (lottery.completedDraw && typeof lottery.completedDraw.number === 'number') {
    return lottery.completedDraw.number;
  }

  if (lottery.draw && typeof lottery.draw.number === 'number') {
    return lottery.draw.number;
  }

  return null;
}

function readPreviousSnapshot(): StoredLottery[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as StoredLottery[];
  } catch (error) {
    console.error('Ошибка чтения лотерей из localStorage:', error);
    return [];
  }
}

function writeSnapshot(lotteries: StoredLottery[]): void {
  try {
    const raw = JSON.stringify(lotteries);
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch (error) {
    console.error('Ошибка сохранения лотерей в localStorage:', error);
  }
}

function buildSnapshot(currentLotteries: StolotoGame[]): StoredLottery[] {
  const previousSnapshot = readPreviousSnapshot();

  return currentLotteries.map((lottery) => {
    const currentNumber = getDrawNumber(lottery);

    const previousLottery = previousSnapshot.find((prev) => prev.name === lottery.name);
    const previousNumber = previousLottery ? getDrawNumber(previousLottery) : null;

    const isNew =
      previousLottery !== undefined &&
      previousNumber !== null &&
      currentNumber !== null &&
      currentNumber !== previousNumber;

    const storedLottery: StoredLottery = {
      ...lottery,
      isNew,
      new: isNew,
    };

    return storedLottery;
  });
}

function resetNewFlags(): void {
  const previousSnapshot = readPreviousSnapshot();
  if (!previousSnapshot.length) {
    return;
  }

  const updatedSnapshot: StoredLottery[] = previousSnapshot.map((lottery) => {
    return {
      ...lottery,
      isNew: false,
      new: false,
    };
  });

  writeSnapshot(updatedSnapshot);
}

// Специальная нормализация именно под /draws:
// 1) если это сразу массив — возвращаем как есть;
// 2) если это объект с полем result/draws — берём его;
// 3) если внутри объекта есть первое значение, которое является массивом
//    объектов с полем name — считаем это нашим массивом лотерей.
function normalizeDrawsResponse(data: unknown): StolotoGame[] {
  if (Array.isArray(data)) {
    return data as StolotoGame[];
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.result)) {
      return obj.result as StolotoGame[];
    }

    if (Array.isArray(obj.draws)) {
      return obj.draws as StolotoGame[];
    }

    for (const value of Object.values(obj)) {
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === 'object' &&
        value[0] !== null &&
        'name' in (value[0] as Record<string, unknown>)
      ) {
        return value as StolotoGame[];
      }
    }
  }

  return [];
}

function App() {
  useEffect(() => {
    let cancelled = false;

    async function initLotteries() {
      try {
        const drawsRaw = await stolotoApi.getDraws<unknown>();

        if (cancelled) {
          return;
        }

        const draws = normalizeDrawsResponse(drawsRaw);

        console.log('Ответ /draws (raw):', drawsRaw);
        console.log('Массив лотерей после нормализации:', draws);
        console.log('Количество лотерей:', draws.length);

        const snapshot: StoredLottery[] = buildSnapshot(draws);

        console.log('Снимок для localStorage:', snapshot);
        console.log('Количество элементов в снимке:', snapshot.length);

        writeSnapshot(snapshot);
      } catch (error) {
        console.error('Ошибка инициализации лотерей:', error);
      }
    }

    initLotteries();

    const handleBeforeUnload = () => {
      resetNewFlags();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      resetNewFlags();
    };
  }, []);

  return <AppRouter />;
}

export default App;
