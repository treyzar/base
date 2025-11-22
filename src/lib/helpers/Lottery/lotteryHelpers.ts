import { type Lottery, StolotoGame } from '@lib';

const formatPrize = (value: number): string => {
  if (!value || value <= 0) {
    return '0';
  }
  return value.toLocaleString('ru-RU');
};

// читаемые названия игр вместо "6x45"
const GAME_NAME_MAP: Record<string, string> = {
  '6x49': 'Спортлото «6 из 49»',
  '5x36': 'Спортлото «5 из 36»',
  '6x45': 'Спортлото «6 из 45»',
  '7x49': 'Спортлото «7 из 49»',
  bingo75: 'Бинго-75',
  ruslotto: 'Русское лото',
  udachanasdachu: 'Удача на сдачу',
  dvazhdydva: 'Проще, чем дважды два',
  '4x20': 'Спортлото «4 из 20»',
  'oxota-vyzov': 'Охота. Вызов',
  top3: 'Топ-3',
};

const getGameDisplayName = (code: string): string => {
  return GAME_NAME_MAP[code] ?? code;
};

export const mapStolotoGameToLottery = (game: StolotoGame): Lottery => {
  const displayName = getGameDisplayName(game.name);

  const superPrize =
    (game.draw && game.draw.superPrize) ||
    (game.completedDraw && game.completedDraw.superPrize) ||
    0;

  const lastDrawDate =
    game.completedDraw && game.completedDraw.date
      ? new Date(game.completedDraw.date * 1000).toLocaleDateString('ru-RU')
      : null;

  let risk: Lottery['risk'] = 'medium';
  if (superPrize >= 100_000_000) {
    risk = 'high';
  } else if (superPrize <= 10_000_000) {
    risk = 'low';
  }

  const minPrice = Math.min(game.maxTicketCostVip || game.maxTicketCost, game.maxTicketCost);

  const features: string[] = [];

  features.push(`Тираж №${game.draw.number}`);
  if (superPrize > 0) {
    features.push(`Суперприз: ${formatPrize(superPrize)} ₽`);
  }
  if (lastDrawDate) {
    features.push(`Прошлый тираж: ${lastDrawDate}`);
  }
  features.push(`Макс. ставка: ${formatPrize(game.maxBetSize)} ₽`);
  features.push(`Макс. стоимость билета: ${formatPrize(game.maxTicketCost)} ₽`);

  return {
    id: `${game.name}-${game.draw.id}`,
    name: displayName,
    description: `Тиражная лотерея ${displayName} с суперпризом до ${formatPrize(superPrize)} ₽.`,
    minPrice,
    risk,
    drawType: 'draw',
    format: 'online',
    features,
  };
};

// Маппер массива игр из Stoloto в массив Lottery
export const mapStolotoGamesToLotteries = (games: StolotoGame[]): Lottery[] => {
  return games.filter((game) => game.active).map((game) => mapStolotoGameToLottery(game));
};

// Универсальный извлекатель игр из ответа API
export const extractGames = (resp: unknown): unknown[] => {
  if (!resp) return [];

  // Случай, когда моментальный эндпоинт сразу возвращает массив
  if (Array.isArray(resp)) {
    return resp;
  }

  // Случай, когда данные лежат в поле games (как в /draws)
  if (typeof resp === 'object' && resp !== null && 'games' in resp) {
    const games = (resp as { games: unknown }).games;
    if (Array.isArray(games)) {
      return games;
    }
  }

  // Если формат другой — просто ничего не берём
  return [];
};
