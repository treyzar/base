// src/pages/LotteriesPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Box, Heading, Text, Badge, Flex, SimpleGrid, Button } from '@chakra-ui/react';
import { type StolotoGame, stolotoApi } from '@/lib';

const STORAGE_KEY = 'stoloto_lotteries_with_new';

type StoredLottery = StolotoGame & {
  isNew: boolean;
  new: boolean;
};

type ActiveFilter = 'all' | 'active' | 'inactive';

type StolotoDrawsResponse = {
  games: StolotoGame[];
  walletActive: boolean;
  paymentsActive: boolean;
  guestShufflerTicketsEnabled: boolean;
  requestStatus: string;
  errors: unknown[];
};

function loadLotteriesFromStorage(): StoredLottery[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as StoredLottery[];
  } catch (error) {
    console.error('Ошибка чтения лотерей из localStorage:', error);
    return [];
  }
}

function saveLotteriesToStorage(lotteries: StoredLottery[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lotteries));
  } catch (error) {
    console.error('Ошибка сохранения лотерей в localStorage:', error);
  }
}

function getLastDrawInfo(lottery: StoredLottery) {
  const draw = lottery.completedDraw ?? lottery.draw ?? null;

  if (!draw) {
    return {
      number: null as number | null,
      date: null as number | null,
      totalPrize: null as number | null,
      superPrize: null as number | null,
    };
  }

  return {
    number: typeof draw.number === 'number' ? draw.number : null,
    date: typeof draw.date === 'number' ? draw.date : null,
    totalPrize: typeof draw.totalPrize === 'number' ? draw.totalPrize : null,
    superPrize: typeof draw.superPrize === 'number' ? draw.superPrize : null,
  };
}

