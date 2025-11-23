// src/lib/types/index.ts
import type React from 'react';

/* ========================================================================== */
/*                                 API БАЗА                                   */
/* ========================================================================== */

/**
 * Стандартный ответ от API
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

/**
 * Структура ошибки от API
 */
export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

/**
 * Событие прогресса загрузки
 */
export interface UploadProgressEvent {
  loaded: number;
  total?: number;
  progress: number; // 0-100
}

/**
 * Тип для колбэка прогресса
 */
export type UploadProgressCallback = (event: UploadProgressEvent) => void;

/* ========================================================================== */
/*                              АНКЕТА / ПРОФИЛЬ                              */
/* ========================================================================== */

/**
 * Уровень риска лотереи.
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Тип розыгрыша.
 */
export type DrawType = 'instant' | 'draw';

/**
 * Формат игры.
 */
export type FormatType = 'online' | 'offline' | 'any';

/**
 * Базовый тип ответа анкеты.
 */
export type Answer = string | number | boolean | null;

/**
 * Поля основной анкеты (ProfileWizard).
 */
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

/**
 * Стиль игры: моментальные, тиражные или любые.
 */
export type StylePreference = 'instant' | 'tirage' | 'any';

/**
 * Профиль пользователя, которым обмениваются Assistant,
 * ProfileWizard, /best_of и т.д.
 *
 * Числовые поля идут как number | null — ты их суммируешь
 * и отправляешь в /best_of.
 */
export interface Profile {
  /**
   * Стиль игры: моментальные, тиражные или "любые".
   */
  style: StylePreference | null;

  /**
   * Комфортный бюджет (радио-опции: "100–200 ₽", "200–500 ₽" и т.п.).
   */
  budget: Answer;

  /**
   * Частота игры — в твоей логике дальше идёт в frequency
   * как числовой параметр для /best_of.
   */
  frequency: number | null;

  /**
   * Примерная комфортная стоимость билета (слайдер).
   */
  ticket_cost: number | null;

  /**
   * Насколько важна прозрачность правил/механик.
   */
  transparency: Answer;

  /**
   * Желаемая частота выигрышей, %.
   */
  win_rate: number | null;

  /**
   * Желаемый размер выигрыша, ₽.
   */
  win_size: number | null;

  /**
   * Мотивация: "эмоции", "сорвать куш", "процесс" и т.п.
   */
  motivation: Answer;

  /**
   * Уровень риска.
   */
  risk: RiskLevel | null;

  /**
   * Предпочтительный формат (онлайн/оффлайн/любой).
   */
  format: FormatType | null;

  /**
   * Предпочитаемый тип розыгрыша.
   */
  drawType: DrawType | 'any' | null;
}

/* ========================================================================== */
/*                              МИКРО-АНКЕТА                                  */
/* ========================================================================== */

/**
 * Поля микро-анкеты (RefineWizard).
 */
export type MicroField = 'pricePriority' | 'riskFeeling' | 'playRhythm';

/**
 * Ответы микро-анкеты.
 */
export interface MicroAnswers {
  /**
   * Насколько важна цена билета относительно размера выигрыша.
   */
  pricePriority: 'economy' | 'balance' | 'premium' | null;

  /**
   * Отношение к риску.
   */
  riskFeeling: 'avoid' | 'neutral' | 'seek' | null;

  /**
   * Ритм игры — как часто человек планирует играть.
   */
  playRhythm: 'often' | 'sometimes' | 'rare' | null;
}

/**
 * Конфиг одного шага микро-анкеты.
 */
export interface MicroStep {
  field: MicroField;
  title: string;
  options: { value: MicroAnswers[MicroField]; label: string }[];
}

/* ========================================================================== */
/*                                   ЛОТЕРЕИ                                  */
/* ========================================================================== */

/**
 * Идентификатор ценового сегмента.
 */
export type PriceSegmentId = 'price_cheap' | 'price_mid' | 'price_expensive';

/**
 * Базовый тип лотереи, с которой работает ассистент.
 *
 * drawNumber / isNew помечены как опциональные, чтобы не ломать
 * места, где ты работаешь только с "чистыми" лотереями.
 */
export interface Lottery {
  id: string;
  name: string;
  minPrice: number;
  risk: RiskLevel;
  drawType: DrawType;
  format: FormatType;
  description: string;
  features: string[];

  /**
   * Номер текущего/последнего тиража (если есть).
   */
  drawNumber?: number | null;

  /**
   * Флаг "новой" лотереи относительно localStorage.
   */
  isNew?: boolean;
}

/* ========================================================================== */
/*                              ПРОПСЫ КОМПОНЕНТОВ                            */
/* ========================================================================== */

