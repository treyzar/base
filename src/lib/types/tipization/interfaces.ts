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

export interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

export interface ImportMeta {
  readonly env: ImportMetaEnv;
}