function formatUnixDate(unixSeconds: number | null): string {
  if (unixSeconds === null) {
    return 'нет данных';
  }

  const date = new Date(unixSeconds * 1000);

  if (Number.isNaN(date.getTime())) {
    return 'некорректная дата';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Статус тиража: берём из completedDraw.status → draw.status
function getDrawStatus(lottery: StoredLottery): string {
  const fromCompleted =
    lottery.completedDraw && typeof (lottery.completedDraw as any).status === 'string'
      ? (lottery.completedDraw as any).status
      : null;

  if (fromCompleted) {
    return fromCompleted;
  }

  const fromDraw =
    lottery.draw && typeof (lottery.draw as any).status === 'string'
      ? (lottery.draw as any).status
      : null;

  if (fromDraw) {
    return fromDraw;
  }

  return 'нет данных';
}

// Маппинг статуса API → человекочитаемый текст
function mapStatusToLabel(status: string): string {
  if (!status) return 'нет данных';
  const upper = status.toUpperCase();

  if (upper === 'COMPLETED') return 'Завершён';
  if (upper === 'IN_PROGRESS') return 'В процессе';
  if (upper === 'PLANNED') return 'Запланирован';

  // новые статусы
  if (upper === 'WAITING') return 'Ожидание начала тиража';
  if (upper === 'PLAYING') return 'Тираж сейчас идёт';

  return status;
}

// Сливаем свежие игры с сервера с предыдущим состоянием (для поля new / isNew)
function mergeGamesWithPrevious(games: StolotoGame[], previous: StoredLottery[]): StoredLottery[] {
  const previousByName = new Map<string, StoredLottery>();
  for (const lot of previous) {
    if (lot && typeof lot.name === 'string') {
      previousByName.set(lot.name, lot);
    }
  }

  const result: StoredLottery[] = [];

  for (const game of games) {
    const name = game.name;
    if (!name) continue;

    const prev = previousByName.get(name) ?? null;

    const prevDraw = prev?.completedDraw ?? prev?.draw ?? null;
    const prevNumber = prevDraw && typeof prevDraw.number === 'number' ? prevDraw.number : null;

    const currentDraw = game.completedDraw ?? game.draw ?? null;
    const currentNumber =
      currentDraw && typeof currentDraw.number === 'number' ? currentDraw.number : null;

    let isNew = false;

    if (prev && prevNumber !== null && currentNumber !== null && currentNumber !== prevNumber) {
      isNew = true;
    }

    const stored: StoredLottery = {
      ...(game as StolotoGame),
      isNew,
      new: isNew,
    };

    result.push(stored);
  }

  return result;
}

// переход на страницу правил на stoloto.ru
function handleCardClick(lotteryName: string | undefined | null): void {
  if (!lotteryName) return;
  const trimmed = String(lotteryName).trim();
  if (!trimmed) return;

  const encodedName = encodeURIComponent(trimmed);
  const url = `https://www.stoloto.ru/${encodedName}/rules`;

  window.open(url, '_blank', 'noopener,noreferrer');
}

export function LotteriesPage() {
  const [lotteries, setLotteries] = useState<StoredLottery[]>([]);
  const [search, setSearch] = useState<string>('');
  const [onlyNew, setOnlyNew] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [isUpdating, setIsUpdating] = useState(false);

  // фильтр по сумме totalPrize
  const [minTotalPrize, setMinTotalPrize] = useState<string>('');
  const [maxTotalPrize, setMaxTotalPrize] = useState<string>('');

  useEffect(() => {
    const loaded = loadLotteriesFromStorage();
    setLotteries(loaded);
  }, []);

  const totalCount = lotteries.length;
  const newCount = useMemo(
    () => lotteries.filter((lottery) => lottery.new || lottery.isNew).length,
    [lotteries]
  );

  const handleReload = async () => {
    setIsUpdating(true);
    try {
      const previous = loadLotteriesFromStorage();
      const response = await stolotoApi.getDraws<StolotoDrawsResponse>();

      if (response.requestStatus !== 'success') {
        console.error('Stoloto API вернул неуспешный статус для обновления лотерей');
        setIsUpdating(false);
        return;
      }

      const games = Array.isArray(response.games) ? response.games : [];
      const merged = mergeGamesWithPrevious(games, previous);

      saveLotteriesToStorage(merged);
      setLotteries(merged);
    } catch (error) {
      console.error('Ошибка при обновлении лотерей из API:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredLotteries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const minPrize = minTotalPrize.trim() === '' ? null : Number.parseFloat(minTotalPrize.trim());
    const maxPrize = maxTotalPrize.trim() === '' ? null : Number.parseFloat(maxTotalPrize.trim());

    return lotteries.filter((lottery) => {
      const isNew = lottery.new || lottery.isNew;

      if (onlyNew && !isNew) {
        return false;
      }

      if (activeFilter === 'active' && !lottery.active) {
        return false;
      }

      if (activeFilter === 'inactive' && lottery.active) {
        return false;
      }

      if (normalizedSearch.length > 0) {
        const name = String(lottery.name ?? '').toLowerCase();
        if (!name.includes(normalizedSearch)) {
          return false;
        }
      }

      const lastDraw = getLastDrawInfo(lottery);
      const totalPrize = lastDraw.totalPrize;

      if (minPrize !== null && Number.isFinite(minPrize)) {
        if (totalPrize === null || totalPrize < minPrize) {
          return false;
        }
      }

      if (maxPrize !== null && Number.isFinite(maxPrize)) {
        if (totalPrize === null || totalPrize > maxPrize) {
          return false;
        }
      }

      return true;
    });
  }, [lotteries, search, onlyNew, activeFilter, minTotalPrize, maxTotalPrize]);

  return (
    <Box minH="100vh" bg="#101010" color="gray.50" px={6} py={6}>
      <Box maxW="1200px" mx="auto">
        <Heading as="h1" size="lg" mb={3} color="#FFD600">
          Лотереи Stoloto
        </Heading>

        <Text fontSize="sm" color="gray.400">
          Данные сохраняются в localStorage по ключу{' '}
          <Box
            as="span"
            px={2}
            py={0.5}
            borderRadius="md"
            bg="gray.800"
            borderWidth="1px"
            borderColor="gray.600"
          >
            {STORAGE_KEY}
          </Box>
          , но обновляются из API.
        </Text>

        <Flex mt={4} alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={3}>
          <Flex alignItems="center" gap={4}>
            <Box>
              <Text fontSize="xs" color="gray.400">
                Всего лотерей
              </Text>
              <Text fontSize="lg" color="#FFD600">
                {totalCount}
              </Text>
            </Box>

            <Box>
              <Text fontSize="xs" color="gray.400">
                Новых лотерей
              </Text>
              <Text fontSize="lg" color="#35C759">
                {newCount}
              </Text>
            </Box>
          </Flex>

          <Button
            size="sm"
            variant="outline"
            borderColor="#FFD600"
            color="#FFD600"
            _hover={{
              bg: '#FFD600',
              color: '#101010',
            }}
            onClick={() => {
              void handleReload();
            }}
            disabled={isUpdating}
          >
            {isUpdating ? 'Обновляю…' : 'Обновить из API'}
          </Button>
        </Flex>

        {/* Поиск + активность + "только новые" */}
        <Flex mt={5} alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={3}>
          <Box flex="1" minW="220px">
            <Text fontSize="xs" color="gray.400" mb={1}>
              Поиск по имени лотереи
            </Text>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Например, 6x45, ruslotto, bingo75..."
              style={{
                width: '100%',
                backgroundColor: '#181818',
                borderColor: '#4A5568',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: '4px',
                padding: '8px 10px',
                color: '#EDF2F7',
                fontSize: '14px',
              }}
            />
          </Box>

          <Flex alignItems="flex-end" gap={3} flexWrap="wrap">
            <Box>
              <Text fontSize="xs" color="gray.400" mb={1}>
                Активность
              </Text>
              <select
                value={activeFilter}
                onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
                style={{
                  backgroundColor: '#181818',
                  borderColor: '#4A5568',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  color: '#EDF2F7',
                  fontSize: '14px',
                  minWidth: '140px',
                }}
              >
                <option value="all">Все</option>
                <option value="active">Только активные</option>
                <option value="inactive">Только неактивные</option>
              </select>
            </Box>

            <Box>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#E2E8F0',
                }}
              >
                <input
                  type="checkbox"
                  checked={onlyNew}
                  onChange={(event) => setOnlyNew(event.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                  }}
                />
                <span>Только новые</span>
              </label>
            </Box>
          </Flex>
        </Flex>

        {/* Фильтр по сумме totalPrize */}
        <Box mt={4}>
          <Text fontSize="xs" color="gray.400" mb={1}>
            Фильтр по сумме общего призового фонда последнего тиража (totalPrize)
          </Text>
          <Flex gap={3} flexWrap="wrap" alignItems="center">
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                От, ₽
              </Text>
              <input
                type="number"
                value={minTotalPrize}
                onChange={(event) => setMinTotalPrize(event.target.value)}
                placeholder="Минимум"
                style={{
                  width: '140px',
                  backgroundColor: '#181818',
                  borderColor: '#4A5568',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  color: '#EDF2F7',
                  fontSize: '14px',
                }}
              />
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                До, ₽
              </Text>
              <input
                type="number"
                value={maxTotalPrize}
                onChange={(event) => setMaxTotalPrize(event.target.value)}
                placeholder="Максимум"
                style={{
                  width: '140px',
                  backgroundColor: '#181818',
                  borderColor: '#4A5568',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  color: '#EDF2F7',
                  fontSize: '14px',
                }}
              />
            </Box>
          </Flex>
        </Box>

        <Box mt={5} borderTopWidth="1px" borderColor="gray.800" />

        {lotteries.length === 0 && (
          <Box mt={6} borderWidth="1px" borderColor="gray.800" borderRadius="md" p={4} bg="#181818">
            <Text color="gray.300">
              В localStorage нет сохранённых лотерей. Зайди на основную страницу, чтобы
              инициализировать данные, либо нажми «Обновить из API».
            </Text>
          </Box>
        )}

        {lotteries.length > 0 && filteredLotteries.length === 0 && (
          <Box mt={6} borderWidth="1px" borderColor="gray.800" borderRadius="md" p={4} bg="#181818">
            <Text color="gray.300">
              По текущим условиям поиска и фильтрации лотерей не найдено.
            </Text>
          </Box>
        )}

        {filteredLotteries.length > 0 && (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4} mt={6}>
            {filteredLotteries.map((lottery) => {
              const lastDraw = getLastDrawInfo(lottery);
              const isNew = lottery.new || lottery.isNew;
              const rawStatus = getDrawStatus(lottery);
              const statusLabel = mapStatusToLabel(rawStatus);

              return (
                <Box
                  key={lottery.name}
                  borderWidth="1px"
                  borderColor={isNew ? '#35C759' : 'gray.800'}
                  borderRadius="lg"
                  p={4}
                  bg="#181818"
                  boxShadow="md"
                  cursor="pointer"
                  _hover={{
                    borderColor: '#FFD600',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.15s ease-out',
                  }}
                  onClick={() => handleCardClick(lottery.name)}
                >
                  <Flex alignItems="center" justifyContent="space-between" mb={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.400">
                        Имя лотереи
                      </Text>
                      <Text fontWeight="bold" fontSize="lg" color="#FFD600">
                        {lottery.name}
                      </Text>
                    </Box>

                    <Flex alignItems="center" gap={2}>
                      {isNew && (
                        <Badge
                          bg="#35C759"
                          color="#101010"
                          borderRadius="full"
                          px={3}
                          py={1}
                          textTransform="none"
                          fontSize="xs"
                        >
                          Новая
                        </Badge>
                      )}
                      <Badge
                        borderRadius="full"
                        px={3}
                        py={1}
                        textTransform="none"
                        fontSize="xs"
                        borderWidth="1px"
                        borderColor={lottery.active ? '#FFD600' : 'gray.500'}
                        color={lottery.active ? '#FFD600' : 'gray.400'}
                        bg="transparent"
                      >
                        {lottery.active ? 'Активна' : 'Не активна'}
                      </Badge>
                    </Flex>
                  </Flex>

                  <Box mb={3}>
                    <Text fontSize="sm" color="gray.400">
                      Номер последнего тиража
                    </Text>
                    <Text fontSize="md">
                      {lastDraw.number !== null ? lastDraw.number : 'нет данных'}
                    </Text>
                  </Box>

                  <Box mb={3}>
                    <Text fontSize="sm" color="gray.400">
                      Дата последнего тиража
                    </Text>
                    <Text fontSize="md">{formatUnixDate(lastDraw.date)}</Text>
                  </Box>

                  <Flex mb={3} gap={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.400">
                        Суперприз
                      </Text>
                      <Text fontSize="md">
                        {lastDraw.superPrize !== null ? lastDraw.superPrize : 'нет данных'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.400">
                        Общий призовой фонд
                      </Text>
                      <Text fontSize="md">
                        {lastDraw.totalPrize !== null ? lastDraw.totalPrize : 'нет данных'}
                      </Text>
                    </Box>
                  </Flex>

                  <Box mb={3}>
                    <Text fontSize="sm" color="gray.400">
                      Статус тиража
                    </Text>
                    <Text fontSize="md">{statusLabel}</Text>
                  </Box>

                  {'betCost' in lottery && (
                    <Box mb={1}>
                      <Text fontSize="sm" color="gray.400">
                        Стоимость ставки
                      </Text>
                      <Text fontSize="md">{(lottery as never)['betCost'] as number}</Text>
                    </Box>
                  )}
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
}

export default LotteriesPage;
