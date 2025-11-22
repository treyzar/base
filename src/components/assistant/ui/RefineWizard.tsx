// src/components/assistant/ui/RefineWizard.tsx
import { useState } from 'react';
import {
  type MicroAnswers,
  MICRO_STEPS,
  type MicroField,
  type Lottery,
  type Profile,
  type RiskLevel,
} from '@lib';
import { Stack, Box, HStack, Text, Button, Heading } from '@chakra-ui/react';
import { Progress } from '@chakra-ui/react';

// Веса важности, которые пойдут на /best_of
export interface RefineWeights {
  win_rate_k: number;
  win_size_k: number;
  frequency_k: number;
  ticket_cost_k: number;
}

interface RefineWizardProps {
  lotteries: Lottery[];
  profile: Profile;
  onComplete: (weights: RefineWeights) => void;
}

const scoreLottery = (profile: Profile, lottery: Lottery): number => {
  let score = 0;

  const budget = profile.budget as string | null;
  if (budget) {
    if (budget === '0-100' && lottery.minPrice <= 100) score += 2;
    if (budget === '100-200' && lottery.minPrice >= 100 && lottery.minPrice <= 200) score += 2;
    if (budget === '200-500' && lottery.minPrice >= 200 && lottery.minPrice <= 500) score += 2;
    if (budget === '500+' && lottery.minPrice >= 500) score += 2;
  }

  const risk = profile.risk as RiskLevel | null;
  if (risk) {
    if (risk === lottery.risk) score += 3;
    if (risk === 'medium' && lottery.risk !== 'medium') score += 1;
  }

  const drawPref = profile.drawType as string | null;
  if (drawPref && drawPref !== 'any') {
    if (drawPref === lottery.drawType) score += 2;
  }

  const formatPref = profile.format as string | null;
  if (formatPref && formatPref !== 'any') {
    if (formatPref === lottery.format) score += 2;
  }

  const style = profile.style as string | null;
  if (style) {
    if (style === 'frequent_small' && lottery.risk === 'low') score += 2;
    if (style === 'big_jackpot' && lottery.risk === 'high') score += 2;
    if (style === 'instant' && lottery.drawType === 'instant') score += 3;
    if (style === 'balanced' && lottery.risk === 'medium') score += 2;
  }

  return score;
};

