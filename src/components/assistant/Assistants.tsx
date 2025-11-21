// src/components/assistant/Assistant.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Stack,
  HStack,
  Progress,
  Badge,
  SimpleGrid,
  Spinner,
  Center,
  useBreakpointValue,
  Slider,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

type Answer = string | number | boolean | null;
type Field =
  | 'style'
  | 'budget'
  | 'frequency'
  | 'ticket_cost'
  | 'transparency'
  | 'win_rate'
  | 'win_size'
  | 'motivation'
  | 'risk'
  | 'format'
  | 'drawType';

type RiskLevel = 'low' | 'medium' | 'high';
type DrawType = 'instant' | 'draw';
type FormatType = 'online' | 'offline';

interface Lottery {
  id: string;
  name: string;
  minPrice: number;
  risk: RiskLevel;
  drawType: DrawType;
  format: FormatType;
  description: string;
  features: string[];
}

interface StepConfig {
  field: Field;
  title: string;
  options: { value: Answer; label: string }[];
}

const STEPS: StepConfig[] = [
  {
    field: 'style',
    title: 'Какой стиль игры тебе ближе?',
    options: [
      { value: 'instant', label: 'Моментальные розыгрыши' },
      { value: 'tirage', label: 'Тиражные розыгрыши' },
      { value: 'any', label: 'Любой розыгрыш' },
    ],
  },
  {
    field: 'frequency',
    title: 'Как часто хочешь участвовать?',
    options: [
      { value: 1, label: 'Каждый день' },
      { value: 1 / 7, label: 'Раз в неделю' },
      { value: 1 / 30, label: 'Раз в месяц' },
    ],
  },
  {
    field: 'ticket_cost',
    title: 'Какая стоимость билета комфортна?',
    options: [
      { value: (100 + 200) / 2, label: '100–200 ₽' },
      { value: (200 + 500) / 2, label: '200–500 ₽' },
      { value: (500 + 1000) / 2, label: '500–1000 ₽' },
    ],
  },
  {
    field: 'win_rate',
    title: 'Как часто ты хочешь примерно выигрывать?',
    options: [],
  },
  {
    field: 'win_size',
    title: 'Какой размер выигрыша тебе комфортнее?',
    options: [],
  },
];

type Profile = Record<Field, Answer>;

// -----------------------------
// Моковые лотереи
// -----------------------------

const MOCK_LOTTERIES: Lottery[] = [
  {
    id: '6x45',
    name: 'Спортлото «6 из 45»',
    minPrice: 100,
    risk: 'medium',
    drawType: 'draw',
    format: 'online',
    description: 'Классическая тиражная лотерея с понятными шансами и умеренным риском.',
    features: ['Тиражный розыгрыш', 'Баланс риска и выигрыша', 'Подходит для регулярной игры'],
  },
  {
    id: '4x20',
    name: 'Спортлото «4 из 20»',
    minPrice: 80,
    risk: 'low',
    drawType: 'draw',
    format: 'online',
    description: 'Невысокая стоимость билета и хорошие шансы на небольшие выигрыши.',
    features: ['Невысокая цена', 'Частые выигрышные комбинации', 'Для осторожных игроков'],
  },
  {
    id: 'ruslotto',
    name: '«Русское лото»',
    minPrice: 150,
    risk: 'medium',
    drawType: 'draw',
    format: 'offline',
    description: 'Классическая бочоночная лотерея, часто играют семьями по выходным тиражам.',
    features: ['Семейная традиция', 'Телетрансляции тиражей', 'Крупные суперпризы'],
  },
  {
    id: 'gzhl',
    name: '«Жилищная лотерея»',
    minPrice: 150,
    risk: 'high',
    drawType: 'draw',
    format: 'online',
    description: 'Шанс выиграть квартиру или крупные денежные призы.',
    features: [
      'Высокие призы',
      'Более высокий риск',
      'Подходит тем, кто готов ждать крупный выигрыш',
    ],
  },
  {
    id: 'instant-mini',
    name: 'Моментальная «Мини-выигрыш»',
    minPrice: 50,
    risk: 'low',
    drawType: 'instant',
    format: 'online',
    description: 'Моментальные результаты, маленькие, но частые выигрыши.',
    features: ['Результат сразу', 'Низкий порог входа', 'Для лёгкого развлечения'],
  },
];

