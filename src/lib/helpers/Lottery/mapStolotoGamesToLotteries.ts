// src/lib/mapStolotoGamesToLotteries.ts
import type { Lottery, StolotoGame } from '@lib';

export const mapStolotoGamesToLotteries = (games: StolotoGame[]): Lottery[] =>
  games.map((game) => {
    const name = game.name || 'Без названия';

    const price = (game.draw as any)?.betCost ?? 0;

    let drawNumber: number | null = null;

    const rawCompleted = game.completedDraw?.number;
    const rawDraw = game.draw?.number;

    if (typeof rawCompleted === 'number') {
      drawNumber = rawCompleted;
    } else if (typeof rawCompleted === 'string' && !Number.isNaN(Number(rawCompleted))) {
      drawNumber = Number(rawCompleted);
    } else if (typeof rawDraw === 'number') {
      drawNumber = rawDraw;
    } else if (typeof rawDraw === 'string' && !Number.isNaN(Number(rawDraw))) {
      drawNumber = Number(rawDraw);
    }

    return {
      id: game.name,
      name,
      minPrice: price,
      risk: 'medium',
      drawType: 'draw',
      format: 'online',
      description: `Тиражная лотерея ${name}`,
      features: [],
      drawNumber,
      isNew: false,
    };
  });
