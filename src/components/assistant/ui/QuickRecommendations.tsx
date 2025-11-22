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
  Spinner,
} from '@chakra-ui/react';
import type { Lottery } from '@lib';

interface QuickRecommendationsProps {
  hasStartedQuestionnaire: boolean;
  setHasStartedQuestionnaire: (value: boolean) => void;
  lotteries: Lottery[];
  isLoading: boolean;
  error?: string | null;
}

export const QuickRecommendations: React.FC<QuickRecommendationsProps> = ({
  hasStartedQuestionnaire,
  setHasStartedQuestionnaire,
  lotteries,
  isLoading,
  error,
}) => {
  const cardBg = useColorModeValue('white', 'gray.900');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');

  const handleStartQuestionnaire = () => {
    if (!hasStartedQuestionnaire) {
      setHasStartedQuestionnaire(true);
    }
  };

  if (isLoading) {
    return (
      <Stack align="center" py={2}>
        <Spinner size="sm" color="blue.400" />
        <Text fontSize="sm" color="gray.500">
          Подгружаю актуальные лотереи…
        </Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack>
        <Heading size="sm">Сейчас не получается подгрузить быстрые варианты</Heading>
        <Text fontSize="sm" color="red.400">
          {error}
        </Text>
        <Button
          colorScheme="blue"
          size="sm"
          onClick={handleStartQuestionnaire}
          alignSelf="flex-end"
        >
          Подобрать под меня
        </Button>
      </Stack>
    );
  }

  if (!lotteries || lotteries.length === 0) {
    return (
      <Stack>
        <Heading size="sm">Пока нет быстрых вариантов</Heading>
        <Text fontSize="sm" color="gray.500">
          Давай сразу перейдём к умному подбору.
        </Text>
        <Button
          colorScheme="blue"
          size="sm"
          onClick={handleStartQuestionnaire}
          alignSelf="flex-end"
        >
          Настроить под себя
        </Button>
      </Stack>
    );
  }

  return (
    <Stack>
      <Heading size="sm">Я нашёл несколько вариантов, с которых можно начать 👇</Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="10px">
        {lotteries.map((lottery) => (
          <Box
            key={lottery.id}
            borderWidth="1px"
            borderColor={cardBorder}
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
                <Badge colorScheme="blue">{lottery.minPrice} ₽</Badge>
                <Badge
                  colorScheme={
                    lottery.risk === 'low' ? 'green' : lottery.risk === 'medium' ? 'yellow' : 'red'
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

      <HStack justify="space-between" pt={2}>
        <Text fontSize="sm" color="gray.500">
          Если эти варианты не заходят — давай настроим подбор под тебя.
        </Text>
        <Button colorScheme="blue" size="sm" onClick={handleStartQuestionnaire}>
          Настроить под себя
        </Button>
      </HStack>
    </Stack>
  );
};
