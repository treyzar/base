// src/lib/lotteryStorage.ts
import { ApiLottery, LotteryWithNew } from '@/lib/types';

const LOTTERY_STORAGE_KEY = 'stoloto_lotteries';

function getCurrentDrawNumber(lottery: ApiLottery | LotteryWithNew): number | null {
  if (lottery.completedDraw && typeof lottery.completedDraw.number === 'number') {
    return lottery.completedDraw.number;
  }
  if (lottery.draw && typeof lottery.draw.number === 'number') {
    return lottery.draw.number;
  }
  return null;
}

function loadPreviousNumbers(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(LOTTERY_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const stored: LotteryWithNew[] = JSON.parse(raw);
    const numbers: Record<string, number> = {};

    stored.forEach((lottery) => {
      const currentNumber = getCurrentDrawNumber(lottery);
      if (currentNumber !== null) {
        numbers[lottery.name] = currentNumber;
      }
    });

    return numbers;
  } catch (error) {
    console.error('Не удалось прочитать лотереи из localStorage', error);
    return {};
  }
}

function saveLotteriesToStorage(lotteries: LotteryWithNew[]): void {
  try {
    const raw = JSON.stringify(lotteries);
    window.localStorage.setItem(LOTTERY_STORAGE_KEY, raw);
  } catch (error) {
    console.error('Не удалось сохранить лотереи в localStorage', error);
  }
}

function resetNewFlagsInStorage(): void {
  try {
    const raw = window.localStorage.getItem(LOTTERY_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const stored: LotteryWithNew[] = JSON.parse(raw);
    const updated: LotteryWithNew[] = stored.map((lottery) => {
      return {
        ...lottery,
        isNew: false,
      };
    });

    const updatedRaw = JSON.stringify(updated);
    window.localStorage.setItem(LOTTERY_STORAGE_KEY, updatedRaw);
  } catch (error) {
    console.error('Не удалось сбросить флаг isNew в localStorage', error);
  }
}

export function mergeLotteriesWithNewFlag(apiLotteries: ApiLottery[]): LotteryWithNew[] {
  const previousNumbers = loadPreviousNumbers();

  const result: LotteryWithNew[] = apiLotteries.map((lottery) => {
    const currentNumber = getCurrentDrawNumber(lottery);
    const previousNumber = previousNumbers[lottery.name];

    const isNew =
      previousNumber !== undefined && currentNumber !== null && currentNumber !== previousNumber;

    const withFlag: LotteryWithNew = {
      ...lottery,
      isNew,
    };

    return withFlag;
  });

  saveLotteriesToStorage(result);

  return result;
}

export function resetNewFlagsOnExit(): void {
  resetNewFlagsInStorage();
}
