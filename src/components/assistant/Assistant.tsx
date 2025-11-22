// src/components/assistant/Assistant.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Box, Text, Stack, HStack, Badge, Spinner, Center } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';
import {
  type Profile,
  type Lottery,
  type StolotoGame,
  pageBg,
  chatBg,
  stolotoApi,
  mapStolotoGamesToLotteries,
  recommendationApi,
  type UniversalProps,
  type UniversalPropsWithK,
  type BestOfHandlerRequest,
  type BestOfHandlerResponse,
} from '@/lib';

import { ChatBubble } from '@/components/assistant/ui/ChatBubble';
import { ProfileWizard } from '@/components/assistant/ui/ProfileWizard';
import { QuickRecommendations } from '@/components/assistant/ui/QuickRecommendations';
import { ResultsBlock } from '@/components/assistant/ui/ResultBlock';
import { RefineWizard, type RefineWeights } from '@/components/assistant/ui/RefineWizard';
import { FinalBlock } from '@/components/assistant/ui/FinalBlock';

export const Assistant: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);

  // Полный список лотерей, с которыми работаем после первой анкеты
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  console.log('[Assistant] Текущий массив lotteries:', lotteries);

  // Список лучших лотерей из /best_of ПОСЛЕ ПЕРВОЙ АНКЕТЫ
  // ВАЖНО: сюда кладём уже ОГРАНИЧЕННЫЙ массив длиной 4
  const [bestLotteries, setBestLotteries] = useState<Lottery[]>([]);

  // Финальная лотерея после второй анкеты — ровно одна
  const [finalLottery, setFinalLottery] = useState<Lottery | null>(null);

  const [hasStartedQuestionnaire, setHasStartedQuestionnaire] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const [hasRefine, setHasRefine] = useState(false);
  const [isRefineIntroLoading, setIsRefineIntroLoading] = useState(false);

  const [hasFinal, setHasFinal] = useState(false);
  const [isLoadingFinal, setIsLoadingFinal] = useState(false);

  // Быстрые рекомендации по Stoloto
  const [stolotoGames, setStolotoGames] = useState<StolotoGame[]>([]);
  const [isStolotoLoading, setIsStolotoLoading] = useState(false);
  const [stolotoError, setStolotoError] = useState<string | null>(null);

  const messagesRef = useRef<HTMLDivElement | null>(null);

  // === Загрузка игр Stoloto для быстрых рекомендаций (QuickRecommendations) ===
  const fetchDraws = useCallback(async () => {
    const requestId = Date.now();
    const startedAt = performance.now();

    console.groupCollapsed('[Assistant] [Stoloto] Старт запроса к backend (stolotoApi.getDraws)');
    console.log('[Assistant] [Stoloto] requestId:', requestId);
    console.log('[Assistant] [Stoloto] endpoint (обёртка):', 'stolotoApi.getDraws');
    console.log('[Assistant] [Stoloto] payload:', 'без тела, GET-запрос через stolotoApi');

    try {
      setIsStolotoLoading(true);
      setStolotoError(null);

      const response = await stolotoApi.getDraws<{
        games: StolotoGame[];
        walletActive: boolean;
        paymentsActive: boolean;
        guestShufflerTicketsEnabled: boolean;
        requestStatus: string;
        errors: unknown[];
      }>();

      const durationMs = performance.now() - startedAt;
      console.log('[Assistant] [Stoloto] raw response:', response);
      console.log('[Assistant] [Stoloto] durationMs:', durationMs.toFixed(2));

      if (response.requestStatus !== 'success') {
        console.warn(
          '[Assistant] [Stoloto] requestStatus !== "success", считаем запрос неуспешным',
          response.requestStatus
        );
        setStolotoError('Не удалось получить данные Stoloto');
        setStolotoGames([]);
        return;
      }

      console.log(
        '[Assistant] [Stoloto] Успешный ответ, количество игр:',
        response.games ? response.games.length : 0
      );
      setStolotoGames(response.games);
    } catch (error) {
      const durationMs = performance.now() - startedAt;
      console.error('[Assistant] [Stoloto] Ошибка при запросе Stoloto:', error);
      console.error('[Assistant] [Stoloto] durationMs (с ошибкой):', durationMs.toFixed(2));
      setStolotoError('Ошибка при запросе Stoloto');
      setStolotoGames([]);
    } finally {
      console.log('[Assistant] [Stoloto] Завершение запроса, финальные стейты:', {
        isStolotoLoading: false,
        stolotoError: stolotoError,
      });
      console.groupEnd();
      setIsStolotoLoading(false);
    }
  }, [stolotoError]);

  useEffect(() => {
    void fetchDraws();
  }, [fetchDraws]);

  // Stoloto → Lottery
  const stolotoLotteries: Lottery[] = useMemo(() => {
    if (!stolotoGames || stolotoGames.length === 0) return [];
    const mapped = mapStolotoGamesToLotteries(stolotoGames);
    console.log('[Assistant] Преобразование Stoloto -> Lottery', {
      stolotoGamesCount: stolotoGames.length,
      lotteriesCount: mapped.length,
    });
    return mapped;
  }, [stolotoGames]);

  const quickLotteries: Lottery[] = useMemo(() => {
    if (stolotoLotteries.length === 0) return [];
    const sliced = stolotoLotteries.slice(0, 6);
    console.log('[Assistant] Быстрые рекомендации (quickLotteries):', {
      totalStolotoLotteries: stolotoLotteries.length,
      quickLotteriesCount: sliced.length,
    });
    return sliced;
  }, [stolotoLotteries]);

  // Автоскролл
  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [
    hasStartedQuestionnaire,
    isLoadingResults,
    hasResults,
    hasRefine,
    hasFinal,
    isLoadingFinal,
    isRefineIntroLoading,
    profile,
    bestLotteries.length,
    stolotoLotteries.length,
  ]);

  const isInitial =
    !hasStartedQuestionnaire &&
    !isLoadingResults &&
    !hasResults &&
    !hasRefine &&
    !hasFinal &&
    !isRefineIntroLoading;

  // ========= МАППИНГ В ЧИСЛА ДЛЯ /best_of =========

  const mapRiskToBaseWinRate = (risk: Lottery['risk']): number => {
    if (risk === 'low') return 75;
    if (risk === 'medium') return 45;
    return 20;
  };

  const mapRiskToBaseWinSize = (risk: Lottery['risk']): number => {
    if (risk === 'low') return 150_000;
    if (risk === 'medium') return 800_000;
    return 3_000_000;
  };

  const normalizePrice = (price: number, minPrice: number, maxPrice: number): number => {
    if (!Number.isFinite(price)) {
      return 0.5;
    }
    if (maxPrice <= minPrice) {
      return 0.5;
    }
    return (price - minPrice) / (maxPrice - minPrice); // 0..1
  };

  const getDeterministicHash01 = (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return (hash % 1000) / 1000; // 0.000 .. 0.999
  };

  const mapLotteryToUniversalProps = (
    lottery: Lottery,
    minPrice: number,
    maxPrice: number
  ): UniversalProps => {
    const baseWinRate = mapRiskToBaseWinRate(lottery.risk);
    const baseWinSize = mapRiskToBaseWinSize(lottery.risk);
    const baseFrequency = lottery.drawType === 'instant' ? 1.0 : 1.0 / 7.0;

    const price = Number(lottery.minPrice) || 0;
    const priceNorm = normalizePrice(price, minPrice, maxPrice);

    const hash01 = getDeterministicHash01(lottery.id);

    const win_rate = baseWinRate * (0.9 + 0.25 * (1 - priceNorm)) * (0.95 + 0.1 * hash01);

    const win_size = baseWinSize * (0.7 + 0.8 * priceNorm) * (0.95 + 0.1 * (1 - hash01));

    const frequency = baseFrequency * (0.95 + 0.15 * (1 - priceNorm)) * (0.96 + 0.08 * hash01);

    const ticket_cost = price;

    return {
      name: lottery.name,
      win_rate,
      win_size,
      frequency,
      ticket_cost,
    };
  };

  const clampWeight = (value: number): number => {
    if (!Number.isFinite(value)) return 1;
    if (value < 0.5) return 0.5;
    if (value > 1.5) return 1.5;
    return value;
  };

  const mapProfileToDesired = (p: Profile, weights?: RefineWeights): UniversalPropsWithK => {
    const base = {
      win_rate_k: 1.0,
      win_size_k: 1.0,
      frequency_k: 1.0,
      ticket_cost_k: 1.0,
    };

    const merged = {
      ...base,
      ...(weights ?? {}),
    };

    return {
      name: 'user',
      win_rate: p.win_rate,
      win_size: p.win_size,
      frequency: p.frequency,
      ticket_cost: p.ticket_cost,
      win_rate_k: clampWeight(merged.win_rate_k),
      win_size_k: clampWeight(merged.win_size_k),
      frequency_k: clampWeight(merged.frequency_k),
      ticket_cost_k: clampWeight(merged.ticket_cost_k),
    };
  };

  /**
   * Вызываем /best_of и ВОЗВРАЩАЕМ РОВНО ПЕРВЫЕ `limit` лотерей
   * в том же порядке, что и в ответе бэкенда (по diff).
   */
  const callBestOf = async (
    p: Profile,
    sourceLotteries: Lottery[],
    weights?: RefineWeights,
    limit?: number
  ): Promise<Lottery[]> => {
    if (!sourceLotteries || sourceLotteries.length === 0) {
      console.warn(
        '[Assistant] [/best_of] Нет лотерей для BestOf, запрос к backend не выполняется'
      );
      return [];
    }

    const requestId = Date.now();
    const startedAt = performance.now();

    const desired = mapProfileToDesired(p, weights);

    const prices = sourceLotteries.map((l) => Number(l.minPrice) || 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const realValues: UniversalProps[] = sourceLotteries.map((lottery) =>
      mapLotteryToUniversalProps(lottery, minPrice, maxPrice)
    );

    const payload: BestOfHandlerRequest = {
      universal_props_with_k: desired,
      real_values: realValues,
      p,
    };

    console.groupCollapsed(
      '[Assistant] [/best_of] Старт запроса к backend (recommendationApi.bestOf)'
    );
    console.log('[Assistant] [/best_of] requestId:', requestId);
    console.log('[Assistant] [/best_of] payload.universal_props_with_k:', desired);
    console.log('[Assistant] [/best_of] payload.real_values.length:', realValues.length);
    console.log('[Assistant] [/best_of] пример первого real_value:', realValues[0]);
    console.log('[Assistant] [/best_of] payload.profile:', p);

    try {
      const response: BestOfHandlerResponse = await recommendationApi.bestOf(payload);

      const durationMs = performance.now() - startedAt;
      console.log('[Assistant] [/best_of] raw response:', response);
      console.log('[Assistant] [/best_of] durationMs:', durationMs.toFixed(2));

      // Бэкенд и так шлёт отсортированный список, но на всякий случай дублируем сортировку
      const sortedByDiff = [...response].sort((a, b) => a.diff - b.diff);

      // Мапа name -> Lottery, чтобы не терять порядок из sortedByDiff
      const byName = new Map<string, Lottery>();
      for (const lot of sourceLotteries) {
        byName.set(lot.name, lot);
      }

      const topLotteries: Lottery[] = [];
      for (const item of sortedByDiff) {
        const lot = byName.get(item.name);
        if (!lot) continue;
        topLotteries.push(lot);

        // ВАЖНО: режем массив по limit, чтобы получить первые N элементов
        if (typeof limit === 'number' && limit > 0 && topLotteries.length >= limit) {
          break;
        }
      }

      console.log('[Assistant] [/best_of] Итоговые topLotteries (с учётом limit):', {
        limit,
        count: topLotteries.length,
        names: topLotteries.map((l) => l.name),
      });

      console.groupEnd();
      return topLotteries;
    } catch (error) {
      const durationMs = performance.now() - startedAt;
      console.error('[Assistant] [/best_of] Ошибка при запросе /best_of:', error);
      console.error('[Assistant] [/best_of] durationMs (с ошибкой):', durationMs.toFixed(2));
      console.groupEnd();
      return [];
    }
  };

  // ========= Завершение первой анкеты профиля =========

  const handleProfileComplete = async (p: Profile) => {
    console.log('[Assistant] handleProfileComplete START, profile:', p);
    setProfile(p);

    const sourceLotteries = lotteries;

    console.log(
      '[Assistant] handleProfileComplete: количество лотерей для /best_of:',
      sourceLotteries.length
    );

    if (sourceLotteries.length === 0) {
      console.warn(
        '[Assistant] handleProfileComplete: lotteries пуст, /best_of вызываться не будет'
      );
      setBestLotteries([]);
      setHasResults(false);
      return;
    }

    setIsLoadingResults(true);
    setHasResults(false);

    try {
      // ПЕРВЫЙ вызов /best_of — без дополнительных весов (все K = 1)
      // И СРАЗУ ограничиваем результат: берём только ПЕРВЫЕ 4
      const top4 = await callBestOf(p, sourceLotteries, undefined, 4);
      console.log(
        '[Assistant] handleProfileComplete: результат /best_of, top4.length:',
        top4.length
      );

      // В стейте лежит МАССИВ ровно из 4 лотерей, в том же порядке, как пришли
      setBestLotteries(top4);
      setHasResults(true);
    } catch (error) {
      console.error('[Assistant] handleProfileComplete: Ошибка при запросе /best_of:', error);
      setBestLotteries([]);
      setHasResults(true);
    } finally {
      console.log('[Assistant] handleProfileComplete FINISH. Стейты:', {
        isLoadingResults: false,
        hasResults: true,
      });
      setIsLoadingResults(false);
    }
  };

  // Переход к уточняющим вопросам
  const handleGoRefine = () => {
    console.log('[Assistant] handleGoRefine вызван', {
      hasRefine,
      isRefineIntroLoading,
      hasBestLotteries: bestLotteries.length > 0,
      profileExists: !!profile,
    });

    if (hasRefine || isRefineIntroLoading || !profile || bestLotteries.length === 0) return;
    setIsRefineIntroLoading(true);
    setTimeout(() => {
      setIsRefineIntroLoading(false);
      setHasRefine(true);
    }, 700);
  };

  // Второй вызов /best_of — после второй анкеты, уже с весами пользователя
  const handleFinalFromRefine = async (weights: RefineWeights) => {
    console.log('[Assistant] handleFinalFromRefine. Получены веса:', weights);

    if (!profile) {
      console.warn('[Assistant] handleFinalFromRefine: profile отсутствует, выходим');
      return;
    }

    if (!lotteries || lotteries.length === 0) {
      console.warn(
        '[Assistant] handleFinalFromRefine: lotteries пуст, не можем повторно вызвать /best_of'
      );
      return;
    }

    setIsLoadingFinal(true);

    try {
      // Второй вызов /best_of — с весами К. Берём РОВНО ПЕРВУЮ лотерею.
      const refinedTop1 = await callBestOf(profile, lotteries, weights, 1);

      const final = refinedTop1[0] ?? bestLotteries[0] ?? lotteries[0];
      console.log(
        '[Assistant] handleFinalFromRefine. Финальная лотерея после /best_of (1 элемент):',
        final
      );

      setFinalLottery(final);
      setHasFinal(true);
    } catch (error) {
      console.error('[Assistant] handleFinalFromRefine: ошибка при повторном /best_of:', error);
    } finally {
      setIsLoadingFinal(false);
    }
  };

  return (
    <Box minH="100vh" bgGradient={pageBg()} py={4}>
      <Box
        maxW="5xl"
        minH="80vh"
        mx="auto"
        bg={chatBg()}
        borderRadius={{ base: '0', md: '3xl' }}
        borderWidth={{ base: '0', md: '1px' }}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        boxShadow={{ base: 'none', md: '2xl' }}
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Box
          px={{ base: 4, md: 6 }}
          py={3}
          borderBottomWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          bg={useColorModeValue('whiteAlpha.900', 'gray.900')}
          backdropFilter="blur(8px)"
        >
          <Stack>
            <Text fontSize="sm" fontWeight="semibold">
              Лотерейный ассистент
            </Text>
            <Text fontSize="xs" color="gray.500">
              Подберу лотерею под твой стиль игры
            </Text>
          </Stack>
          <HStack>
            <Box
              w={8}
              h={8}
              borderRadius="full"
              bgGradient="linear(to-br, blue.400, purple.500)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
              color="white"
              boxShadow="md"
            >
              🎲
            </Box>
            <Badge
              colorScheme="green"
              variant="subtle"
              fontSize="0.7rem"
              borderRadius="full"
              px={3}
              py={1}
            >
              online
            </Badge>
          </HStack>
        </Box>

        <Box
          ref={messagesRef}
          px={{ base: 3, md: 5 }}
          py={4}
          maxH="calc(100vh - 96px)"
          overflowY="auto"
        >
          <Stack>
            <ChatBubble role="assistant">
              <Stack>
                <Text>
                  Привет! 👋 Я помогу разобраться с лотереями: сначала покажу быстрые варианты, а
                  если не зайдут — настроим подбор под твой стиль игры.
                </Text>
                {isInitial && (
                  <Text fontSize="sm" color="gray.400">
                    Можешь сразу посмотреть варианты ниже или запустить умный подбор.
                  </Text>
                )}
              </Stack>
            </ChatBubble>

            {/* Быстрые рекомендации только из Stoloto */}
            <ChatBubble role="assistant">
              <QuickRecommendations
                hasStartedQuestionnaire={hasStartedQuestionnaire}
                setHasStartedQuestionnaire={setHasStartedQuestionnaire}
                lotteries={quickLotteries}
                isLoading={isStolotoLoading}
                error={stolotoError}
                onRetry={fetchDraws}
              />
            </ChatBubble>

            {hasStartedQuestionnaire && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="sm">Хочу настроить подбор под себя.</Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <ProfileWizard
                    onComplete={handleProfileComplete}
                    onCancel={() => {
                      console.log('[Assistant] ProfileWizard.onCancel вызван');
                      setHasStartedQuestionnaire(false);
                      setProfile(null);
                      setBestLotteries([]);
                      setHasResults(false);
                      setHasRefine(false);
                      setHasFinal(false);
                      setFinalLottery(null);
                    }}
                    onLotteriesChange={(nextLotteries) => {
                      console.log(
                        '[Assistant] ProfileWizard.onLotteriesChange, количество лотерей:',
                        nextLotteries.length
                      );
                      setLotteries(nextLotteries);
                    }}
                  />
                </ChatBubble>
              </>
            )}

            {isLoadingResults && (
              <ChatBubble role="assistant">
                <Box py={2}>
                  <Center flexDirection="column">
                    <Spinner size="md" color="blue.400" mb={3} />
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Анализирую твои ответы и подбираю лучшие варианты…
                    </Text>
                  </Center>
                </Box>
              </ChatBubble>
            )}

            {hasResults && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="sm">Готов увидеть рекомендации, что ты подобрал?</Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <ResultsBlock
                    profile={profile}
                    // ВАЖНО: здесь отдаём МАССИВ из 4 элементов, как вернул /best_of с limit=4
                    bestLotteries={bestLotteries}
                    onGoRefine={handleGoRefine}
                  />
                </ChatBubble>
              </>
            )}

            {isRefineIntroLoading && (
              <ChatBubble role="assistant">
                <Box py={2}>
                  <Center flexDirection="column">
                    <Spinner size="sm" color="purple.400" mb={2} />
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Секунду, уточняю детали по этим лотереям…
                    </Text>
                  </Center>
                </Box>
              </ChatBubble>
            )}

            {hasRefine && profile && bestLotteries.length > 0 && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="sm">
                    Давай уточним и выберем один лучший вариант с учётом того, что для меня важнее.
                  </Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <Stack>
                    <Text fontSize="sm">
                      Окей, ещё несколько уточняющих вопросов — и я пересчитаю подбор с учётом
                      важности параметров.
                    </Text>
                    <RefineWizard
                      // На уточнение также отдаём эти 4 лотереи
                      lotteries={bestLotteries}
                      profile={profile}
                      onComplete={handleFinalFromRefine}
                    />
                  </Stack>
                </ChatBubble>
              </>
            )}

            {isLoadingFinal && (
              <ChatBubble role="assistant">
                <Box py={2}>
                  <Center flexDirection="column">
                    <Spinner size="md" color="purple.400" mb={3} />
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Пересчитываю рекомендации с учётом твоих приоритетов…
                    </Text>
                  </Center>
                </Box>
              </ChatBubble>
            )}

            {hasFinal && finalLottery && profile && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="sm">
                    Хочу остановиться на одном варианте, покажи итоговую рекомендацию.
                  </Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <FinalBlock
                    profile={profile}
                    finalLottery={finalLottery}
                    setProfile={setProfile}
                    setBestLottery={setBestLotteries}
                    setFinalLottery={setFinalLottery}
                    setHasStartedQuestionnaire={setHasStartedQuestionnaire}
                    setIsLoadingResults={setIsLoadingResults}
                    setHasResults={setHasResults}
                    setHasRefine={setHasRefine}
                    setHasFinal={setHasFinal}
                    setIsLoadingFinal={setIsLoadingFinal}
                  />
                </ChatBubble>
              </>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};
