import { UploadProgressEvent } from './';
/**
 * Тип для колбэка прогресса
 */
export type UploadProgressCallback = (event: UploadProgressEvent) => void;

export type Answer = string | number | boolean | null;
export type Field =
  | 'style'
  | 'budget'
  | 'frequency'
  | 'ticket_cost'
  | 'transparency'
  | 'win_rate'
  | 'win_size'
  | 'motivation'
  | 'risk'
  | 'format'
  | 'drawType';

export type RiskLevel = 'low' | 'medium' | 'high';
export type DrawType = 'instant' | 'draw';
export type FormatType = 'online' | 'offline';
export type Profile = Record<Field, Answer>;
export type MicroField = 'pricePriority' | 'riskFeeling' | 'playRhythm';
export type PriceSegmentId = 'price_cheap' | 'price_mid' | 'price_expensive';