export interface StepConfig {
  field: Field;
  title: string;
  options: { value: Answer; label: string }[];
}

export interface ChatBubbleProps {
  role: 'assistant' | 'system' | 'user';
  children: React.ReactNode;
}

export interface ProfileWizardProps {
  onComplete: (profile: Profile) => void;
  onCancel: () => void;
  onLotteriesChange: (lotteries: Lottery[]) => void;
}

export interface ResultsBlockProps {
  profile: Profile | null;
  bestLotteries: Lottery[];
  onGoRefine: () => void;
}

export interface FinalBlockProps {
  profile: Profile;
  finalLottery: Lottery;
  setProfile: (profile: Profile | null) => void;
  setBestLottery: (lotteries: Lottery[]) => void;
  setFinalLottery: (lottery: Lottery | null) => void;
  setHasStartedQuestionnaire: (hasStarted: boolean) => void;
  setIsLoadingResults: (isLoading: boolean) => void;
  setHasResults: (hasResults: boolean) => void;
  setHasRefine: (hasRefine: boolean) => void;
  setHasFinal: (hasFinal: boolean) => void;
  setIsLoadingFinal: (isLoading: boolean) => void;
}

export interface QuickRecommendationsProps {
  hasStartedQuestionnaire: boolean;
  setHasStartedQuestionnaire: (hasStartedQuestionnaire: boolean) => void;
}

export interface LayoutProps {
  children: React.ReactNode;
}

/* ========================================================================== */
/*                              STOLOTO RAW TYPES                             */
/* ========================================================================== */

export interface StolotoDraw {
  id: number;
  number: number;
  date: number; // unix timestamp (секунды)
  superPrize: number;
  betCost?: number; // используется в мапперах
  jackpots?: unknown[];
}

export interface StolotoCompletedDraw {
  number: number;
  date: number; // unix timestamp
  totalPrize: number;
  superPrize: number;
  combination: Record<string, unknown>;
}

export interface StolotoGame {
  name: string;
  active: boolean;
  combinationsSelector: unknown[];
  mainCombinationsSelector: unknown[];
  maxBetSize: number;
  maxTicketCost: number;
  maxTicketCostVip: number;
  voice: string;
  yandexActive: boolean;
  yandexYookassacard: boolean;
  draw: StolotoDraw;
  completedDraw: StolotoCompletedDraw;
  nextDraw?: StolotoDraw;
}

export interface StolotoGamesResponse {
  games: StolotoGame[];
  walletActive: boolean;
  paymentsActive: boolean;
  guestShufflerTicketsEnabled: boolean;
  requestStatus: string;
  errors: unknown[];
}

/* ========================================================================== */
/*                       РЕКОМЕНДАТЕЛЬНЫЙ СЕРВИС (/best_of)                   */
/* ========================================================================== */

/**
 * Полностью соответствует Go-структуре UniversalProps.
 */
export interface UniversalProps {
  name: string;
  win_rate: number;
  win_size: number;
  frequency: number;
  ticket_cost: number;
}

/**
 * Полностью соответствует Go-структуре UniversalPropsWithK.
 */
export interface UniversalPropsWithK extends UniversalProps {
  win_rate_k: number;
  win_size_k: number;
  frequency_k: number;
  ticket_cost_k: number;
}

/**
 * Соответствует UniversalPropsWithCalculatedDiffAndName.
 */
export interface UniversalPropsWithCalculatedDiffAndName {
  diff: number;
  name: string;
  universal_props: UniversalProps;
}

/**
 * Запрос к BestOfHandler.
 * ВАЖНО: сюда добавлен p: Profile — как ты его реально отправляешь.
 */
export interface BestOfHandlerRequest {
  universal_props_with_k: UniversalPropsWithK;
  real_values: UniversalProps[];
  p: Profile;
}

/**
 * Ответ от BestOfHandler (slice UniversalPropsWithCalculatedDiffAndName).
 */
export type BestOfHandlerResponse = UniversalPropsWithCalculatedDiffAndName[];

/* ========================================================================== */
/*                       ЛОТЕРЕИ И localStorage (meta)                        */
/* ========================================================================== */

export interface ApiDrawInfo {
  number: number;
  date: number;
  totalPrize: number;
  superPrize: number;
}

export interface ApiLottery {
  name: string;
  active: boolean;
  completedDraw?: ApiDrawInfo;
  draw?: ApiDrawInfo;
}

/**
 * Лотерея с флагом "новая" (для витрины всех игр).
 */
export interface LotteryWithNew extends ApiLottery {
  isNew: boolean;
}
