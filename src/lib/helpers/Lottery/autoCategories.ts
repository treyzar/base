// src/lib/recommendation/autoCategories.ts
import type { Lottery, PriceSegmentId } from '@/lib';

export interface PriceSegment {
  id: PriceSegmentId;
  label: string;
  min: number;
  max: number;
}

export interface AutoCategories {
  priceSegments: PriceSegment[];
}

/**
 * Строим 3 динамических ценовых сегмента на основе реальных данных.
 */
export const buildPriceSegments = (lotteries: Lottery[]): PriceSegment[] => {
  if (!lotteries || lotteries.length === 0) {
    return [];
  }

  const prices = lotteries
    .map((l) => Number(l.minPrice) || 0)
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);

  const min = prices[0];
  const max = prices[prices.length - 1];

  const idx1 = Math.floor(prices.length * 0.33);
  const idx2 = Math.floor(prices.length * 0.66);

  const b1 = prices[idx1];
  const b2 = prices[idx2];

  const segments: PriceSegment[] = [
    {
      id: 'price_cheap',
      label: `До ${b1} ₽`,
      min,
      max: b1,
    },
    {
      id: 'price_mid',
      label: `${b1}–${b2} ₽`,
      min: b1,
      max: b2,
    },
    {
      id: 'price_expensive',
      label: `От ${b2} до ${max} ₽`,
      min: b2,
      max,
    },
  ];

  return segments;
};

/**
 * Определяем, в какой ценовой сегмент попадает конкретный лот.
 */
export const getPriceSegmentId = (price: number, segments: PriceSegment[]): PriceSegmentId => {
  const safePrice = Number(price) || 0;

  // На всякий случай — если почему-то сегментов нет, считаем всё "серединой"
  if (!segments || segments.length === 0) {
    return 'price_mid';
  }

  // Ищем первый сегмент, в который попадает цена
  for (const seg of segments) {
    if (safePrice >= seg.min && safePrice <= seg.max) {
      return seg.id;
    }
  }

  // Fallback — если не попали никуда (из-за округлений)
  return segments[segments.length - 1].id;
};
