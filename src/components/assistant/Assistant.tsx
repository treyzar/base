// src/components/assistant/Assistant.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Text, Stack, HStack, Badge, Spinner, Center } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';
import {
  type Profile,
  type Lottery,
  type StolotoGame,
  pageBg,
  chatBg,
  scoreLottery,
  stolotoApi,
  mapStolotoGamesToLotteries,
} from '@/lib';

import { ChatBubble } from '@/components/assistant/ui/ChatBubble';
import { ProfileWizard } from '@/components/assistant/ui/ProfileWizard';
import { QuickRecommendations } from '@/components/assistant/ui/QuickRecommendations';
import { ResultsBlock } from '@/components/assistant/ui/ResultBlock';
import { RefineWizard } from '@/components/assistant/ui/RefineWizard';
import { FinalBlock } from '@/components/assistant/ui/FinalBlock';

export const Assistant: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bestLotteries, setBestLotteries] = useState<Lottery[]>([]);
  const [finalLottery, setFinalLottery] = useState<Lottery | null>(null);

  const [hasStartedQuestionnaire, setHasStartedQuestionnaire] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const [hasRefine, setHasRefine] = useState(false);
  const [isRefineIntroLoading, setIsRefineIntroLoading] = useState(false);

  const [hasFinal, setHasFinal] = useState(false);
  const [isLoadingFinal, setIsLoadingFinal] = useState(false);

  const [stolotoGames, setStolotoGames] = useState<StolotoGame[]>([]);
  const [isStolotoLoading, setIsStolotoLoading] = useState(false);
  const [stolotoError, setStolotoError] = useState<string | null>(null);

  const messagesRef = useRef<HTMLDivElement | null>(null);

  // === Загрузка игр Stoloto ===
  useEffect(() => {
    const fetchDraws = async () => {
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

        console.log('Stoloto response:', response);

        if (response.requestStatus !== 'success') {
          setStolotoError('Не удалось получить данные Stoloto');
          setStolotoGames([]);
          return;
        }

        setStolotoGames(response.games);
      } catch (error) {
        console.error('Ошибка при запросе Stoloto:', error);
        setStolotoError('Ошибка при запросе Stoloto');
        setStolotoGames([]);
      } finally {
        setIsStolotoLoading(false);
      }
    };

    fetchDraws();
  }, []);

  // === Преобразование в Lottery ===
  const stolotoLotteries: Lottery[] = useMemo(() => {
    if (!stolotoGames || stolotoGames.length === 0) return [];
    return mapStolotoGamesToLotteries(stolotoGames);
  }, [stolotoGames]);

  // === Быстрые рекомендации (подсечка из списка) ===
  const quickLotteries: Lottery[] = useMemo(() => {
    if (stolotoLotteries.length === 0) return [];
    // можно выбрать, например, первые 6
    return stolotoLotteries.slice(0, 6);
  }, [stolotoLotteries]);

  // === Автоскролл ===
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

  // === Завершение анкеты профиля ===
  const handleProfileComplete = (p: Profile) => {
    setProfile(p);

    const sourceLotteries = stolotoLotteries;

    if (sourceLotteries.length === 0) {
      setBestLotteries([]);
      setHasResults(false);
      return;
    }

    const scored = [...sourceLotteries]
      .map((lottery) => ({
        lottery,
        score: scoreLottery(p, lottery),
      }))
      .sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 3).map((s) => s.lottery);
    setBestLotteries(top);

    setIsLoadingResults(true);
    setTimeout(() => {
      setIsLoadingResults(false);
      setHasResults(true);
    }, 800);
  };

  // === Переход к уточняющим вопросам ===
  const handleGoRefine = () => {
    if (hasRefine || isRefineIntroLoading || !profile || bestLotteries.length === 0) return;
    setIsRefineIntroLoading(true);
    setTimeout(() => {
      setIsRefineIntroLoading(false);
      setHasRefine(true);
    }, 700);
  };

  const handleFinalFromRefine = (lottery: Lottery) => {
    setIsLoadingFinal(true);
    setTimeout(() => {
      setFinalLottery(lottery);
      setHasFinal(true);
      setIsLoadingFinal(false);
    }, 800);
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

            {/* Быстрые рекомендации ИСКЛЮЧИТЕЛЬНО из Stoloto */}
            <ChatBubble role="assistant">
              <QuickRecommendations
                hasStartedQuestionnaire={hasStartedQuestionnaire}
                setHasStartedQuestionnaire={setHasStartedQuestionnaire}
                lotteries={quickLotteries}
                isLoading={isStolotoLoading}
                error={stolotoError}
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
                      setHasStartedQuestionnaire(false);
                      setProfile(null);
                      setBestLotteries([]);
                      setHasResults(false);
                      setHasRefine(false);
                      setHasFinal(false);
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
                    Давай уточним и выберем один лучший вариант из этих трёх.
                  </Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <Stack>
                    <Text fontSize="sm">
                      Окей, ещё несколько уточняющих вопросов — и выберем один лучший вариант.
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
                    <Spinner size="md" color="purple.400" mb={3} />
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Формирую финальную рекомендацию…
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
