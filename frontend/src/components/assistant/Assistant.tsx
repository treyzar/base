// src/components/assistant/Assistant.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Box, Text, Stack, HStack, Badge, Spinner, Center, Button } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';
import {
  type Profile,
  type Lottery,
  type StolotoGame,
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
import { createPortal } from 'react-dom';

// ===================== COOKIE-ХЕЛПЕРЫ ДЛЯ СЧЁТЧИКА ВИЗИТОВ =====================

const VISIT_COOKIE_NAME = 'assistant_visit_count';

const getVisitCountFromCookie = (): number => {
  if (typeof document === 'undefined') {
    return 0;
  }

  const cookieString = document.cookie || '';
  const cookies = cookieString.split(';').map((c) => c.trim());

  for (const cookie of cookies) {
    if (cookie.startsWith(`${VISIT_COOKIE_NAME}=`)) {
      const value = cookie.substring(VISIT_COOKIE_NAME.length + 1);
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
      return 0;
    }
  }

  return 0;
};

const setVisitCountCookie = (count: number): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const safeCount = Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
  const maxAge = 60 * 60 * 24 * 365; // 1 год
  document.cookie = `${VISIT_COOKIE_NAME}=${safeCount}; path=/; max-age=${maxAge}`;
};

// ===================== ОНБОРДИНГ-МОДАЛКА (ТОЛЬКО КАРТОЧКА С ТЕКСТОМ) =====================

interface OnboardingStepInfo {
  id: string;
  title: string;
  text: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  step: OnboardingStepInfo | null;
  totalSteps: number;
  stepIndex: number;
  onSkip: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  step,
  totalSteps,
  stepIndex,
  onSkip,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [isOpen]);

  if (!isOpen || !step || typeof document === 'undefined') {
    return null;
  }

  const modalNode = (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(0, 0, 0, 0.7)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1400}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onSkip();
        }
      }}
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.22s ease-out',
      }}
    >
      <Box
        bg="#050505"
        color="#FFFFFF"
        borderRadius="28px"
        borderWidth="1px"
        borderColor="#FFD600"
        maxW="520px"
        w="90%"
        px={7}
        py={6}
        boxShadow="0 24px 80px rgba(0, 0, 0, 0.85)"
        position="relative"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'transform 0.22s ease-out',
          fontFamily:
            "'Montserrat', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <Button
          onClick={onSkip}
          size="xs"
          variant="ghost"
          bg="transparent"
          _hover={{ bg: 'rgba(255, 255, 255, 0.06)' }}
          borderRadius="full"
          position="absolute"
          top="10px"
          right="10px"
          minW="24px"
          h="24px"
          p={0}
        >
          ✕
        </Button>

        <HStack justifyContent="space-between" alignItems="center" mb={3}>
          <HStack alignItems="center">
            <Box
              w="40px"
              h="40px"
              borderRadius="full"
              bgGradient="linear(to-br, #FFD600, #FFA500)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="22px"
            >
              👀
            </Box>
            <Box>
              <Text fontSize="xl" fontWeight="bold" color="#FFD600">
                {step.title}
              </Text>
              <Text fontSize="xs" color="#CCCCCC">
                Шаг {stepIndex + 1} из {totalSteps}
              </Text>
            </Box>
          </HStack>

          <HStack justifyContent="flex-end">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <Box
                key={idx}
                w={idx === stepIndex ? '20px' : '8px'}
                h="8px"
                borderRadius="999px"
                bg={idx === stepIndex ? '#FFD600' : '#555555'}
                transition="all 0.18s ease-out"
              />
            ))}
          </HStack>
        </HStack>

        <Stack>
          <Text fontSize="lg" lineHeight="1.5">
            {step.text}
          </Text>

          <Text fontSize="xs" color="#AAAAAA" mt={2}>
            Блок, про который я сейчас рассказываю, подсвечен в интерфейсе на странице.
          </Text>

          <HStack justifyContent="flex-end" mt={4}>
            <Button
              size="sm"
              variant="ghost"
              borderRadius="full"
              color="#CCCCCC"
              onClick={onSkip}
              fontSize="sm"
            >
              Пропустить подсказки
            </Button>
          </HStack>
        </Stack>
      </Box>
    </Box>
  );

  return createPortal(modalNode, document.body);
};

// ===================== ТИПЫ ОТ STOLOTO =====================

