// src/components/assistant/ui/FinalBlock.tsx
import React from 'react';
import { useColorModeValue } from '@/components/ui/color-mode';
import { Stack, Heading, Box, HStack, Badge, Text, Button } from '@chakra-ui/react';
import type { FinalBlockProps, Profile, Lottery } from '@/lib';

const explainMatch = (profile: Profile, lottery: Lottery): string => {
  const parts: string[] = [];

  const budget = profile.budget as string | null;
  if (budget) {
    parts.push(
      `по бюджету: ты указал диапазон «${budget}», а билет здесь стоит примерно ${lottery.minPrice} ₽`
    );
  }

  const risk = profile.risk as string | null;
  if (risk) {
    const riskMap: Record<string, string> = {
      low: 'низкий риск',
      medium: 'средний риск',
      high: 'высокий риск',
    };
    parts.push(
      `по риску: ты выбрал «${riskMap[risk]}», и эта лотерея как раз про ${riskMap[lottery.risk]}`
    );
  }

  const drawType = profile.drawType as string | null;
  if (drawType && drawType !== 'any') {
    parts.push(
      `по типу розыгрыша: тебе ближе «${
        drawType === 'instant' ? 'моментальные' : 'тиражные'
      }» игры, и эта лотерея как раз такая`
    );
  }

  const format = profile.format as string | null;
  if (format && format !== 'any') {
    parts.push(
      `по формату: ты хочешь играть «${
        format === 'online' ? 'онлайн' : 'оффлайн'
      }», и эту лотерею удобно играть именно так`
    );
  }

  if (parts.length === 0) {
    return 'Эта лотерея в целом хорошо ложится на указанные тобой предпочтения.';
  }

  return parts.join('; ') + '.';
};

export const FinalBlock: React.FC<FinalBlockProps> = React.memo(
  ({
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
    // UI-стили из коммита
    const cardBg = useColorModeValue(
      'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
      '#000000'
    );
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

    if (!finalLottery || !profile) {
      console.warn('[FinalBlock] Нет финальной лотереи или профиля, блок скрыт');
      return null;
    }

    const handleRestartClick = () => {
      console.log('[FinalBlock] Клик по "Начать подбор заново"');
      setProfile(null);
      setBestLottery([]);
      setFinalLottery(null);
      setHasStartedQuestionnaire(false);
      setIsLoadingResults(false);
      setHasResults(false);
      setHasRefine(false);
      setHasFinal(false);
      setIsLoadingFinal(false);
    };

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
            <Badge bg={badgePriceBg} color={badgePriceColor}>
              {finalLottery.minPrice} ₽
            </Badge>
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
            <Badge
              variant="outline"
              borderColor={badgeTypeBorder}
              color={outlineColor}
              fontSize="0.7rem"
            >
              {finalLottery.drawType === 'draw' ? 'Тиражная' : 'Моментальная'}
            </Badge>
            <Badge
              variant="outline"
              borderColor={badgeTypeBorder}
              color={outlineColor}
              fontSize="0.7rem"
            >
              {finalLottery.format === 'online' ? 'Онлайн' : 'Оффлайн'}
            </Badge>
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
              <Text key={f} color={textColor}>
                • {f}
              </Text>
            ))}
          </Stack>
        </Box>

        <Button
          variant="solid"
          size="sm"
          alignSelf="flex-start"
          onClick={handleRestartClick}
          bg={buttonBg}
          color={buttonColor}
          borderRadius="full"
        >
          Начать подбор заново
        </Button>
      </Stack>
    );
  }
);
