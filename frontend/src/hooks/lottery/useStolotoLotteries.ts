// src/lib/useStolotoLotteries.ts
import { useEffect, useState } from 'react';
import { stolotoApi } from '@/lib'; // там, где у тебя создаётся StolotoApi
import { ApiLottery, LotteryWithNew } from '@/lib';
import {
  resetNewFlagsOnExit,
  mergeLotteriesWithNewFlag,
} from '@/lib/helpers/Lottery/stolotoLocalStorage';
export function useStolotoLotteries() {
  const [lotteries, setLotteries] = useState<LotteryWithNew[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLotteries() {
      setIsLoading(true);
      setError(null);

      try {
        const [drawsResponse, momentalResponse] = await Promise.all([
          stolotoApi.getDraws<ApiLottery[]>(),
          stolotoApi.getMomental<ApiLottery[]>(),
        ]);

        const combined: ApiLottery[] = [...drawsResponse, ...momentalResponse];

        const withNewFlag = mergeLotteriesWithNewFlag(combined);

        if (!cancelled) {
          setLotteries(withNewFlag);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadLotteries();

    const handleBeforeUnload = () => {
      resetNewFlagsOnExit();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      resetNewFlagsOnExit();
    };
  }, []);

  return {
    lotteries,
    isLoading,
    error,
  };
}
