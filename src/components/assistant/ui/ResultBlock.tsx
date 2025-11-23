// ResultBlock.tsx
import React from 'react';
import { useColorModeValue } from '@/components/ui/color-mode';
import { Stack, Heading, SimpleGrid, Box, HStack, Badge, Text, Button } from '@chakra-ui/react';
import { ResultsBlockProps, explainMatch } from '@/lib';

export const ResultsBlock: React.FC<ResultsBlockProps> = React.memo(({
  profile,
  bestLotteries,
  onGoRefine,
}) => {
  // Стили для карточек лотерей (легкий серый градиент, без рамки в светлой теме)
  const cardBg = useColorModeValue('linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)', '#000000');
  const cardBorder = useColorModeValue('0', '#000000');
  const cardBorderWidth = useColorModeValue('0px', '1px');
  const cardShadow = useColorModeValue('sm', '0px 0px 10px rgba(255, 255, 255, 0.2)');
  const textColor = useColorModeValue('#000000', '#FFFFFF');
  const outlineColor = useColorModeValue('#000000', '#FFFFFF');
  const badgePriceBg = '#FFA500';
  const badgePriceColor = '#000000';
  const badgeRiskColor = '#000000';
  const badgeTypeBorder = '#671600';
  const buttonBg = '#671600';
  const buttonColor = '#FFFFFF';

  if (!profile) return null;

  return (
    <Stack>
      <Heading size="md">По твоим ответам лучше всего подошли эти лотереи:</Heading>

      <SimpleGrid columns={{ base: 1, md: bestLotteries.length === 2 ? 2 : 3 }} gap="10px">
        {bestLotteries.map((lottery) => (
          <Box
            key={lottery.id}
            borderWidth={cardBorderWidth}
            borderColor={cardBorder}
            borderRadius="xl"
            p={4}
            bg={cardBg}
            boxShadow={cardShadow}
          >
            <Stack>
              <Heading size="md">{lottery.name}</Heading>
              <HStack>
                <Badge bg={badgePriceBg} color={badgePriceColor}>{lottery.minPrice} ₽</Badge>
                <Badge
                  bg={
                    lottery.risk === 'low' ? '#FFF42A' : lottery.risk === 'medium' ? '#FFA500' : '#FF4D4D'
                  }
                  color={badgeRiskColor}
                >
                  Риск: {lottery.risk}
                </Badge>
                <Badge variant="outline" fontSize="0.7rem" borderColor={badgeTypeBorder} color={outlineColor}>
                  {lottery.drawType === 'draw' ? 'Тиражная' : 'Моментальная'}
                </Badge>
              </HStack>
              <Text fontSize="15.12px" color={textColor}>
                {lottery.description}
              </Text>
              <Text fontSize="15.12px" color={textColor}>{explainMatch(profile, lottery)}</Text>

              <Box pt={1}>
                <Text fontSize="15.12px" color={textColor} mb={1}>
                  Особенности:
                </Text>
                <Stack fontSize="15.12px">
                  {lottery.features.map((f) => (
                    <Text key={f} color={textColor}>• {f}</Text>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>
        ))}
      </SimpleGrid>

      <HStack justify="space-between" pt={1}>
        <Text fontSize="15.12px" color={textColor}>
          Теперь ещё несколько уточняющих вопросов — и выберем один лучший вариант.
        </Text>
        <Button bg={buttonBg} color={buttonColor} size="sm" onClick={onGoRefine} borderRadius="full">
          Уточнить и выбрать один
        </Button>
      </HStack>
    </Stack>
  );
});