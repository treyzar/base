import type { RiskLevel, DrawType, FormatType, Field, Answer, Profile, MicroField } from './';
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
 * Колбэк для отслеживания прогресса загрузки
 */
export interface UploadProgressEvent {
  loaded: number;
  total?: number;
  progress: number; // 0-100
}

export interface Lottery {
  id: string;
  name: string;
  minPrice: number;
  risk: RiskLevel;
  drawType: DrawType;
  format: FormatType;
  description: string;
  features: string[];
}

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

export interface MicroAnswers {
  pricePriority: 'economy' | 'balance' | 'dontcare' | null;
  riskFeeling: 'avoid' | 'neutral' | 'seek' | null;
  playRhythm: 'often' | 'sometimes' | 'rare' | null;
}

export interface MicroStep {
  field: MicroField;
  title: string;
  options: { value: MicroAnswers[MicroField]; label: string }[];
}

export interface RefineWizardProps {
  lotteries: Lottery[];
  profile: Profile;
  onComplete: (finalLottery: Lottery) => void;
}

export interface ResultsBlockProps {
  profile: Profile | null;
  bestLotteries: Lottery[];
  onGoRefine: () => void;
}
export interface QuickRecommendationsProps {
  hasStartedQuestionnaire: boolean;
  setHasStartedQuestionnaire: (hasStartedQuestionnaire: boolean) => void;
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
export interface LayoutProps {
  children: React.ReactNode;
}

// src/lib/types/tipization/types.ts

export interface StolotoDraw {
  id: number;
  number: number;
  date: number; // unix timestamp (секунды)
  superPrize: number;
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

// src/lib/types/recommendation.ts

// Полностью соответствует Go-структуре UniversalProps
export interface UniversalProps {
  name: string;
  win_rate: number;
  win_size: number;
  frequency: number;
  ticket_cost: number;
}

// Полностью соответствует Go-структуре UniversalPropsWithK
export interface UniversalPropsWithK extends UniversalProps {
  win_rate_k: number;
  win_size_k: number;
  frequency_k: number;
  ticket_cost_k: number;
}

// Соответствует UniversalPropsWithCalcualtedDiffAndName
export interface UniversalPropsWithCalculatedDiffAndName {
  diff: number;
  name: string;
  universal_props: UniversalProps;
}

// Запрос к BestOfHandler
export interface BestOfHandlerRequest {
  universal_props_with_k: UniversalPropsWithK;
  real_values: UniversalProps[];
}

// Ответ от BestOfHandler (slice UniversalPropsWithCalculatedDiffAndName)
export type BestOfHandlerResponse = UniversalPropsWithCalculatedDiffAndName[];