type StolotoDrawsResponse = {
  games: StolotoGame[];
  walletActive: boolean;
  paymentsActive: boolean;
  guestShufflerTicketsEnabled: boolean;
  requestStatus: string;
  errors: unknown[];
};

// ===================== ОСНОВНОЙ КОМПОНЕНТ ASSISTANT =====================

export const Assistant: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);

  // Полный список лотерей после первой анкеты
  const [lotteries, setLotteries] = useState<Lottery[]>([]);

  // Лучшие лотереи из /best_of (после первой анкеты)
  const [bestLotteries, setBestLotteries] = useState<Lottery[]>([]);

  // Финальная лотерея после второй анкеты
  const [finalLottery, setFinalLottery] = useState<Lottery | null>(null);

  const [hasStartedQuestionnaire, setHasStartedQuestionnaire] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const [hasRefine, setHasRefine] = useState(false);
  const [isRefineIntroLoading, setIsRefineIntroLoading] = useState(false);

  const [hasFinal, setHasFinal] = useState(false);
  const [isLoadingFinal, setIsLoadingFinal] = useState(false);

  // Stoloto для быстрых рекомендаций
  const [stolotoGames, setStolotoGames] = useState<StolotoGame[]>([]);
  const [isStolotoLoading, setIsStolotoLoading] = useState(false);
  const [stolotoError, setStolotoError] = useState<string | null>(null);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const assistantRootRef = useRef<HTMLDivElement | null>(null);
  const quickBlockRef = useRef<HTMLDivElement | null>(null);
  const wizardBlockRef = useRef<HTMLDivElement | null>(null);

  // Счётчик визитов и состояние онбординга
  const [visitCount, setVisitCount] = useState(0);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStepIndex, setOnboardingStepIndex] = useState<number | null>(null);

  // Визуальные токены
  const chatSurfaceBg = useColorModeValue('rgba(255, 255, 255, 0.5)', 'rgba(0, 0, 0, 0.5)');
  const borderColor = useColorModeValue('gray.400', 'black');
  const textColor = useColorModeValue('#000000', '#FFFFFF');
  const badgeBg = '#FFF42A';
  const badgeColor = '#000000';
  const spinnerColorResults = '#FFA500';
  const spinnerColorRefine = '#671600';
  const spinnerColorFinal = '#671600';
  const containerShadow = useColorModeValue('none', '0px 0px 10px rgba(255, 255, 255, 0.2)');

  // Конфиг шагов онбординга (короткие, по одному предложению)
  const ONBOARDING_STEPS: OnboardingStepInfo[] = [
    {
      id: 'intro',
      title: 'Главный блок ассистента',
      text: 'Это основной блок ассистента, где мы будем переписываться и показывать подбор лотерей.',
    },
    {
      id: 'quick',
      title: 'Быстрые варианты',
      text: 'Здесь ассистент сразу показывает несколько готовых вариантов лотерей, с которых удобно начать.',
    },
    {
      id: 'start_button',
      title: 'Запуск умного подбора',
      text: 'Под карточками есть кнопка, которая запускает умный подбор лотерей по твоим ответам.',
    },
    {
      id: 'options',
      title: 'Варианты ответов в анкете',
      text: 'На каждом шаге анкеты ты видишь несколько крупных кнопок и выбираешь тот ответ, который ближе к тебе.',
    },
    {
      id: 'win_rate',
      title: 'Ползунок частоты выигрышей',
      text: 'Этот ползунок задаёт, как часто ты примерно хочешь выигрывать — просто подвигай его до комфортного значения.',
    },
    {
      id: 'win_size',
      title: 'Ползунок размера выигрыша',
      text: 'А этот ползунок задаёт примерный размер выигрышa, который тебя устраивает, — от меньших к более крупным суммам.',
    },
  ];

  const currentOnboardingStep =
    onboardingStepIndex !== null ? ONBOARDING_STEPS[onboardingStepIndex] : null;
  const currentStepId = currentOnboardingStep?.id ?? null;

  // Инициализация счётчика визитов и автозапуск онбординга при первом заходе
  useEffect(() => {
    const current = getVisitCountFromCookie();
    setVisitCount(current);
    setVisitCountCookie(current + 1);

    if (current === 0) {
      setIsOnboardingOpen(true);
      setOnboardingStepIndex(0);
    }
  }, []);

  // Автоматическая смена шагов онбординга каждые 5 секунд
  useEffect(() => {
    if (!isOnboardingOpen || onboardingStepIndex === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (onboardingStepIndex < ONBOARDING_STEPS.length - 1) {
        setOnboardingStepIndex(onboardingStepIndex + 1);
      } else {
        setIsOnboardingOpen(false);
        setOnboardingStepIndex(null);
      }
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOnboardingOpen, onboardingStepIndex, ONBOARDING_STEPS.length]);

  // Скролл к нужному блоку, когда меняется шаг онбординга
  useEffect(() => {
    if (!isOnboardingOpen || !currentStepId) {
      return;
    }

    let targetElement: HTMLDivElement | null = null;

    if (currentStepId === 'intro') {
      targetElement = assistantRootRef.current;
    } else if (currentStepId === 'quick' || currentStepId === 'start_button') {
      targetElement = quickBlockRef.current;
    } else if (
      currentStepId === 'options' ||
      currentStepId === 'win_rate' ||
      currentStepId === 'win_size'
    ) {
      targetElement = wizardBlockRef.current;
    }

    if (targetElement && messagesRef.current) {
      const parent = messagesRef.current;
      const parentRect = parent.getBoundingClientRect();
      const elRect = targetElement.getBoundingClientRect();
      const offset = elRect.top - parentRect.top - parent.clientHeight / 2 + elRect.height / 2;

      parent.scrollTo({
        top: parent.scrollTop + offset,
        behavior: 'smooth',
      });
    }
  }, [isOnboardingOpen, currentStepId]);

  // Загрузка игр Stoloto
  const fetchDraws = useCallback(async (): Promise<void> => {
    setIsStolotoLoading(true);
    setStolotoError(null);

    try {
      const response = await stolotoApi.getDraws<StolotoDrawsResponse>();

      if (response.requestStatus !== 'success') {
        setStolotoError('Не удалось получить данные Stoloto');
        setStolotoGames([]);
        return;
      }

      setStolotoGames(response.games ?? []);
    } catch {
      setStolotoError('Ошибка при запросе Stoloto');
      setStolotoGames([]);
    } finally {
      setIsStolotoLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDraws();
  }, [fetchDraws]);

  // Stoloto → Lottery
  const stolotoLotteries: Lottery[] = useMemo(() => {
    if (!stolotoGames || stolotoGames.length === 0) return [];
    return mapStolotoGamesToLotteries(stolotoGames);
  }, [stolotoGames]);

  // Быстрые рекомендации (6 штук)
  const quickLotteries: Lottery[] = useMemo(() => {
    if (stolotoLotteries.length === 0) return [];
    return stolotoLotteries.slice(0, 6);
  }, [stolotoLotteries]);

  // Автоскролл в конец при изменениях
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
    return (price - minPrice) / (maxPrice - minPrice);
  };

  const getDeterministicHash01 = (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return (hash % 1000) / 1000;
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
    const base: RefineWeights = {
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
      win_rate: p.win_rate ?? 45,
      win_size: p.win_size ?? 800_000,
      frequency: p.frequency ?? 1 / 7,
      ticket_cost: p.ticket_cost ?? 760,
      win_rate_k: clampWeight(merged.win_rate_k),
      win_size_k: clampWeight(merged.win_size_k),
      frequency_k: clampWeight(merged.frequency_k),
      ticket_cost_k: clampWeight(merged.ticket_cost_k),
    };
  };

  const callBestOf = async (
    p: Profile,
    sourceLotteries: Lottery[],
    weights?: RefineWeights,
    limit?: number
  ): Promise<Lottery[]> => {
    if (!sourceLotteries || sourceLotteries.length === 0) {
      return [];
    }

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

    try {
      const response: BestOfHandlerResponse = await recommendationApi.bestOf(payload);

      const sortedByDiff = [...response].sort((a, b) => a.diff - b.diff);

      const byName = new Map<string, Lottery>();
      for (const lot of sourceLotteries) {
        byName.set(lot.name, lot);
      }

      const topLotteries: Lottery[] = [];
      for (const item of sortedByDiff) {
        const lot = byName.get(item.name);
        if (!lot) continue;
        topLotteries.push(lot);

        if (typeof limit === 'number' && limit > 0 && topLotteries.length >= limit) {
          break;
        }
      }

      return topLotteries;
    } catch {
      return [];
    }
  };

  // Завершение первой анкеты
  const handleProfileComplete = async (p: Profile): Promise<void> => {
    setProfile(p);

    const sourceLotteries = lotteries;

    if (sourceLotteries.length === 0) {
      setBestLotteries([]);
      setHasResults(false);
      return;
    }

    setIsLoadingResults(true);
    setHasResults(false);

    try {
      const top4 = await callBestOf(p, sourceLotteries, undefined, 4);
      setBestLotteries(top4);
      setHasResults(true);
    } catch {
      setBestLotteries([]);
      setHasResults(true);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Переход к уточняющим вопросам
  const handleGoRefine = useCallback((): void => {
    if (hasRefine || isRefineIntroLoading || !profile || bestLotteries.length === 0) return;

    setIsRefineIntroLoading(true);
    setTimeout(() => {
      setIsRefineIntroLoading(false);
      setHasRefine(true);
    }, 700);
  }, [hasRefine, isRefineIntroLoading, profile, bestLotteries.length]);

  // Финальный /best_of после уточняющих вопросов
  const handleFinalFromRefine = async (weights: RefineWeights): Promise<void> => {
    if (!profile) {
      return;
    }

    if (!lotteries || lotteries.length === 0) {
      return;
    }

    setIsLoadingFinal(true);

    try {
      const refinedTop1 = await callBestOf(profile, lotteries, weights, 1);
      const final = refinedTop1[0] ?? bestLotteries[0] ?? lotteries[0];

      setFinalLottery(final);
      setHasFinal(true);
    } catch {
      // fallback уже реализован через ?? выше
    } finally {
      setIsLoadingFinal(false);
    }
  };

  const highlightAssistantRoot = isOnboardingOpen && currentStepId === 'intro';

  const highlightQuick =
    isOnboardingOpen && (currentStepId === 'quick' || currentStepId === 'start_button');

  const highlightWizard =
    isOnboardingOpen &&
    (currentStepId === 'options' || currentStepId === 'win_rate' || currentStepId === 'win_size');

  return (
    <Box bg="transparent" minH="90vh" display="flex" flexDirection="column" flex="1">
      <Box
        ref={assistantRootRef}
        data-tour-id="assistant-root"
        bg="black"
        backdropFilter="blur(10px)"
        borderRadius={{ base: '0', md: '3xl' }}
        borderWidth={{ base: '0', md: '1px' }}
        borderColor={highlightAssistantRoot ? '#FFD600' : borderColor}
        boxShadow={highlightAssistantRoot ? '0 0 30px rgba(255, 214, 0, 0.7)' : containerShadow}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        flex="1"
        h="100%"
        style={{
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
        }}
      >
        {/* Шапка с кнопкой показа подсказок */}
        <Box
          px={{ base: 4, md: 6 }}
          py={3}
          borderBottomWidth="1px"
          borderColor={borderColor}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          bg={chatSurfaceBg}
          backdropFilter="blur(8px)"
        >
          <Stack>
            <Text fontSize="sm" fontWeight="semibold" color={textColor}>
              Лотерейный ассистент
            </Text>
            <Text fontSize="xs" color={textColor}>
              Подберу лотерею под твой стиль игры
            </Text>
            {visitCount > 0 && (
              <Text fontSize="xs" color="gray.400">
                Твой визит: {visitCount + 1}
              </Text>
            )}
          </Stack>

          <HStack>
            <Button
              size="xs"
              borderRadius="full"
              variant="outline"
              borderColor="#FFD600"
              color="#FFD600"
              _hover={{ bg: '#FFD600', color: '#000000' }}
              onClick={() => {
                setIsOnboardingOpen(true);
                setOnboardingStepIndex(0);
              }}
            >
              Показать подсказки
            </Button>

            <Box
              w={8}
              h={8}
              borderRadius="full"
              bgGradient="linear(to-br, #FFA500, #671600)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
              color="#FFFFFF"
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
              bg={badgeBg}
              color={badgeColor}
            >
              online
            </Badge>
          </HStack>
        </Box>

        {/* Тело ассистента */}
        <Box ref={messagesRef} px={{ base: 3, md: 5 }} py={4} flexGrow={1} overflowY="auto">
          <Stack>
            <ChatBubble role="assistant">
              <Stack>
                <Text color={textColor} fontSize="17px">
                  Привет! 👋 Я помогу быстро подобрать лотерею под твой стиль игры.
                </Text>
                {isInitial && (
                  <Text fontSize="15.12px" color={textColor}>
                    Можешь начать с быстрых вариантов ниже или сразу запустить умный подбор.
                  </Text>
                )}
              </Stack>
            </ChatBubble>

            {/* Быстрые рекомендации только из Stoloto */}
            <ChatBubble role="assistant">
              <Box
                ref={quickBlockRef}
                borderWidth={highlightQuick ? '2px' : '0px'}
                borderColor={highlightQuick ? '#FFD600' : 'transparent'}
                borderRadius="xl"
                px={highlightQuick ? 2 : 0}
                py={highlightQuick ? 2 : 0}
                boxShadow={highlightQuick ? '0 0 26px rgba(255, 214, 0, 0.7)' : 'none'}
                style={{
                  transition: 'box-shadow 0.25s ease, border-color 0.25s ease, padding 0.25s ease',
                }}
              >
                <QuickRecommendations
                  hasStartedQuestionnaire={hasStartedQuestionnaire}
                  setHasStartedQuestionnaire={setHasStartedQuestionnaire}
                  lotteries={quickLotteries}
                  isLoading={isStolotoLoading}
                  error={stolotoError}
                  onRetry={() => {
                    void fetchDraws();
                  }}
                />
              </Box>
            </ChatBubble>

            {hasStartedQuestionnaire && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="15.12px" color={textColor}>
                    Хочу настроить подбор под себя.
                  </Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <Box
                    ref={wizardBlockRef}
                    borderWidth={highlightWizard ? '2px' : '0px'}
                    borderColor={highlightWizard ? '#FFD600' : 'transparent'}
                    borderRadius="xl"
                    px={highlightWizard ? 2 : 0}
                    py={highlightWizard ? 2 : 0}
                    boxShadow={highlightWizard ? '0 0 26px rgba(255, 214, 0, 0.7)' : 'none'}
                    style={{
                      transition:
                        'box-shadow 0.25s ease, border-color 0.25s ease, padding 0.25s ease',
                    }}
                  >
                    <ProfileWizard
                      onComplete={handleProfileComplete}
                      onCancel={() => {
                        setHasStartedQuestionnaire(false);
                        setProfile(null);
                        setBestLotteries([]);
                        setHasResults(false);
                        setHasRefine(false);
                        setHasFinal(false);
                        setFinalLottery(null);
                      }}
                      onLotteriesChange={(nextLotteries: Lottery[]) => {
                        setLotteries(nextLotteries);
                      }}
                    />
                  </Box>
                </ChatBubble>
              </>
            )}

            {isLoadingResults && (
              <ChatBubble role="assistant">
                <Box py={2}>
                  <Center flexDirection="column">
                    <Spinner size="md" color={spinnerColorResults} mb={3} />
                    <Text fontSize="15.12px" color={textColor} textAlign="center">
                      Анализирую твои ответы и подбираю лучшие варианты…
                    </Text>
                  </Center>
                </Box>
              </ChatBubble>
            )}

            {hasResults && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="15.12px" color={textColor}>
                    Готов увидеть рекомендации, что ты подобрал?
                  </Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <ResultsBlock
                    profile={profile}
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
                    <Spinner size="sm" color={spinnerColorRefine} mb={2} />
                    <Text fontSize="15.12px" color={textColor} textAlign="center">
                      Секунду, уточняю детали по этим лотереям…
                    </Text>
                  </Center>
                </Box>
              </ChatBubble>
            )}

            {hasRefine && profile && bestLotteries.length > 0 && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="15.12px" color={textColor}>
                    Давай уточним и выберем один лучший вариант с учётом того, что для меня важнее.
                  </Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <Stack>
                    <Text fontSize="15.12px" color={textColor}>
                      Ещё несколько вопросов — и я пересчитаю подбор с учётом твоих приоритетов.
                    </Text>
                    <RefineWizard
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
                    <Spinner size="md" color={spinnerColorFinal} mb={3} />
                    <Text fontSize="15.12px" color={textColor} textAlign="center">
                      Пересчитываю рекомендации с учётом твоих приоритетов…
                    </Text>
                  </Center>
                </Box>
              </ChatBubble>
            )}

            {hasFinal && finalLottery && profile && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="15.12px" color={textColor}>
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

      {/* Онбординг-тур с показом блоков интерфейса по 5 секунд */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        step={currentOnboardingStep}
        totalSteps={ONBOARDING_STEPS.length}
        stepIndex={onboardingStepIndex ?? 0}
        onSkip={() => {
          setIsOnboardingOpen(false);
          setOnboardingStepIndex(null);
        }}
      />
    </Box>
  );
};

export default Assistant;
