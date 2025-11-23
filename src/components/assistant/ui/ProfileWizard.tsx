import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  STEPS,
  type ProfileWizardProps,
  type Profile,
  type Field,
  type Answer,
  stolotoApi,
  type Lottery,
} from '@/lib';
import { Stack, Box, HStack, Text, Heading, Button, Slider, Progress } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

type StyleValue = 'instant' | 'tirage' | 'any';

type StolotoDrawsResponse = {
  games: any[];
  [key: string]: unknown;
};

type MomentCard = {
  lotteryId: string;
  displayedName?: string;
  ticketPriceInfo?: string;
  superPrizeValue?: string;
  lotterySlogan?: string;
  [key: string]: unknown;
};

type MomentalResponse = {
  data: {
    title: string;
    titleColorHex: string | null;
    momentCards: MomentCard[];
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
};

const parsePrice = (priceStr?: string): number => {
  if (!priceStr) return 0;
  const digits = priceStr.replace(/\s/g, '').match(/\d+/g);
  if (!digits) return 0;
  return Number(digits.join('')) || 0;
};

// Диапазон стоимости билета по стилю игры
const getTicketCostRange = (style: StyleValue | null): [number, number] => {
  if (style === 'instant') {
    // моментальные — 10–1500 ₽
    return [10, 1500];
  }
  if (style === 'tirage') {
    // тиражные — немного иной диапазон
    return [50, 1000];
  }
  // any и всё остальное
  return [10, 1500];
};

export const ProfileWizard: React.FC<ProfileWizardProps> = React.memo(
  ({ onComplete, onCancel, onLotteriesChange }) => {
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

    const [styleCache, setStyleCache] = useState<Record<StyleValue, Lottery[]>>({
      instant: [],
      tirage: [],
      any: [],
    });

    const [lastStyleRequested, setLastStyleRequested] = useState<StyleValue | null>(null);
    const [isLoadingStyle, setIsLoadingStyle] = useState(false);

    const currentStep = STEPS[stepIndex];

    const defaultWinRate = 40;
    const defaultWinSizeRange: [number, number] = [100_000, 500_000];

    // Диапазон цены билета по текущему стилю
    const [ticketCostMin, ticketCostMax] = useMemo(() => {
      const style = (profile.style ?? 'any') as StyleValue | null;
      return getTicketCostRange(style);
    }, [profile.style]);

    // Дефолты для win_rate / win_size / ticket_cost
    useEffect(() => {
      const field = STEPS[stepIndex].field;

      if (field === 'win_rate' && profile.win_rate == null) {
        setProfile((prev) => ({ ...prev, win_rate: defaultWinRate }));
      }

      if (field === 'win_size' && profile.win_size == null) {
        const avg = (defaultWinSizeRange[0] + defaultWinSizeRange[1]) / 2;
        setProfile((prev) => ({ ...prev, win_size: avg }));
      }

      if (field === 'ticket_cost' && profile.ticket_cost == null) {
        const mid = (ticketCostMin + ticketCostMax) / 2;
        setProfile((prev) => ({ ...prev, ticket_cost: mid }));
      }
    }, [
      stepIndex,
      profile.win_rate,
      profile.win_size,
      profile.ticket_cost,
      defaultWinRate,
      defaultWinSizeRange,
      ticketCostMin,
      ticketCostMax,
    ]);

    const mapDrawsToLotteries = (games: any[]): Lottery[] =>
      games.map((game) => {
        const name: string = game.name ?? 'Без названия';
        return {
          id: String(game.name ?? game.draw?.id ?? Math.random()),
          name,
          minPrice: game.draw?.betCost ?? 100,
          risk: 'medium',
          drawType: 'draw',
          format: 'online',
          description: `Тиражная лотерея ${name}`,
          features: [
            'Тиражный розыгрыш',
            'Подходит для регулярной игры',
            game.completedDraw?.superPrize
              ? `Суперприз: ${game.completedDraw.superPrize} ₽`
              : 'Фиксированные призы',
          ],
        };
      });

    const mapMomentCardsToLotteries = (cards: MomentCard[]): Lottery[] =>
      cards.map((card) => {
        const name = card.displayedName ?? card.lotteryId;
        const minPrice = parsePrice(card.ticketPriceInfo);
        return {
          id: card.lotteryId,
          name,
          minPrice,
          risk: 'low',
          drawType: 'instant',
          format: 'offline',
          description: card.lotterySlogan
            ? card.lotterySlogan
            : `Моментальная лотерея ${name}, результат сразу после стирания защитного слоя.`,
          features: [
            card.ticketPriceInfo ? `Цена билета: ${card.ticketPriceInfo}` : 'Доступная цена',
            card.superPrizeValue ? `Суперприз: ${card.superPrizeValue}` : 'Много мелких призов',
            'Результат сразу',
          ],
        };
      });

    const handleStyleRequest = async (style: StyleValue): Promise<Lottery[] | null> => {
      console.log('[ProfileWizard] handleStyleRequest, style:', style);
      try {
        if (style === 'instant') {
          const instantResponse = await stolotoApi.getMomental<MomentalResponse>();

          const instantCards =
            Array.isArray(instantResponse.data) && instantResponse.data[0]
              ? instantResponse.data[0].momentCards ?? []
              : [];

          const normalized = mapMomentCardsToLotteries(instantCards);
          console.log('[ProfileWizard] Получены моментальные лотереи:', normalized.length);
          return normalized;
        }

        if (style === 'tirage') {
          const drawsResponse = await stolotoApi.getDraws<StolotoDrawsResponse>();

          const drawsGames = Array.isArray(drawsResponse.games) ? drawsResponse.games : [];
          const drawsWithoutLast = drawsGames.slice(0, -1);

          const normalized = mapDrawsToLotteries(drawsWithoutLast);
          console.log('[ProfileWizard] Получены тиражные лотереи:', normalized.length);
          return normalized;
        }

        if (style === 'any') {
          const [instantResponse, drawsResponse] = await Promise.all([
            stolotoApi.getMomental<MomentalResponse>(),
            stolotoApi.getDraws<StolotoDrawsResponse>(),
          ]);

          const instantCards =
            Array.isArray(instantResponse.data) && instantResponse.data[0]
              ? instantResponse.data[0].momentCards ?? []
              : [];

          const drawsGames = Array.isArray(drawsResponse.games) ? drawsResponse.games : [];
          const drawsWithoutLast = drawsGames.slice(0, -1);

          const instantLotteries = mapMomentCardsToLotteries(instantCards);
          const tirageLotteries = mapDrawsToLotteries(drawsWithoutLast);

          const merged = [...instantLotteries, ...tirageLotteries];
          console.log('[ProfileWizard] Получены все лотереи (any):', merged.length);
          return merged;
        }

        return null;
      } catch (e) {
        console.error('Ошибка при запросе Stoloto по выбору стиля:', e);
        return null;
      }
    };

    const handleSelect = useCallback(
      (field: Field, value: Answer) => {
        if (isSubmitting) return;
        console.log('[ProfileWizard] Выбор ответа', { field, value });
        setProfile((prev) => ({ ...prev, [field]: value }));
        if (error) setError(null);
      },
      [isSubmitting, error]
    );

    const handleWinRateChange = useCallback(
      (value: number) => {
        if (isSubmitting) return;
        console.log('[ProfileWizard] Смена win_rate слайдера:', value);
        setProfile((prev) => ({ ...prev, win_rate: value }));
        if (error) setError(null);
      },
      [isSubmitting, error]
    );

    const handleWinSizeChange = useCallback(
      (min: number, max: number) => {
        if (isSubmitting) return;
        const avg = (min + max) / 2;
        console.log('[ProfileWizard] Смена win_size диапазона:', { min, max, avg });
        setProfile((prev) => ({ ...prev, win_size: avg }));
        if (error) setError(null);
      },
      [isSubmitting, error]
    );

    const handleTicketCostChange = useCallback(
      (value: number) => {
        if (isSubmitting) return;
        console.log('[ProfileWizard] Смена ticket_cost слайдера:', value);
        setProfile((prev) => ({ ...prev, ticket_cost: value }));
        if (error) setError(null);
      },
      [isSubmitting, error]
    );

    const handleNext = useCallback(async () => {
      if (isSubmitting) return;

      if (!profile[currentStep.field]) {
        setError('Выбери один из вариантов или поправь ползунок, чтобы продолжить.');
        return;
      }

      if (stepIndex === 0 && profile.style) {
        const style = profile.style as StyleValue;
        console.log('[ProfileWizard] Первый шаг (style), выбран стиль:', style);

        if (styleCache[style] && styleCache[style].length > 0) {
          console.log(
            '[ProfileWizard] Используем кэш для стиля',
            style,
            ', количество:',
            styleCache[style].length
          );
          if (onLotteriesChange) {
            onLotteriesChange(styleCache[style]);
          }
        } else {
          try {
            setIsLoadingStyle(true);
            const lotteries = await handleStyleRequest(style);
            setIsLoadingStyle(false);

            if (lotteries && lotteries.length > 0) {
              setStyleCache((prev) => ({
                ...prev,
                [style]: lotteries,
              }));
              setLastStyleRequested(style);
              console.log(
                '[ProfileWizard] Сохранён кэш для стиля',
                style,
                ', количество:',
                lotteries.length
              );

              if (onLotteriesChange) {
                onLotteriesChange(lotteries);
              }
            } else {
              console.warn('Стиль выбран, но лотерей не пришло.');
            }
          } catch (e) {
            setIsLoadingStyle(false);
            console.error('Ошибка при запросе по стилю:', e);
          }
        }
      }

      if (stepIndex === STEPS.length - 1) {
        console.log('[ProfileWizard] Последний шаг анкеты, отправляем профиль:', profile);
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

          if (nextField === 'ticket_cost' && prev.ticket_cost == null) {
            const mid = (ticketCostMin + ticketCostMax) / 2;
            newProfile = { ...newProfile, ticket_cost: mid };
          }

          return newProfile;
        });
      }

      console.log('[ProfileWizard] Переход на следующий шаг', stepIndex + 1);
      setStepIndex((i) => i + 1);
    }, [
      isSubmitting,
      profile,
      currentStep.field,
      stepIndex,
      styleCache,
      onLotteriesChange,
      defaultWinRate,
      defaultWinSizeRange,
      ticketCostMin,
      ticketCostMax,
    ]);

    const handleBack = useCallback(() => {
      if (isSubmitting) return;
      setError(null);
      if (stepIndex === 0) {
        console.log('[ProfileWizard] Назад с первого шага — вызываем onCancel');
        onCancel();
        return;
      }
      console.log('[ProfileWizard] Переход на предыдущий шаг', stepIndex - 1);
      setStepIndex((i) => i - 1);
    }, [isSubmitting, stepIndex, onCancel]);

    const progressPercent = useMemo(() => {
      return STEPS.length > 1 ? (stepIndex / (STEPS.length - 1)) * 100 : 100;
    }, [stepIndex]);

    const winRateValue = (profile.win_rate as number | null) ?? defaultWinRate;
    const ticketCostValue =
      (profile.ticket_cost as number | null) ?? (ticketCostMin + ticketCostMax) / 2;

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

          <Progress.Root
            variant="outline"
            maxW="auto"
            value={progressPercent}
            colorPalette="orange"
          >
            <Progress.Track bg={progressTrackBg}>
              <Progress.Range bg={progressRangeBg} />
            </Progress.Track>
          </Progress.Root>

          {stepIndex === 0 && isLoadingStyle && (
            <Text mt={1} fontSize="xs" color="gray.500">
              Подбираю подходящие лотереи под твой стиль…
            </Text>
          )}
        </Box>

        <Stack>
          <Heading size="md">{currentStep.title}</Heading>

          {currentStep.options.length > 0 && currentStep.field !== 'ticket_cost' && (
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

          {currentStep.field === 'ticket_cost' && (
            <Box pt={2}>
              <Slider.Root
                maxW="sm"
                size="sm"
                min={ticketCostMin}
                max={ticketCostMax}
                step={10}
                defaultValue={[ticketCostValue]}
                onValueChange={(details) => {
                  const vArray = details.value as number[];
                  if (!vArray || vArray.length === 0) return;
                  handleTicketCostChange(vArray[0]);
                }}
              >
                <HStack justify="space-between" mb={1}>
                  <Slider.Label fontSize="17.28px">Примерная комфортная цена билета</Slider.Label>
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
                Сейчас выбрано примерно {Math.round(ticketCostValue)} ₽ как комфортная стоимость
                билета для твоей игры.
              </Text>
            </Box>
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
                {profile.win_size ? `${Math.round(profile.win_size as number)} ₽` : 'пока не задан'}
                .
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
            onClick={() => void handleNext()}
            disabled={isSubmitting}
            borderRadius="full"
          >
            {stepIndex === STEPS.length - 1 ? 'Показать рекомендации' : 'Далее'}
          </Button>
        </HStack>
      </Stack>
    );
  }
);