// Фронтовый скорер пока оставляем — вдруг пригодится локально подсвечивать варианты
const chooseFinalLottery = (
  lotteries: Lottery[],
  profile: Profile,
  answers: MicroAnswers
): Lottery => {
  const baseScores = lotteries.map((lottery) => ({
    lottery,
    base: scoreLottery(profile, lottery),
  }));

  const scored = baseScores.map((entry) => {
    let bonus = 0;

    if (answers.pricePriority === 'economy') {
      const minPrice = Math.min(...lotteries.map((l) => l.minPrice));
      if (entry.lottery.minPrice === minPrice) bonus += 3;
    } else if (answers.pricePriority === 'balance') {
      const avgPrice = lotteries.reduce((sum, l) => sum + l.minPrice, 0) / lotteries.length;
      const diff = Math.abs(entry.lottery.minPrice - avgPrice);
      if (diff <= 30) bonus += 2;
    }

    if (answers.riskFeeling === 'avoid') {
      if (entry.lottery.risk === 'low') bonus += 3;
      if (entry.lottery.risk === 'medium') bonus += 1;
    } else if (answers.riskFeeling === 'neutral') {
      if (entry.lottery.risk === 'medium') bonus += 2;
    } else if (answers.riskFeeling === 'seek') {
      if (entry.lottery.risk === 'high') bonus += 3;
      if (entry.lottery.risk === 'medium') bonus += 1;
    }

    if (answers.playRhythm === 'often') {
      if (entry.lottery.minPrice <= 100) bonus += 2;
      if (entry.lottery.risk !== 'high') bonus += 1;
    } else if (answers.playRhythm === 'rare') {
      if (entry.lottery.risk === 'high') bonus += 2;
    }

    return {
      lottery: entry.lottery,
      score: entry.base + bonus,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].lottery;
};

const clampWeight = (value: number): number => {
  if (!Number.isFinite(value)) return 1;
  if (value < 0.5) return 0.5;
  if (value > 1.5) return 1.5;
  return value;
};

// Построение весов 0.5–1.5 по ответам второй анкеты
const buildWeightsFromAnswers = (answers: MicroAnswers): RefineWeights => {
  let winRateK = 1.0;
  let winSizeK = 1.0;
  let frequencyK = 1.0;
  let ticketCostK = 1.0;

  // pricePriority: насколько важна цена билета vs размер выигрыша
  if (answers.pricePriority === 'economy') {
    ticketCostK += 0.4; // 1.4
    winSizeK -= 0.2; // 0.8
  } else if (answers.pricePriority === 'balance') {
    ticketCostK += 0.2; // 1.2
    winSizeK += 0.2; // 1.2
  } else if (answers.pricePriority === 'premium') {
    // если есть такое значение
    ticketCostK -= 0.3; // 0.7
    winSizeK += 0.4; // 1.4
  }

  // riskFeeling: важность частоты выигрыша vs размер
  if (answers.riskFeeling === 'avoid') {
    winRateK += 0.4; // хотим надёжность
    winSizeK -= 0.1;
  } else if (answers.riskFeeling === 'neutral') {
    winRateK += 0.1;
    winSizeK += 0.1;
  } else if (answers.riskFeeling === 'seek') {
    winRateK -= 0.3; // не так важна частота
    winSizeK += 0.4; // важен крупный выигрыш
  }

  // playRhythm: как часто играет — влияет на частоту и цену
  if (answers.playRhythm === 'often') {
    frequencyK += 0.5; // 1.5 — важна возможность играть часто
    ticketCostK += 0.1; // цена тоже важна
  } else if (answers.playRhythm === 'rare') {
    frequencyK -= 0.3; // 0.7 — не так важна частота
    winSizeK += 0.2; // можно добавить приоритет на размер выигрыша
  }

  return {
    win_rate_k: clampWeight(winRateK),
    win_size_k: clampWeight(winSizeK),
    frequency_k: clampWeight(frequencyK),
    ticket_cost_k: clampWeight(ticketCostK),
  };
};

export const RefineWizard: React.FC<RefineWizardProps> = ({ lotteries, profile, onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<MicroAnswers>({
    pricePriority: null,
    riskFeeling: null,
    playRhythm: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = MICRO_STEPS[stepIndex];

  const handleSelect = (field: MicroField, value: MicroAnswers[MicroField]) => {
    if (isSubmitting) return;
    setAnswers((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleNext = () => {
    if (isSubmitting) return;

    if (!answers[currentStep.field]) {
      setError('Выбери один из вариантов, чтобы продолжить.');
      return;
    }

    if (stepIndex === MICRO_STEPS.length - 1) {
      setIsSubmitting(true);

      const weights = buildWeightsFromAnswers(answers);
      console.log('[RefineWizard] Итоговые веса для /best_of:', weights);

      // если вдруг захочешь оставить локальный выбор — можно посчитать finalLocal
      // const finalLocal = chooseFinalLottery(lotteries, profile, answers);
      // и потом использовать его как fallback на фронте

      onComplete(weights);
      return;
    }

    setStepIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (isSubmitting) return;
    setError(null);
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  };

  const PROGRESS_BY_STEP = [0, 50, 100];
  const progressPercent =
    PROGRESS_BY_STEP[stepIndex] ?? PROGRESS_BY_STEP[PROGRESS_BY_STEP.length - 1];

  return (
    <Stack>
      <Box>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="xs" color="gray.500">
            Дополнительные вопросы {stepIndex + 1} из {MICRO_STEPS.length}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {Math.round(progressPercent)}%
          </Text>
        </HStack>
        <Progress.Root variant="outline" maxW="auto" value={progressPercent} colorPalette="green">
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Box>

      <Stack>
        <Heading size="sm">{currentStep.title}</Heading>
        <Stack>
          {currentStep.options.map((opt) => {
            const active = answers[currentStep.field] === opt.value;
            return (
              <Button
                key={String(opt.value)}
                variant={active ? 'solid' : 'outline'}
                colorScheme="purple"
                justifyContent="flex-start"
                w="100%"
                borderRadius="lg"
                size="sm"
                fontWeight="normal"
                whiteSpace="normal"
                textAlign="left"
                py={3}
                px={4}
                onClick={() => handleSelect(currentStep.field, opt.value)}
                disabled={isSubmitting}
              >
                {opt.label}
              </Button>
            );
          })}
        </Stack>
        {error && (
          <Text fontSize="xs" color="red.500">
            {error}
          </Text>
        )}
      </Stack>

      <HStack justify="space-between" pt={2}>
        <Button variant="ghost" size="sm" onClick={handleBack} disabled={isSubmitting}>
          Назад
        </Button>
        <Button colorScheme="purple" size="sm" onClick={handleNext} disabled={isSubmitting}>
          {stepIndex === MICRO_STEPS.length - 1 ? 'Пересчитать подбор' : 'Далее'}
        </Button>
      </HStack>
    </Stack>
  );
};
