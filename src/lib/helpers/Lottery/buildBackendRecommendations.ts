// src/lib/recommendation/buildBackendRecommendations.ts
import type { Lottery } from '@/lib';
import {
  type PriceSegment,
  type PriceSegmentId,
  buildPriceSegments,
  getPriceSegmentId,
} from './autoCategories';

// Эти типы соответствуют Go-структурам с json-тегами
export interface BackendProp {
  field: string;
  allowed_values: string[];
}

export interface BackendLoteryPayload {
  name: string;
}

export interface BackendRecommendation {
  payload: BackendLoteryPayload;
  props: BackendProp[];
}

/**
 * Маппинг Lottery -> Recommendation (Go-модель), без ручного задания категорий.
 */
export const buildRecommendationsForBackend = (
  lotteries: Lottery[]
): {
  priceSegments: PriceSegment[];
  recommendations: BackendRecommendation[];
} => {
  const priceSegments = buildPriceSegments(lotteries);

  const recommendations: BackendRecommendation[] = lotteries.map((lottery) => {
    const priceSegmentId: PriceSegmentId = getPriceSegmentId(lottery.minPrice, priceSegments);

    const riskValue = lottery.risk; // "low" | "medium" | "high"
    const drawTypeValue = lottery.drawType; // "instant" | "draw"
    const formatValue = lottery.format; // "online" | "offline"

    const props: BackendProp[] = [
      {
        field: 'Type', // поле в UserForm (Go): Type Type `json:"type"`
        allowed_values: [priceSegmentId],
      },
      {
        field: 'Risk', // добавишь в UserForm поле Risk string `json:"risk"`
        allowed_values: [riskValue],
      },
      {
        field: 'DrawType', // добавишь в UserForm поле DrawType string `json:"draw_type"`
        allowed_values: [drawTypeValue],
      },
      {
        field: 'Format', // добавишь в UserForm поле Format string `json:"format"`
        allowed_values: [formatValue],
      },
    ];

    return {
      payload: {
        name: lottery.name,
      },
      props,
    };
  });

  return {
    priceSegments,
    recommendations,
  };
};