const getInitialLotteries = (): Lottery[] => MOCK_LOTTERIES.slice(0, 3);

// -----------------------------
// Скоринг
// -----------------------------

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

// -----------------------------
// Вспомогательный ChatBubble
// -----------------------------

interface ChatBubbleProps {
  role: 'assistant' | 'system' | 'user';
  children: React.ReactNode;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, children }) => {
  const isAssistant = role === 'assistant';
  const isUser = role === 'user';

  const bubbleBg = useColorModeValue(
    isAssistant ? 'white' : isUser ? 'blue.500' : 'gray.100',
    isAssistant ? 'gray.800' : isUser ? 'blue.400' : 'gray.700'
  );
  const bubbleBorder = useColorModeValue(
    isAssistant ? 'blue.100' : isUser ? 'blue.500' : 'gray.200',
    isAssistant ? 'blue.600' : isUser ? 'blue.300' : 'gray.600'
  );
  const textColor = useColorModeValue(isUser ? 'white' : 'gray.900', 'white');

  const maxWidth = useBreakpointValue({ base: '100%', md: '80%' });
  const justifyContent = isUser ? 'flex-end' : isAssistant ? 'flex-start' : 'center';

  return (
    <Box display="flex" justifyContent={justifyContent}>
      <Box
        maxW={maxWidth}
        bg={bubbleBg}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={bubbleBorder}
        boxShadow="md"
        p={{ base: 4, md: 5 }}
        color={textColor}
      >
        {children}
      </Box>
    </Box>
  );
};

// -----------------------------
// Анкета профиля (внутри чата, статичное сообщение)
// -----------------------------

interface ProfileWizardProps {
  onComplete: (profile: Profile) => void;
  onCancel: () => void;
}

