import { Lottery } from '@/lib';
const STORAGE_KEY = 'stolotoDrawNumbers';

type DrawNumberMap = Record<string, number>;

function loadDrawNumberMap(): DrawNumberMap {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed as DrawNumberMap;
  } catch (e) {
    return {};
  }
}

function saveDrawNumberMap(map: DrawNumberMap): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = JSON.stringify(map);
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch (e) {
    // проглатываем, чтобы не ломать UI
  }
}

/**
 * На вход: лотереи с drawNumber
 * На выход: те же лотереи, но с корректным isNew,
 * а в localStorage — обновлённые номера тиражей.
 */
export const applyNewFlags = (lotteries: Lottery[]): Lottery[] => {
  const stored = loadDrawNumberMap();
  const updatedStored: DrawNumberMap = { ...stored };

  console.log('[applyNewFlags] stored before:', stored);

  const updatedLotteries = lotteries.map<Lottery>((lottery) => {
    const currentDrawNumber = lottery.drawNumber ?? null;

    console.log(
      '[applyNewFlags] lottery id:',
      lottery.id,
      'name:',
      lottery.name,
      'drawNumber:',
      currentDrawNumber
    );

    if (currentDrawNumber == null) {
      return {
        ...lottery,
        isNew: false,
      };
    }

    const prevDrawNumber = stored[lottery.id];
    const isNew =
      prevDrawNumber === undefined ||
      (typeof prevDrawNumber === 'number' && prevDrawNumber !== currentDrawNumber);

    updatedStored[lottery.id] = currentDrawNumber;

    return {
      ...lottery,
      isNew,
    };
  });

  console.log('[applyNewFlags] updatedStored before save:', updatedStored);
  saveDrawNumberMap(updatedStored);
  console.log(
    '[applyNewFlags] localStorage after save:',
    window.localStorage.getItem('stolotoDrawNumbers')
  );

  return updatedLotteries;
};
