import type { StepConfig, Lottery, MicroStep } from '@lib';
import { useColorModeValue } from '@/components/ui/color-mode';
export const STEPS: StepConfig[] = [
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

export const MICRO_STEPS: MicroStep[] = [
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

export const pageBg = () =>
  useColorModeValue('linear(to-b, gray.50, gray.100)', 'linear(to-b, gray.900, gray.800)');

export const chatBg = () => useColorModeValue('gray.50', 'gray.850');

export const links = [
  { label: 'Главная', href: '#' },
  { label: 'О нас', href: '#' },
  { label: 'Контакты', href: '#' },
];
