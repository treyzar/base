// Assistant.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text, Stack, HStack, Badge, Spinner, Center } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';
import { type Profile, type Lottery, scoreLottery, MOCK_LOTTERIES } from '@/lib';

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

  const messagesRef = useRef<HTMLDivElement | null>(null);

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
  ]);

  const isInitial =
    !hasStartedQuestionnaire &&
    !isLoadingResults &&
    !hasResults &&
    !hasRefine &&
    !hasFinal &&
    !isRefineIntroLoading;

  const handleProfileComplete = useCallback((p: Profile) => {
    setProfile(p);

    const scored = [...MOCK_LOTTERIES]
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
  }, []);

  const handleGoRefine = useCallback(() => {
    if (hasRefine || isRefineIntroLoading || !profile || bestLotteries.length === 0) return;
    setIsRefineIntroLoading(true);
    setTimeout(() => {
      setIsRefineIntroLoading(false);
      setHasRefine(true);
    }, 700);
  }, [hasRefine, isRefineIntroLoading, profile, bestLotteries.length]);

  const handleFinalFromRefine = useCallback((lottery: Lottery) => {
    setIsLoadingFinal(true);
    setTimeout(() => {
      setFinalLottery(lottery);
      setHasFinal(true);
      setIsLoadingFinal(false);
    }, 800);
  }, []);

  const handleProfileCancel = useCallback(() => {
    setHasStartedQuestionnaire(false);
    setProfile(null);
    setBestLotteries([]);
    setHasResults(false);
    setHasRefine(false);
    setHasFinal(false);
  }, []);

  const chatBg = useColorModeValue('rgba(255, 255, 255, 0.5)', 'rgba(0, 0, 0, 0.5)'); 
  const borderColor = useColorModeValue('gray.400', 'black'); 
  const textColor = useColorModeValue('#000000', '#FFFFFF');
  const badgeBg = '#FFF42A';
  const badgeColor = '#000000';
  const spinnerColorResults = '#FFA500';
  const spinnerColorRefine = '#671600';
  const spinnerColorFinal = '#671600';

  // Белая тень со всех сторон для темной темы
  const containerShadow = useColorModeValue('none', '0px 0px 10px rgba(255, 255, 255, 0.2)');

  return (
    <Box 
      bg="transparent" 
      minH="90vh"
      display="flex" 
      flexDirection="column"
      flex="1"
    >
      <Box
        bg={chatBg} 
        backdropFilter="blur(10px)" 
        borderRadius={{ base: '0', md: '3xl' }}
        borderWidth={{ base: '0', md: '1px' }}
        borderColor={borderColor} 
        boxShadow={containerShadow}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        flex="1"
        h="100%"
      >
        <Box
          px={{ base: 4, md: 6 }}
          py={3}
          borderBottomWidth="1px"
          borderColor={borderColor}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          bg={chatBg} 
          backdropFilter="blur(8px)" 
        >
          <Stack>
            <Text fontSize="sm" fontWeight="semibold" color={textColor}>
              Лотерейный ассистент
            </Text>
            <Text fontSize="xs" color={textColor}>
              Подберу лотерею под твой стиль игры
            </Text>
          </Stack>
          <HStack>
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

        <Box
          ref={messagesRef}
          px={{ base: 3, md: 5 }}
          py={4}
          flexGrow={1}
          overflowY="auto"
        >
          <Stack>
            <ChatBubble role="assistant">
              <Stack>
                <Text color={textColor}>
                  Привет! 👋 Я помогу разобраться с лотереями: сначала покажу быстрые варианты, а
                  если не зайдут — настроим подбор под твой стиль игры.
                </Text>
                {isInitial && (
                  <Text fontSize="15.12px" color={textColor}>
                    Можешь сразу посмотреть варианты ниже или запустить умный подбор.
                  </Text>
                )}
              </Stack>
            </ChatBubble>

            <ChatBubble role="assistant">
              <QuickRecommendations
                hasStartedQuestionnaire={hasStartedQuestionnaire}
                setHasStartedQuestionnaire={setHasStartedQuestionnaire}
              />
            </ChatBubble>

            {hasStartedQuestionnaire && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="15.12px" color={textColor}>Хочу настроить подбор под себя.</Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <ProfileWizard
                    onComplete={handleProfileComplete}
                    onCancel={handleProfileCancel}
                  />
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
                  <Text fontSize="15.12px" color={textColor}>Готов увидеть рекомендации, что ты подобрал?</Text>
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
                    Давай уточним и выберем один лучший вариант из этих трёх.
                  </Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <Stack>
                    <Text fontSize="15.12px" color={textColor}>
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
                    <Spinner size="md" color={spinnerColorFinal} mb={3} />
                    <Text fontSize="15.12px" color={textColor} textAlign="center">
                      Формирую финальную рекомендацию…
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
    </Box>
  );
};