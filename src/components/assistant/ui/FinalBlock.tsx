// FinalBlock.tsx
import { useColorModeValue } from '@/components/ui/color-mode';
import { Stack, Heading, Box, HStack, Badge, Text, Button } from '@chakra-ui/react';
import { explainMatch, handleRestart, FinalBlockProps } from '@lib';
import React from 'react';

export const FinalBlock: React.FC<FinalBlockProps> = React.memo(({
  profile,
  finalLottery,
  setProfile,
  setBestLottery,
  setFinalLottery,
  setHasStartedQuestionnaire,
  setIsLoadingResults,
  setHasResults,
  setHasRefine,
  setHasFinal,
  setIsLoadingFinal,
}) => {
  // Стили для карточки лотереи (легкий серый градиент, без рамки в светлой теме)
  const cardBg = useColorModeValue('linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)', '#000000');
  const cardBorder = useColorModeValue('0', '#000000');
  const cardBorderWidth = useColorModeValue('0px', '1px');
  const cardShadow = useColorModeValue('lg', '0px 0px 10px rgba(255, 255, 255, 0.2)');
  
  const textColor = useColorModeValue('#000000', '#FFFFFF');
  const outlineColor = useColorModeValue('#000000', '#FFFFFF');
  const badgePriceBg = '#FFA500';
  const badgePriceColor = '#000000';
  const badgeRiskColor = '#000000';
  const badgeTypeBorder = '#671600';
  const buttonBg = '#671600';
  const buttonColor = '#FFFFFF';

  if (!finalLottery || !profile) return null;

  return (
    <Stack>
      <Heading size="md">С учётом всех ответов тебе больше всего подходит:</Heading>

      <Box
        borderWidth={cardBorderWidth}
        borderColor={cardBorder}
        borderRadius="2xl"
        p={5}
        bg={cardBg}
        boxShadow={cardShadow} 
      >
        <Heading size="lg" mb={2}>
          {finalLottery.name}
        </Heading>
        <HStack mb={3}>
          <Badge bg={badgePriceBg} color={badgePriceColor}>{finalLottery.minPrice} ₽</Badge>
          <Badge
            bg={
              finalLottery.risk === 'low'
                ? '#FFF42A'
                : finalLottery.risk === 'medium'
                ? '#FFA500'
                : '#FF4D4D'
            }
            color={badgeRiskColor}
          >
            Риск: {finalLottery.risk}
          </Badge>
          <Badge variant="outline" borderColor={badgeTypeBorder} color={outlineColor} fontSize="0.7rem">
            {finalLottery.drawType === 'draw' ? 'Тиражная' : 'Моментальная'}
          </Badge>
          <Badge variant="outline" borderColor={badgeTypeBorder} color={outlineColor} fontSize="0.7rem">{finalLottery.format === 'online' ? 'Онлайн' : 'Оффлайн'}</Badge>
        </HStack>

        <Text mb={3} color={textColor} fontSize="17.28px">
          {finalLottery.description}
        </Text>

        <Text fontSize="17.28px" fontWeight="semibold" mb={1} color={textColor}>
          Почему это подходит именно тебе:
        </Text>
        <Text fontSize="17.28px" mb={3} color={textColor}>
          {explainMatch(profile, finalLottery)}
        </Text>

        <Text fontSize="17.28px" color={textColor} mb={2}>
          Особенности:
        </Text>
        <Stack fontSize="17.28px">
          {finalLottery.features.map((f) => (
            <Text key={f} color={textColor}>• {f}</Text>
          ))}
        </Stack>
      </Box>

      <Button
        variant="solid"
        size="sm"
        alignSelf="flex-start"
        onClick={() =>
          handleRestart(
            setProfile,
            setBestLottery,
            setFinalLottery,
            setHasStartedQuestionnaire,
            setIsLoadingResults,
            setHasResults,
            setHasRefine,
            setHasFinal,
            setIsLoadingFinal
          )
        }
        bg={buttonBg}
        color={buttonColor}
        borderRadius="full"
      >
        Начать подбор заново
      </Button>
    </Stack>
  );
});