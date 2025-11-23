import { useState, useCallback, useMemo } from 'react';
import { STEPS, type ProfileWizardProps, type Profile, type Field, type Answer } from '@lib';
import { Stack, Box, HStack, Text, Progress, Heading, Button, Slider } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';
import React from 'react';

export const ProfileWizard: React.FC<ProfileWizardProps> = React.memo(({ onComplete, onCancel }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState<Profile>({
    style: null,
    budget: null,
    frequency: null,
    ticket_cost: null,
    transparency: null,
    win_rate: null,
    win_size: null,
    motivation: null,
    risk: null,
    format: null,
    drawType: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = STEPS[stepIndex];

  const defaultWinRate = 40;
  const defaultWinSizeRange: [number, number] = [100_000, 500_000];

  const handleSelect = useCallback((field: Field, value: Answer) => {
    if (isSubmitting) return;
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }, [isSubmitting, error]);

  const handleWinRateChange = useCallback((value: number) => {
    if (isSubmitting) return;
    setProfile((prev) => ({ ...prev, win_rate: value }));
    if (error) setError(null);
  }, [isSubmitting, error]);

  const handleWinSizeChange = useCallback((min: number, max: number) => {
    if (isSubmitting) return;
    const avg = (min + max) / 2;
    setProfile((prev) => ({ ...prev, win_size: avg }));
    if (error) setError(null);
  }, [isSubmitting, error]);

  const handleNext = useCallback(() => {
    if (isSubmitting) return;

    if (!profile[currentStep.field]) {
      setError('Выбери один из вариантов или поправь ползунок, чтобы продолжить.');
      return;
    }

    if (stepIndex === STEPS.length - 1) {
      setIsSubmitting(true);
      onComplete(profile);
      return;
    }

    const nextStepIndex = stepIndex + 1;
    const nextField = STEPS[nextStepIndex]?.field;

    if (nextField) {
        setProfile((prev) => {
            let newProfile = prev;

            if (nextField === 'win_rate' && prev.win_rate == null) {
                newProfile = { ...newProfile, win_rate: defaultWinRate };
            }

            if (nextField === 'win_size' && prev.win_size == null) {
                const avg = (defaultWinSizeRange[0] + defaultWinSizeRange[1]) / 2;
                newProfile = { ...newProfile, win_size: avg };
            }
            
            return newProfile;
        });
    }

    setStepIndex((i) => i + 1);
  }, [isSubmitting, profile, currentStep.field, stepIndex, onComplete]);

  const handleBack = useCallback(() => {
    if (isSubmitting) return;
    setError(null);
    if (stepIndex === 0) {
      onCancel();
      return;
    }
    setStepIndex((i) => i - 1);
  }, [isSubmitting, stepIndex, onCancel]);

  const progressPercent = useMemo(() => {
    return STEPS.length > 1 ? (stepIndex / (STEPS.length - 1)) * 100 : 100;
  }, [stepIndex]);

  // Если profile.win_rate null, используем defaultWinRate для отображения
  const winRateValue = (profile.win_rate as number | null) ?? defaultWinRate;

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
            Анкета: шаг {stepIndex + 1} из {STEPS.length}
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

        {currentStep.options.length > 0 && (
          <Stack>
            {currentStep.options.map((opt) => {
              const active = profile[currentStep.field] === opt.value;
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
        )}

        {currentStep.field === 'win_rate' && (
          <Box pt={2}>
            <Slider.Root
              maxW="sm"
              size="sm"
              min={1}
              max={100}
              defaultValue={[winRateValue]}
              onValueChange={(details) => {
                const vArray = details.value as number[]; 
                if (!vArray || vArray.length === 0) return;
                handleWinRateChange(vArray[0]);
              }}
            >
              <HStack justify="space-between" mb={1}>
                <Slider.Label fontSize="17.28px">Желаемая частота выигрышей</Slider.Label>
                <Slider.ValueText />
              </HStack>
              <Slider.Control>
                <Slider.Track bg={progressTrackBg}>
                  <Slider.Range bg={progressRangeBg} />
                </Slider.Track>
                <Slider.Thumbs />
              </Slider.Control>
            </Slider.Root>
            <Text fontSize="15.12px" color={textColor} mt={2}>
              Сейчас выбрано примерно {winRateValue}% раз, когда ты ожидаешь выигрыш.
            </Text>
          </Box>
        )}

        {currentStep.field === 'win_size' && (
          <Box pt={2}>
            <Slider.Root
              width="260px"
              min={10_000}
              max={1_000_000}
              step={10_000}
              defaultValue={defaultWinSizeRange} 
              minStepsBetweenThumbs={1}
              onValueChange={(details) => {
                const vArray = details.value as number[];
                if (!vArray || vArray.length < 2) return;
                handleWinSizeChange(vArray[0], vArray[1]);
              }}
            >
              <Slider.Control>
                <Slider.Track bg={progressTrackBg}>
                  <Slider.Range bg={progressRangeBg} />
                </Slider.Track>
                <Slider.Thumbs />
              </Slider.Control>
            </Slider.Root>
            <Text fontSize="15.12px" color={textColor} mt={2}>
              Средний желаемый размер выигрыша:{' '}
              {profile.win_size ? `${Math.round(profile.win_size as number)} ₽` : 'пока не задан'}.
            </Text>
          </Box>
        )}

        {error && (
          <Text fontSize="15.12px" color={errorColor}>
            {error}
          </Text>
        )}
      </Stack>

      <HStack justify="space-between" pt={1}>
        <Button variant="ghost" size="sm" onClick={handleBack} disabled={isSubmitting} color={backButtonColor} borderRadius="full">
          Назад
        </Button>
        <Button bg={nextButtonBg} color={nextButtonColor} size="sm" onClick={handleNext} disabled={isSubmitting} borderRadius="full">
          {stepIndex === STEPS.length - 1 ? 'Показать рекомендации' : 'Далее'}
        </Button>
      </HStack>
    </Stack>
  );
});