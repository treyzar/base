// src/components/assistant/ui/QuickRecommendations.tsx
import React, { useCallback } from 'react';
import { useColorModeValue } from '@/components/ui/color-mode';
import {
  Stack,
  Heading,
  SimpleGrid,
  Text,
  Box,
  HStack,
  Badge,
  Button,
  Skeleton,
} from '@chakra-ui/react';
import type { Lottery } from '@/lib';

interface QuickRecommendationsProps {
  hasStartedQuestionnaire: boolean;
  setHasStartedQuestionnaire: (value: boolean) => void;
  lotteries: Lottery[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const QuickRecommendations: React.FC<QuickRecommendationsProps> = React.memo(
  ({
    hasStartedQuestionnaire,
    setHasStartedQuestionnaire,
    lotteries,
    isLoading,
    error,
    onRetry,
  }) => {
    // UI-стили из нового коммита
    const cardBg = useColorModeValue(
      'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
      '#000000'
    );
    const cardBorder = useColorModeValue('0', '#000000');
    const cardBorderWidth = useColorModeValue('0px', '1px');
    const cardShadow = useColorModeValue('sm', '0px 0px 10px rgba(255, 255, 255, 0.2)');

    const textColor = useColorModeValue('#000000', '#FFFFFF');
    const badgePriceBg = '#FFA500';
    const badgePriceColor = '#000000';
    const badgeRiskColor = '#000000';
    const badgeTypeBorder = '#671600';
    const badgeTypeColor = useColorModeValue('#000000', '#FFFFFF');
    const buttonBg = '#671600';
    const buttonColor = '#FFFFFF';

    const hasLotteries = lotteries && lotteries.length > 0;

    const handleStartQuestionnaire = useCallback(() => {
      if (!hasStartedQuestionnaire) {
        console.log('[QuickRecommendations] Клик по "Настроить под себя"');
        setHasStartedQuestionnaire(true);
      }
    }, [hasStartedQuestionnaire, setHasStartedQuestionnaire]);

    return (
      <Stack>
        <Heading size="md">Я нашёл несколько вариантов, с которых можно начать 👇</Heading>

        <Box>
          {isLoading && (
            <SimpleGrid columns={{ base: 1, md: 3 }} gap="10px">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Box
                  key={idx}
                  borderWidth={cardBorderWidth}
                  borderColor={cardBorder}
                  borderRadius="xl"
                  p={3}
                  bg={cardBg}
                  boxShadow={cardShadow}
                >
                  <Stack>
                    <Skeleton height="14px" width="70%" />
                    <Skeleton height="10px" width="90%" />
                    <Skeleton height="10px" width="80%" />
                    <HStack mt={1}>
                      <Skeleton height="18px" width="50px" />
                      <Skeleton height="18px" width="60px" />
                      <Skeleton height="18px" width="70px" />
                    </HStack>
                  </Stack>
                </Box>
              ))}
            </SimpleGrid>
          )}

          {!isLoading && error && (
            <Stack>
              <Text fontSize="15.12px" color="#FF4D4D">
                {error}
              </Text>
              <Text fontSize="15.12px" color={useColorModeValue('gray.600', 'gray.300')}>
                Можно попробовать ещё раз обновить список или перейти к умному подбору.
              </Text>
            </Stack>
          )}

          {!isLoading && !error && !hasLotteries && (
            <Text fontSize="15.12px" color={useColorModeValue('gray.600', 'gray.300')}>
              Пока нет быстрых вариантов — давай сразу перейдём к умному подбору или обновим список.
            </Text>
          )}

          {!isLoading && !error && hasLotteries && (
            <SimpleGrid columns={{ base: 1, md: 3 }} gap="10px">
              {lotteries.map((lottery) => (
                <Box
                  key={lottery.id}
                  borderWidth={cardBorderWidth}
                  borderColor={cardBorder}
                  borderRadius="xl"
                  p={3}
                  bg={cardBg}
                  boxShadow={cardShadow}
                >
                  <Stack>
                    <Heading size="md">{lottery.name}</Heading>

                    <HStack mt={1} wrap="wrap">
                      <Badge bg={badgePriceBg} color={badgePriceColor}>
                        {lottery.minPrice} ₽
                      </Badge>
                      <Badge
                        bg={
                          lottery.risk === 'low'
                            ? '#FFF42A'
                            : lottery.risk === 'medium'
                            ? '#FFA500'
                            : '#FF4D4D'
                        }
                        color={badgeRiskColor}
                      >
                        Риск: {lottery.risk}
                      </Badge>
                      <Badge
                        variant="outline"
                        fontSize="0.7rem"
                        borderColor={badgeTypeBorder}
                        color={badgeTypeColor}
                      >
                        {lottery.drawType === 'draw' ? 'Тиражная' : 'Моментальная'}
                      </Badge>
                    </HStack>

                    <Text fontSize="15.12px" color={textColor}>
                      {lottery.description}
                    </Text>
                  </Stack>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>

        <HStack justify="space-between" pt={2}>
          <Text fontSize="15.12px" color={textColor}>
            Если эти варианты не заходят — давай настроим подбор под тебя.
          </Text>
          <HStack>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('[QuickRecommendations] Клик по "Обновить"');
                onRetry();
              }}
              disabled={isLoading}
              borderRadius="full"
            >
              {isLoading ? 'Обновляется…' : 'Обновить'}
            </Button>
            <Button
              bg={buttonBg}
              color={buttonColor}
              size="sm"
              onClick={handleStartQuestionnaire}
              disabled={isLoading}
              borderRadius="full"
            >
              Настроить под себя
            </Button>
          </HStack>
        </HStack>
      </Stack>
    );
  }
);
