/**
 * ============================================================================
 * ДОКУМЕНТАЦИЯ ПО СОЗДАНИЮ ENDPOINTS
 * ============================================================================
 *
 * Этот файл содержит все API endpoints приложения, организованные по группам.
 *
 * СТРУКТУРА:
 * 1. Сначала определяем типы данных (интерфейсы)
 * 2. Затем создаем группы endpoints (объекты с методами)
 * 3. В конце экспортируем все группы в одном объекте
 *
 * ПРАВИЛА ИМЕНОВАНИЯ:
 * - Типы: PascalCase (User, Product, LoginRequest)
 * - Группы endpoints: camelCase с суффиксом Api (authApi, userApi)
 * - Методы: camelCase глаголы (getAll, create, update, delete)
 *
 * ТИПИЗАЦИЯ:
 * - TResponse - тип данных, которые вернет API
 * - TRequest - тип данных, которые мы отправляем
 *
 * ============================================================================
 */
// Пример с импортами и экспортами
// import { api } from "./api-client";
// import type { IUser } from "../../types/interfaces";

// export const userApi = {
//   getAll: () => {
//     return api.get<IUser[]>(
//       "https://691785a021a96359486d2f43.mockapi.io/users"
//     );
//   },
// };

// export const endpoints = {
//   users: userApi,
// };
import { api } from './api-client';
