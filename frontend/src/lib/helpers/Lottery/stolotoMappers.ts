// src/lib/stolotoMappers.ts
import type { Lottery, StolotoGame } from '@lib';

/**
 * Аккуратно достаём номер тиража.
 */
const extractDrawNumber = (game: StolotoGame): number | null => {
  const completedNumber = game.completedDraw?.number;
  const drawNumber = game.draw?.number;

  if (typeof completedNumber === 'number') {
    return completedNumber;
  }
  if (typeof completedNumber === 'string' && completedNumber.trim() !== '') {
    const parsed = Number(completedNumber);
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (typeof drawNumber === 'number') {
    return drawNumber;
  }
  if (typeof drawNumber === 'string' && drawNumber.trim() !== '') {
    const parsed = Number(drawNumber);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return null;
};

export const mapStolotoGamesToLotteries = (games: StolotoGame[]): Lottery[] =>
  games.map<Lottery>((game) => {
    const name = game.name || 'Без названия';

    // тут твоя логика формирования id, я подставляю пример:
    const id = `${game.name}-${game.draw?.id ?? 'noid'}`;

    const betCost = game.draw?.betCost ?? 0;
    const drawNumber = extractDrawNumber(game);

    return {
      id,
      name,
      minPrice: betCost,
      risk: 'medium',
      drawType: 'draw',
      format: 'online',
      description: `Тиражная лотерея ${name}`,
      features: [
        `Тираж №${drawNumber ?? '—'}`,
        game.completedDraw?.superPrize
          ? `Суперприз: ${game.completedDraw.superPrize} ₽`
          : 'Фиксированные призы',
      ],
      drawNumber,
      isNew: false,
    };
  });