const ProfileWizard: React.FC<ProfileWizardProps> = ({ onComplete, onCancel }) => {
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

  const currentStep = STEPS[stepIndex];

  const handleSelect = (field: Field, value: Answer) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleWinRateChange = (value: number) => {
    setProfile((prev) => ({ ...prev, win_rate: value }));
    if (error) setError(null);
  };

  const handleWinSizeChange = (min: number, max: number) => {
    const avg = (min + max) / 2;
    setProfile((prev) => ({ ...prev, win_size: avg }));
    if (error) setError(null);
  };

  const handleNext = () => {
    if (!profile[currentStep.field]) {
      setError('Выбери один из вариантов или поправь ползунок, чтобы продолжить.');
      return;
    }

    if (stepIndex === STEPS.length - 1) {
      onComplete(profile);
      return;
    }

    setStepIndex((i) => i + 1);
  };

  const handleBack = () => {
    setError(null);
    if (stepIndex === 0) {
      onCancel();
      return;
    }
    setStepIndex((i) => i - 1);
  };

  const completedSteps = stepIndex;
  const progressPercent = (completedSteps / STEPS.length) * 100;

  const winRateValue = (profile.win_rate as number | null) ?? 40;
  const defaultWinSizeRange: [number, number] = [100_000, 500_000];

  return (
    <Stack>
      <Box>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="xs" color="gray.500">
            Анкета: шаг {stepIndex + 1} из {STEPS.length}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {Math.round(progressPercent)}%
          </Text>
        </HStack>
        <Progress.Root
          variant="outline"
          maxW="auto"
          value={progressPercent}
          defaultValue={0}
          colorPalette="green"
          animated
        >
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Box>

      <Stack>
        <Heading size="sm">{currentStep.title}</Heading>

        {currentStep.options.length > 0 && (
          <Stack>
            {currentStep.options.map((opt) => {
              const active = profile[currentStep.field] === opt.value;
              return (
                <Button
                  key={String(opt.value)}
                  variant={active ? 'solid' : 'outline'}
                  colorScheme="blue"
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
                >
                  <Box as="span" w="100%" textAlign="left">
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
              step={1}
              defaultValue={[winRateValue]}
              colorPalette="green"
              onValueChange={(details: any) => {
                const vArray = details?.value as number[] | undefined;
                if (!vArray || vArray.length === 0) return;
                handleWinRateChange(vArray[0]);
              }}
            >
              <HStack justify="space-between" mb={1}>
                <Slider.Label>Желаемая частота выигрышей</Slider.Label>
                <Slider.ValueText />
              </HStack>
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumbs />
              </Slider.Control>
            </Slider.Root>
            <Text fontSize="xs" color="gray.500" mt={2}>
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
              minStepsBetweenThumbs={1}
              defaultValue={defaultWinSizeRange}
              colorPalette="green"
              onValueChange={(details: any) => {
                const vArray = details?.value as number[] | undefined;
                if (!vArray || vArray.length < 2) return;
                handleWinSizeChange(vArray[0], vArray[1]);
              }}
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumbs />
              </Slider.Control>
            </Slider.Root>
            <Text fontSize="xs" color="gray.500" mt={2}>
              Средний желаемый размер выигрыша:{' '}
              {profile.win_size ? `${Math.round(profile.win_size as number)} ₽` : 'пока не задан'}.
            </Text>
          </Box>
        )}

        {error && (
          <Text fontSize="xs" color="red.400">
            {error}
          </Text>
        )}
      </Stack>

      <HStack justify="space-between" pt={1}>
        <Button variant="ghost" size="sm" onClick={handleBack}>
          Назад
        </Button>
        <Button colorScheme="blue" size="sm" onClick={handleNext}>
          {stepIndex === STEPS.length - 1 ? 'Показать рекомендации' : 'Далее'}
        </Button>
      </HStack>
    </Stack>
  );
};

// -----------------------------
// Мини-анкета для выбора 1 из 3
// -----------------------------

type MicroField = 'pricePriority' | 'riskFeeling' | 'playRhythm';

interface MicroAnswers {
  pricePriority: 'economy' | 'balance' | 'dontcare' | null;
  riskFeeling: 'avoid' | 'neutral' | 'seek' | null;
  playRhythm: 'often' | 'sometimes' | 'rare' | null;
}

interface MicroStep {
  field: MicroField;
  title: string;
  options: { value: MicroAnswers[MicroField]; label: string }[];
}

const MICRO_STEPS: MicroStep[] = [
  {
    field: 'pricePriority',
    title: 'Что тебе важнее всего по деньгам?',
    options: [
      { value: 'economy', label: 'Минимальный чек — главное, хочу играть подешевле' },
      { value: 'balance', label: 'Баланс: не самое дешёвое, но и не дорого' },
      { value: 'dontcare', label: 'Цена не так важна, главное впечатления' },
    ],
  },
  {
    field: 'riskFeeling',
    title: 'Как ты чувствуешь себя с риском именно сейчас?',
    options: [
      { value: 'avoid', label: 'Лучше спокойнее, без резких скачков' },
      { value: 'neutral', label: 'Нормально отношусь, главное интерес' },
      { value: 'seek', label: 'Хочу рискнуть ради шанса на что-то большое' },
    ],
  },
  {
    field: 'playRhythm',
    title: 'Как ты планируешь играть в ближайшее время?',
    options: [
      { value: 'often', label: 'Часто, несколько раз в неделю или больше' },
      { value: 'sometimes', label: 'Время от времени, без строгого графика' },
      { value: 'rare', label: 'Редко, иногда по настроению' },
    ],
  },
];

interface RefineWizardProps {
  lotteries: Lottery[];
  profile: Profile;
  onComplete: (finalLottery: Lottery) => void;
}

const RefineWizard: React.FC<RefineWizardProps> = ({ lotteries, profile, onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<MicroAnswers>({
    pricePriority: null,
    riskFeeling: null,
    playRhythm: null,
  });
  const [error, setError] = useState<string | null>(null);

  const currentStep = MICRO_STEPS[stepIndex];

  const handleSelect = (field: MicroField, value: MicroAnswers[MicroField]) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleNext = () => {
    if (!answers[currentStep.field]) {
      setError('Выбери один из вариантов, чтобы продолжить.');
      return;
    }

    if (stepIndex === MICRO_STEPS.length - 1) {
      const final = chooseFinalLottery(lotteries, profile, answers);
      onComplete(final);
      return;
    }

    setStepIndex((i) => i + 1);
  };

  const handleBack = () => {
    setError(null);
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  };

  // главное изменение логики: считаем прогресс по *завершённым* шагам,
  // включая текущий, чтобы на 3/3 было 100%
  const completedMicroSteps = stepIndex + 1;
  const progressPercent = (completedMicroSteps / MICRO_STEPS.length) * 100;

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
        <Progress.Root
          variant="outline"
          maxW="auto"
          value={progressPercent}
          defaultValue={0}
          colorPalette="green"
          animated
        >
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
        <Button variant="ghost" size="sm" onClick={handleBack}>
          Назад
        </Button>
        <Button colorScheme="purple" size="sm" onClick={handleNext}>
          {stepIndex === MICRO_STEPS.length - 1 ? 'Выбрать лучший вариант' : 'Далее'}
        </Button>
      </HStack>
    </Stack>
  );
};

// выбор лучшей лотереи из трёх
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

// -----------------------------
// Основной ассистент (страница-чат)
// -----------------------------

export const Assistant: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bestLotteries, setBestLotteries] = useState<Lottery[]>([]);
  const [finalLottery, setFinalLottery] = useState<Lottery | null>(null);

  const [hasStartedQuestionnaire, setHasStartedQuestionnaire] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [hasRefine, setHasRefine] = useState(false);
  const [hasFinal, setHasFinal] = useState(false);

  const pageBg = useColorModeValue(
    'linear(to-b, gray.50, gray.100)',
    'linear(to-b, gray.900, gray.800)'
  );
  const chatBg = useColorModeValue('gray.50', 'gray.850');

  const initialLotteries = useMemo(() => getInitialLotteries(), []);

  const messagesRef = useRef<HTMLDivElement | null>(null);

  const handleStartQuestionnaire = () => {
    if (!hasStartedQuestionnaire) {
      setHasStartedQuestionnaire(true);
    }
  };

  const handleProfileComplete = (p: Profile) => {
    setProfile(p);

    const scored = [...MOCK_LOTTERIES]
      .map((lottery) => ({
        lottery,
        score: scoreLottery(p, lottery),
      }))
      .sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 3).map((s) => s.lottery);
    setBestLotteries(top);

    setIsLoadingResults(true);
    setTimeout(() => {
      setIsLoadingResults(false);
      setHasResults(true);
    }, 800);
  };

  const handleGoRefine = () => {
    if (!hasRefine) {
      setHasRefine(true);
    }
  };

  const handleFinalFromRefine = (lottery: Lottery) => {
    setFinalLottery(lottery);
    setHasFinal(true);
  };

  const handleRestart = () => {
    setProfile(null);
    setBestLotteries([]);
    setFinalLottery(null);
    setHasStartedQuestionnaire(false);
    setIsLoadingResults(false);
    setHasResults(false);
    setHasRefine(false);
    setHasFinal(false);
  };

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [
    hasStartedQuestionnaire,
    isLoadingResults,
    hasResults,
    hasRefine,
    hasFinal,
    profile,
    bestLotteries.length,
  ]);

  const QuickRecommendations = () => {
    const cardBg = useColorModeValue('white', 'gray.900');
    const cardBorder = useColorModeValue('gray.200', 'gray.700');

    return (
      <Stack>
        <Heading size="sm">Я нашёл несколько вариантов, с которых можно начать 👇</Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="10px">
          {initialLotteries.map((lottery) => (
            <Box
              key={lottery.id}
              borderWidth="1px"
              borderColor={cardBorder}
              borderRadius="xl"
              p={3}
              bg={cardBg}
              boxShadow="sm"
              _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
              transition="all 0.15s ease-out"
            >
              <Stack>
                <Heading size="xs">{lottery.name}</Heading>
                <Text fontSize="xs" color="gray.500">
                  {lottery.description}
                </Text>
                <HStack mt={1} wrap="wrap">
                  <Badge colorScheme="blue">{lottery.minPrice} ₽</Badge>
                  <Badge
                    colorScheme={
                      lottery.risk === 'low'
                        ? 'green'
                        : lottery.risk === 'medium'
                        ? 'yellow'
                        : 'red'
                    }
                  >
                    Риск: {lottery.risk}
                  </Badge>
                  <Badge variant="outline" fontSize="0.65rem">
                    {lottery.drawType === 'draw' ? 'Тиражная' : 'Моментальная'}
                  </Badge>
                </HStack>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>

        <HStack justify="space-between" pt={2}>
          <Text fontSize="sm" color="gray.500">
            Если эти варианты не заходят — давай настроим подбор под тебя.
          </Text>
          <Button colorScheme="blue" size="sm" onClick={handleStartQuestionnaire}>
            Настроить под себя
          </Button>
        </HStack>
      </Stack>
    );
  };

  const ResultsBlock = () => {
    if (!profile) return null;
    const cardBg = useColorModeValue('white', 'gray.900');
    const cardBorder = useColorModeValue('gray.200', 'gray.700');

    return (
      <Stack>
        <Heading size="sm">По твоим ответам лучше всего подошли эти лотереи:</Heading>

        <SimpleGrid columns={{ base: 1, md: bestLotteries.length === 2 ? 2 : 3 }} gap="10px">
          {bestLotteries.map((lottery) => (
            <Box
              key={lottery.id}
              borderWidth="1px"
              borderColor={cardBorder}
              borderRadius="xl"
              p={4}
              bg={cardBg}
              boxShadow="sm"
            >
              <Stack>
                <Heading size="xs">{lottery.name}</Heading>
                <HStack>
                  <Badge colorScheme="blue">{lottery.minPrice} ₽</Badge>
                  <Badge
                    colorScheme={
                      lottery.risk === 'low'
                        ? 'green'
                        : lottery.risk === 'medium'
                        ? 'yellow'
                        : 'red'
                    }
                  >
                    Риск: {lottery.risk}
                  </Badge>
                  <Badge variant="outline" fontSize="0.65rem">
                    {lottery.drawType === 'draw' ? 'Тиражная' : 'Моментальная'}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  {lottery.description}
                </Text>
                <Text fontSize="xs">{explainMatch(profile, lottery)}</Text>

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
          <Button colorScheme="purple" size="sm" onClick={handleGoRefine}>
            Уточнить и выбрать один
          </Button>
        </HStack>
      </Stack>
    );
  };

  const FinalBlock = () => {
    if (!finalLottery || !profile) return null;
    const cardBg = useColorModeValue('white', 'gray.900');
    const cardBorder = useColorModeValue('gray.200', 'gray.700');

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
            <Badge variant="outline">
              {finalLottery.format === 'online' ? 'Онлайн' : 'Оффлайн'}
            </Badge>
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

        <Button variant="outline" size="sm" alignSelf="flex-start" onClick={handleRestart}>
          Начать подбор заново
        </Button>
      </Stack>
    );
  };

  const isInitial =
    !hasStartedQuestionnaire && !isLoadingResults && !hasResults && !hasRefine && !hasFinal;

  return (
    <Box minH="100vh" bgGradient={pageBg} py={4}>
      <Box
        maxW="5xl"
        minH="80vh"
        mx="auto"
        bg={chatBg}
        borderRadius={{ base: '0', md: '3xl' }}
        borderWidth={{ base: '0', md: '1px' }}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        boxShadow={{ base: 'none', md: '2xl' }}
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Box
          px={{ base: 4, md: 6 }}
          py={3}
          borderBottomWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          bg={useColorModeValue('whiteAlpha.900', 'gray.900')}
          backdropFilter="blur(8px)"
        >
          <Stack>
            <Text fontSize="sm" fontWeight="semibold">
              Лотерейный ассистент
            </Text>
            <Text fontSize="xs" color="gray.500">
              Подберу лотерею под твой стиль игры
            </Text>
          </Stack>
          <HStack>
            <Box
              w={8}
              h={8}
              borderRadius="full"
              bgGradient="linear(to-br, blue.400, purple.500)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
              color="white"
              boxShadow="md"
            >
              🎲
            </Box>
            <Badge
              colorScheme="green"
              variant="subtle"
              fontSize="0.7rem"
              borderRadius="full"
              px={3}
              py={1}
            >
              online
            </Badge>
          </HStack>
        </Box>

        <Box
          ref={messagesRef}
          px={{ base: 3, md: 5 }}
          py={4}
          maxH="calc(100vh - 96px)"
          overflowY="auto"
        >
          <Stack>
            <ChatBubble role="assistant">
              <Stack>
                <Text>
                  Привет! 👋 Я помогу разобраться с лотереями: сначала покажу быстрые варианты, а
                  если не зайдут — настроим подбор под твой стиль игры.
                </Text>
                {isInitial && (
                  <Text fontSize="sm" color="gray.400">
                    Можешь сразу посмотреть варианты ниже или запустить умный подбор.
                  </Text>
                )}
              </Stack>
            </ChatBubble>

            {isInitial && (
              <ChatBubble role="assistant">
                <QuickRecommendations />
              </ChatBubble>
            )}

            {hasStartedQuestionnaire && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="sm">Хочу настроить подбор под себя.</Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <ProfileWizard
                    onComplete={handleProfileComplete}
                    onCancel={() => {
                      setHasStartedQuestionnaire(false);
                      setProfile(null);
                      setBestLotteries([]);
                    }}
                  />
                </ChatBubble>
              </>
            )}

            {isLoadingResults && (
              <ChatBubble role="assistant">
                <Box py={2}>
                  <Center flexDirection="column">
                    <Spinner size="md" color="blue.400" mb={3} />
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Анализирую твои ответы и подбираю лучшие варианты…
                    </Text>
                  </Center>
                </Box>
              </ChatBubble>
            )}

            {hasResults && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="sm">Готов увидеть рекомендации, что ты подобрал?</Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <ResultsBlock />
                </ChatBubble>
              </>
            )}

            {hasRefine && profile && bestLotteries.length > 0 && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="sm">
                    Давай уточним и выберем один лучший вариант из этих трёх.
                  </Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <Stack>
                    <Text fontSize="sm">
                      Окей, ещё несколько уточняющих вопросов — и выберем один лучший вариант.
                    </Text>
                    <RefineWizard
                      lotteries={bestLotteries}
                      profile={profile}
                      onComplete={handleFinalFromRefine}
                    />
                  </Stack>
                </ChatBubble>
              </>
            )}

            {hasFinal && finalLottery && (
              <>
                <ChatBubble role="user">
                  <Text fontSize="sm">
                    Хочу остановиться на одном варианте, покажи итоговую рекомендацию.
                  </Text>
                </ChatBubble>
                <ChatBubble role="assistant">
                  <FinalBlock />
                </ChatBubble>
              </>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};
