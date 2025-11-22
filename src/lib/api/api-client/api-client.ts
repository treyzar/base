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

  constructor(baseURL: string = import.meta.env.VITE_API_URL || '/') {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config) => config,
      (error: AxiosError) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError<ApiError>) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError<ApiError>): void {
    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          console.error('Неавторизован (401)', error.response.data);
          break;
        case 403:
          console.error('Доступ запрещен (403)');
          break;
        case 404:
          console.error('Ресурс не найден (404)');
          break;
        case 500:
          console.error('Ошибка сервера (500):', error.response.data);
          break;
        default:
          console.error(`Ошибка ${status}:`, error.response.data);
      }
    } else if (error.request) {
      console.error('Сервер не отвечает:', error.request);
    } else {
      console.error('Ошибка запроса:', error.message);
    }
  }

  async get<TResponse>(url: string, config?: AxiosRequestConfig): Promise<TResponse> {
    const response: AxiosResponse<TResponse> = await this.instance.get(url, config);
    return response.data;
  }

  async post<TResponse, TRequest = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const response: AxiosResponse<TResponse> = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<TResponse, TRequest = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const response: AxiosResponse<TResponse> = await this.instance.put(url, data, config);
    return response.data;
  }

  async patch<TResponse, TRequest = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const response: AxiosResponse<TResponse> = await this.instance.patch(url, data, config);
    return response.data;
  }

  async delete<TResponse = void>(url: string, config?: AxiosRequestConfig): Promise<TResponse> {
    const response: AxiosResponse<TResponse> = await this.instance.delete(url, config);
    return response.data;
  }

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

  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// =================== StolotoApi ===================

class StolotoApi {
  private client: ApiClient;

  constructor() {
    // Браузер: http://localhost:5173 + /stoloto/...
    // Vite proxy: /stoloto -> http://localhost:8080/api
    this.client = new ApiClient('/stoloto');
  }

  // /stoloto/draws/ -> proxy -> http://localhost:8080/api/draws/
  getDraws<TResponse>() {
    return this.client.get<TResponse>('draws/');
  }

  // /stoloto/draw/123 -> proxy -> http://localhost:8080/api/draw/123
  getDraw<TResponse>(id: string | number) {
    return this.client.get<TResponse>(`draw/${id}`);
  }

  // /stoloto/draw/latest -> proxy -> http://localhost:8080/api/draw/latest
  getLatestDraw<TResponse>() {
    return this.client.get<TResponse>('draw/latest');
  }
}

export const apiClient = new ApiClient();
export const stolotoApi = new StolotoApi();

export const api = {
  get: <TResponse>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<TResponse>(url, config),

  post: <TResponse, TRequest = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ) => apiClient.post<TResponse, TRequest>(url, data, config),

  put: <TResponse, TRequest = unknown>(url: string, data?: TRequest, config?: AxiosRequestConfig) =>
    apiClient.put<TResponse, TRequest>(url, data, config),

  patch: <TResponse, TRequest = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ) => apiClient.patch<TResponse, TRequest>(url, data, config),

  delete: <TResponse = void>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<TResponse>(url, config),

  upload: <TResponse>(url: string, formData: FormData, onUploadProgress?: UploadProgressCallback) =>
    apiClient.upload<TResponse>(url, formData, onUploadProgress),
};
