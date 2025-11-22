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

export const FinalBlock: React.FC<FinalBlockProps> = ({
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
  if (!finalLottery || !profile) {
    console.warn('[FinalBlock] Нет финальной лотереи или профиля, блок скрыт');
    return null;
  }

  const cardBg = useColorModeValue('white', 'gray.900');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');

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
      <Heading size="sm">С учётом всех ответов тебе больше всего подходит:</Heading>

      <Box
        borderWidth="1px"
        borderColor={cardBorder}
        borderRadius="2xl"
        p={5}
        bg={cardBg}
        boxShadow="lg"
      >
        <Heading size="md" mb={2}>
          {finalLottery.name}
        </Heading>
        <HStack mb={3}>
          <Badge colorScheme="blue">{finalLottery.minPrice} ₽</Badge>
          <Badge
            colorScheme={
              finalLottery.risk === 'low'
                ? 'green'
                : finalLottery.risk === 'medium'
                ? 'yellow'
                : 'red'
            }
          >
            Риск: {finalLottery.risk}
          </Badge>
          <Badge variant="outline">
            {finalLottery.drawType === 'draw' ? 'Тиражная' : 'Моментальная'}
          </Badge>
          <Badge variant="outline">{finalLottery.format === 'online' ? 'Онлайн' : 'Оффлайн'}</Badge>
        </HStack>

        <Text mb={3}>{finalLottery.description}</Text>

        <Text fontSize="sm" fontWeight="semibold" mb={1}>
          Почему это подходит именно тебе:
        </Text>
        <Text fontSize="sm" mb={3}>
          {explainMatch(profile, finalLottery)}
        </Text>

        <Text fontSize="sm" color="gray.500" mb={2}>
          Особенности:
        </Text>
        <Stack fontSize="sm">
          {finalLottery.features.map((f) => (
            <Text key={f}>• {f}</Text>
          ))}
        </Stack>
      </Box>

      <Button variant="outline" size="sm" alignSelf="flex-start" onClick={handleRestartClick}>
        Начать подбор заново
      </Button>
    </Stack>
  );
};
