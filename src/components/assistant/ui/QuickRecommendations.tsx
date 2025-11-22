// src/components/assistant/ui/QuickRecommendations.tsx
import React from 'react';
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

export const QuickRecommendations: React.FC<QuickRecommendationsProps> = ({
  hasStartedQuestionnaire,
  setHasStartedQuestionnaire,
  lotteries,
  isLoading,
  error,
  onRetry,
}) => {
  const cardBg = useColorModeValue('white', 'gray.900');

  const handleStartQuestionnaire = () => {
    console.log('[QuickRecommendations] Клик по "Настроить под себя"');
    if (!hasStartedQuestionnaire) {
      setHasStartedQuestionnaire(true);
    }
  };

  const hasLotteries = lotteries && lotteries.length > 0;

  return (
    <Stack>
      <Heading size="sm">Я нашёл несколько вариантов, с которых можно начать 👇</Heading>

      <Box>
        {isLoading && (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="10px">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Box
                key={idx}
                borderWidth="1px"
                borderColor="orange.300"
                borderRadius="xl"
                p={3}
                bg={cardBg}
                boxShadow="sm"
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
            <Text fontSize="sm" color="red.400">
              {error}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Можно попробовать ещё раз обновить список или перейти к умному подбору.
            </Text>
          </Stack>
        )}

        {!isLoading && !error && !hasLotteries && (
          <Text fontSize="sm" color="gray.500">
            Пока нет быстрых вариантов — давай сразу перейдём к умному подбору или обновим список.
          </Text>
        )}

        {!isLoading && !error && hasLotteries && (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="10px">
            {lotteries.map((lottery) => (
              <Box
                key={lottery.id}
                borderWidth="1px"
                borderColor="orange.300"
                borderRadius="xl"
                p={3}
                bg={cardBg}
                boxShadow="sm"
              >
                <Stack>
                  <Heading size="xs">{lottery.name}</Heading>
                  <Text fontSize="xs" color="gray.500">
                    {lottery.description}
                  </Text>
                  <HStack mt={1} wrap="wrap">
                    <Badge colorScheme="orange">{lottery.minPrice} ₽</Badge>
                    <Badge
                      colorScheme={
                        lottery.risk === 'low'
                          ? 'green'
                          : lottery.risk === 'medium'
                          ? 'yellow'
                          : 'red'
                      }
                    >
                      Риск: {lottery.risk}
                    </Badge>
                    <Badge variant="outline" fontSize="0.65rem">
                      {lottery.drawType === 'draw' ? 'Тиражная' : 'Моментальная'}
                    </Badge>
                  </HStack>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      <HStack justify="space-between" pt={2}>
        <Text fontSize="sm" color="gray.500">
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
          >
            {isLoading ? 'Обновляется…' : 'Обновить'}
          </Button>
          <Button
            colorScheme="orange"
            size="sm"
            onClick={handleStartQuestionnaire}
            disabled={isLoading}
          >
            Настроить под себя
          </Button>
        </HStack>
      </HStack>
    </Stack>
  );
};
