// src/lib/api/client.ts
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
} from 'axios';
import { ApiError, UploadProgressCallback } from '@lib';
class ApiClient {
  private instance: AxiosInstance;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || 'http://localhost:5173/') {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Настройка interceptors для обработки запросов и ответов
   */
  private setupInterceptors(): void {
    // Request interceptor - добавление токена к запросам
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - обработка ответов и ошибок
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError<ApiError>) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Централизованная обработка ошибок
   */
  private handleError(error: AxiosError<ApiError>): void {
    if (error.response) {
      // Сервер ответил с кодом ошибки
      const status = error.response.status;

      switch (status) {
        case 401:
          // Неавторизован - очищаем токен и редиректим
          this.removeAuthToken();
          window.location.href = '/login';
          break;

        case 403:
          console.error('Доступ запрещен');
          break;

        case 404:
          console.error('Ресурс не найден');
          break;

        case 500:
          console.error('Ошибка сервера:', error.response.data);
          break;

        default:
          console.error(`Ошибка ${status}:`, error.response.data);
      }
    } else if (error.request) {
      // Запрос был отправлен, но ответа не получено
      console.error('Сервер не отвечает:', error.request);
    } else {
      // Ошибка при настройке запроса
      console.error('Ошибка запроса:', error.message);
    }
  }

  /**
   * GET запрос
   * @param url - URL endpoint
   * @param config - Дополнительная конфигурация axios
   * @returns Promise с типизированными данными
   *
   * @example
   * const users = await apiClient.get<User[]>('/users');
   * const user = await apiClient.get<User>('/users/123');
   */
  async get<TResponse>(url: string, config?: AxiosRequestConfig): Promise<TResponse> {
    const response: AxiosResponse<TResponse> = await this.instance.get(url, config);
    return response.data;
  }

  /**
   * POST запрос
   * @param url - URL endpoint
   * @param data - Данные для отправки
   * @param config - Дополнительная конфигурация axios
   * @returns Promise с типизированными данными ответа
   *
   * @example
   * const newUser = await apiClient.post<User, CreateUserDto>('/users', {
   *   name: 'John',
   *   email: 'john@example.com'
   * });
   */
  async post<TResponse, TRequest = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const response: AxiosResponse<TResponse> = await this.instance.post(url, data, config);
    return response.data;
  }

  /**
   * PUT запрос (полная замена ресурса)
   * @param url - URL endpoint
   * @param data - Данные для замены
   * @param config - Дополнительная конфигурация axios
   * @returns Promise с типизированными данными ответа
   *
   * @example
   * const updatedUser = await apiClient.put<User, UpdateUserDto>('/users/123', {
   *   name: 'John Updated',
   *   email: 'john.new@example.com'
   * });
   */
  async put<TResponse, TRequest = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const response: AxiosResponse<TResponse> = await this.instance.put(url, data, config);
    return response.data;
  }

  /**
   * PATCH запрос (частичное обновление ресурса)
   * @param url - URL endpoint
   * @param data - Данные для частичного обновления
   * @param config - Дополнительная конфигурация axios
   * @returns Promise с типизированными данными ответа
   *
   * @example
   * const updatedUser = await apiClient.patch<User, Partial<User>>('/users/123', {
   *   name: 'New Name' // обновляем только имя
   * });
   */
  async patch<TResponse, TRequest = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const response: AxiosResponse<TResponse> = await this.instance.patch(url, data, config);
    return response.data;
  }

  /**
   * DELETE запрос
   * @param url - URL endpoint
   * @param config - Дополнительная конфигурация axios
   * @returns Promise с типизированными данными ответа (обычно void или статус)
   *
   * @example
   * await apiClient.delete<void>('/users/123');
   * // или с ответом
   * const result = await apiClient.delete<{ success: boolean }>('/users/123');
   */
  async delete<TResponse = void>(url: string, config?: AxiosRequestConfig): Promise<TResponse> {
    const response: AxiosResponse<TResponse> = await this.instance.delete(url, config);
    return response.data;
  }

  /**
   * Загрузка файлов (multipart/form-data)
   * @param url - URL endpoint
   * @param formData - FormData с файлами
   * @param onUploadProgress - Колбэк для отслеживания прогресса
   * @returns Promise с типизированными данными ответа
   *
   * @example
   * const formData = new FormData();
   * formData.append('avatar', file);
   *
   * const result = await apiClient.upload<{ url: string }>(
   *   '/users/123/avatar',
   *   formData,
   *   (event) => console.log(`Прогресс: ${event.progress}%`)
   * );
   */
  async upload<TResponse>(
    url: string,
    formData: FormData,
    onUploadProgress?: UploadProgressCallback
  ): Promise<TResponse> {
    const response: AxiosResponse<TResponse> = await this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            progress,
          });
        }
      },
    });
    return response.data;
  }

  /**
   * Получить экземпляр axios напрямую (для специальных случаев)
   * @returns AxiosInstance
   */
  getInstance(): AxiosInstance {
    return this.instance;
  }

  /**
   * Установить токен авторизации
   * @param token - JWT токен
   */
  setAuthToken(token: string): void {
    localStorage.setItem('token', token);
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Удалить токен авторизации
   */
  removeAuthToken(): void {
    localStorage.removeItem('token');
    delete this.instance.defaults.headers.common['Authorization'];
  }

  /**
   * Проверить наличие токена
   * @returns true если токен существует
   */
  hasAuthToken(): boolean {
    return !!localStorage.getItem('token');
  }
}

// Создаем единственный экземпляр API клиента
export const apiClient = new ApiClient();

/**
 * Упрощенный API для быстрого доступа к методам
 *
 * @example
 * import { api } from '@lib/api';
 *
 * const users = await api.get<User[]>('/users');
 * await api.post<User>('/users', { name: 'John' });
 */
export const api = {
  /**
   * GET запрос
   */
  get: <TResponse>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<TResponse>(url, config),

  /**
   * POST запрос
   */
  post: <TResponse, TRequest = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ) => apiClient.post<TResponse, TRequest>(url, data, config),

  /**
   * PUT запрос (полная замена)
   */
  put: <TResponse, TRequest = unknown>(url: string, data?: TRequest, config?: AxiosRequestConfig) =>
    apiClient.put<TResponse, TRequest>(url, data, config),

  /**
   * PATCH запрос (частичное обновление)
   */
  patch: <TResponse, TRequest = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ) => apiClient.patch<TResponse, TRequest>(url, data, config),

  /**
   * DELETE запрос
   */
  delete: <TResponse = void>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<TResponse>(url, config),

  /**
   * Загрузка файлов
   */
  upload: <TResponse>(url: string, formData: FormData, onUploadProgress?: UploadProgressCallback) =>
    apiClient.upload<TResponse>(url, formData, onUploadProgress),

  /**
   * Установить токен авторизации
   */
  setAuthToken: (token: string) => apiClient.setAuthToken(token),

  /**
   * Удалить токен авторизации
   */
  removeAuthToken: () => apiClient.removeAuthToken(),

  /**
   * Проверить наличие токена
   */
  hasAuthToken: () => apiClient.hasAuthToken(),
};
