// src/components/assistant/ui/RefineWizard.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { type MicroAnswers, MICRO_STEPS, type MicroField, type Lottery, type Profile } from '@lib';
import { Stack, Box, HStack, Text, Progress, Button, Heading } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

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

export const RefineWizard: React.FC<RefineWizardProps> = React.memo(
  ({ lotteries, profile, onComplete }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [answers, setAnswers] = useState<MicroAnswers>({
      pricePriority: null,
      riskFeeling: null,
      playRhythm: null,
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentStep = MICRO_STEPS[stepIndex];

    const handleSelect = useCallback(
      (field: MicroField, value: MicroAnswers[MicroField]) => {
        if (isSubmitting) return;
        setAnswers((prev) => ({ ...prev, [field]: value }));
        if (error) setError(null);
      },
      [isSubmitting, error]
    );

    const handleNext = useCallback(() => {
      if (isSubmitting) return;

      if (!answers[currentStep.field]) {
        setError('Выбери один из вариантов, чтобы продолжить.');
        return;
      }

      if (stepIndex === MICRO_STEPS.length - 1) {
        setIsSubmitting(true);

        const weights = buildWeightsFromAnswers(answers);
        console.log('[RefineWizard] Итоговые веса для /best_of:', weights, {
          lotteriesCount: lotteries.length,
          profile,
        });

        onComplete(weights);
        return;
      }

      setStepIndex((i) => i + 1);
    }, [
      isSubmitting,
      answers,
      currentStep.field,
      stepIndex,
      lotteries.length,
      profile,
      onComplete,
    ]);

    const handleBack = useCallback(() => {
      if (isSubmitting) return;
      setError(null);
      if (stepIndex === 0) return;
      setStepIndex((i) => i - 1);
    }, [isSubmitting, stepIndex]);

    const PROGRESS_BY_STEP = [0, 50, 100];

    const progressPercent = useMemo(() => {
      return PROGRESS_BY_STEP[stepIndex] ?? PROGRESS_BY_STEP[PROGRESS_BY_STEP.length - 1];
    }, [stepIndex]);

    const textColor = useColorModeValue('#000000', '#FFFFFF');
    const errorColor = '#FF4D4D';
    const buttonActiveBg = '#671600';
    const buttonActiveColor = '#FFFFFF';
    const buttonInactiveColor = useColorModeValue('#000000', '#FFFFFF');
    const buttonBorderColor = '#671600';
    const backButtonColor = useColorModeValue('#000000', '#FFFFFF');
    const nextButtonBg = '#671600';
    const nextButtonColor = '#FFFFFF';
    const progressTrackBg = '#671600';
    const progressRangeBg = '#FFF42A';

    return (
      <Stack>
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="15.12px" color={textColor}>
              Дополнительные вопросы {stepIndex + 1} из {MICRO_STEPS.length}
            </Text>
            <Text fontSize="15.12px" color={textColor}>
              {Math.round(progressPercent)}%
            </Text>
          </HStack>
          <Progress.Root variant="outline" maxW="auto" value={progressPercent} colorPalette="green">
            <Progress.Track bg={progressTrackBg}>
              <Progress.Range bg={progressRangeBg} />
            </Progress.Track>
          </Progress.Root>
        </Box>

        <Stack>
          <Heading size="md">{currentStep.title}</Heading>
          <Stack>
            {currentStep.options.map((opt) => {
              const active = answers[currentStep.field] === opt.value;
              return (
                <Button
                  key={String(opt.value)}
                  variant={active ? 'solid' : 'outline'}
                  bg={active ? buttonActiveBg : undefined}
                  color={active ? buttonActiveColor : buttonInactiveColor}
                  justifyContent="flex-start"
                  w="100%"
                  borderRadius="full"
                  size="md"
                  fontWeight="normal"
                  whiteSpace="normal"
                  textAlign="left"
                  py={3}
                  px={4}
                  onClick={() => handleSelect(currentStep.field, opt.value)}
                  disabled={isSubmitting}
                  borderColor={buttonBorderColor}
                >
                  <Box as="span" w="100%" textAlign="left" fontSize="17.28px">
                    {opt.label}
                  </Box>
                </Button>
              );
            })}
          </Stack>
          {error && (
            <Text fontSize="15.12px" color={errorColor}>
              {error}
            </Text>
          )}
        </Stack>

        <HStack justify="space-between" pt={2}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={isSubmitting}
            color={backButtonColor}
            borderRadius="full"
          >
            Назад
          </Button>
          <Button
            bg={nextButtonBg}
            color={nextButtonColor}
            size="sm"
            onClick={handleNext}
            disabled={isSubmitting}
            borderRadius="full"
          >
            {stepIndex === MICRO_STEPS.length - 1 ? 'Пересчитать подбор' : 'Далее'}
          </Button>
        </HStack>
      </Stack>
    );
  }
);
