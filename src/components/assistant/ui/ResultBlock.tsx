// src/components/assistant/ui/ResultBlock.tsx
import React from 'react';
import { useColorModeValue } from '@/components/ui/color-mode';
import { Stack, Heading, SimpleGrid, Box, HStack, Badge, Text, Button } from '@chakra-ui/react';
import type { ResultsBlockProps } from '@/lib';

export const ResultsBlock: React.FC<ResultsBlockProps> = ({
  profile,
  bestLotteries,
  onGoRefine,
}) => {
  if (!profile) {
    console.warn('[ResultsBlock] profile отсутствует, блок не будет отображён');
    return null;
  }

  const cardBg = useColorModeValue('white', 'gray.900');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');

  const handleRefineClick = () => {
    console.log('[ResultsBlock] Клик по "Уточнить и выбрать один"');
    onGoRefine();
  };

  return (
    <Stack>
      <Heading size="sm">По твоим ответам лучше всего подошли эти лотереи:</Heading>

      <SimpleGrid
        columns={{
          base: 1,
          md: bestLotteries.length === 2 ? 2 : 2,
          xl: bestLotteries.length === 2 ? 2 : 3,
        }}
        gap="10px"
      >
        {bestLotteries.map((lottery) => (
          <Box
            key={lottery.id}
            borderWidth="1px"
            gap="15px"
            borderColor={cardBorder}
            borderRadius="xl"
            p={4}
            bg={cardBg}
            boxShadow="sm"
          >
            <Stack>
              <Heading size="xs">{lottery.name}</Heading>

              <HStack flexWrap="wrap" alignItems="center">
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
                <Badge variant="outline" fontSize="0.65rem">
                  {lottery.format === 'online' ? 'Онлайн' : 'Оффлайн'}
                </Badge>
              </HStack>

              <Text fontSize="xs" color="gray.500">
                {lottery.description}
              </Text>

              <Box pt={1}>
                <Text fontSize="0.65rem" color="gray.500" mb={1}>
                  Особенности:
                </Text>
                <Stack fontSize="0.7rem">
                  {lottery.features.map((f) => (
                    <Text key={f}>• {f}</Text>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>
        ))}
      </SimpleGrid>

      <HStack justify="space-between" pt={1}>
        <Text fontSize="sm" color="gray.500">
          Теперь ещё несколько уточняющих вопросов — и выберем один лучший вариант.
        </Text>
        <Button colorScheme="purple" size="sm" onClick={handleRefineClick}>
          Уточнить и выбрать один
        </Button>
      </HStack>
    </Stack>
  );
};
