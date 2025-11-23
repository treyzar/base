// RefineWizard.tsx
import { useState, useCallback, useMemo } from 'react';
import { chooseFinalLottery } from '@lib';
import { Stack, Box, HStack, Text, Progress, Button, Heading } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';
import { type RefineWizardProps, type MicroAnswers, MICRO_STEPS, type MicroField } from '@lib';
import React from 'react';

export const RefineWizard: React.FC<RefineWizardProps> = React.memo(({ lotteries, profile, onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<MicroAnswers>({
    pricePriority: null,
    riskFeeling: null,
    playRhythm: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = MICRO_STEPS[stepIndex];

  const handleSelect = useCallback((field: MicroField, value: MicroAnswers[MicroField]) => {
    if (isSubmitting) return;
    setAnswers((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }, [isSubmitting, error]);

  const handleNext = useCallback(() => {
    if (isSubmitting) return;

    if (!answers[currentStep.field]) {
      setError('Выбери один из вариантов, чтобы продолжить.');
      return;
    }

    if (stepIndex === MICRO_STEPS.length - 1) {
      setIsSubmitting(true);
      const final = chooseFinalLottery(lotteries, profile, answers);
      onComplete(final);
      return;
    }

    setStepIndex((i) => i + 1);
  }, [isSubmitting, answers, currentStep.field, stepIndex, lotteries, profile, onComplete]);

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
        <Heading size="md"> {currentStep.title}</Heading>
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
                size="md" // Размер кнопки не меняем
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
        <Button variant="ghost" size="sm" onClick={handleBack} disabled={isSubmitting} color={backButtonColor} borderRadius="full">
          Назад
        </Button>
        <Button bg={nextButtonBg} color={nextButtonColor} size="sm" onClick={handleNext} disabled={isSubmitting} borderRadius="full">
          {stepIndex === MICRO_STEPS.length - 1 ? 'Выбрать лучший вариант' : 'Далее'}
        </Button>
      </HStack>
    </Stack>
  );
});