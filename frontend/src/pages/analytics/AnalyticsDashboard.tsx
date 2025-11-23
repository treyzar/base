// src/pages/AnalyticsDashboard.tsx
import React from 'react';
import { Box, Heading, Text, SimpleGrid, HStack, Badge, Stack } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface WinRatePoint {
  name: string;
  winRate: number;
}

interface PriceSegmentPoint {
  segment: string;
  count: number;
}

const winRateData: WinRatePoint[] = [
  { name: 'Янв', winRate: 31 },
  { name: 'Фев', winRate: 34 },
  { name: 'Мар', winRate: 36 },
  { name: 'Апр', winRate: 37 },
  { name: 'Май', winRate: 39 },
  { name: 'Июн', winRate: 41 },
];

const priceSegmentsData: PriceSegmentPoint[] = [
  { segment: 'До 100 ₽', count: 7 },
  { segment: '100–500 ₽', count: 11 },
  { segment: '500–1500 ₽', count: 6 },
];

const AnalyticsDashboard: React.FC = () => {
  // Подключаемся к твоей цветовой схеме: тёмный фон + светлый текст
  const borderColor = useColorModeValue('gray.400', 'black');
  const textColor = useColorModeValue('#000000', '#FFFFFF');
  const cardBg = useColorModeValue('#050505', '#050505');
  const heroBg = '#E42532'; // красный Столото
  const heroTextColor = '#FFFFFF';
  const badgeBg = '#FFF42A';
  const badgeColor = '#000000';

  return (
    <Box
      bg="transparent"
      minH="90vh"
      py={8}
      px={{ base: 4, md: 8 }}
      display="flex"
      flexDirection="column"
    >
      <Box maxW="1200px" mx="auto" flex="1">
        {/* Внешний контейнер в стиле ассистента: чёрная карта с радиусом */}
        <Box
          bg="black"
          borderRadius={{ base: '2xl', md: '3xl' }}
          borderWidth={{ base: '0', md: '1px' }}
          borderColor={borderColor}
          boxShadow="0 24px 80px rgba(0,0,0,0.85)"
          overflow="hidden"
        >
          {/* Верхняя панель: стилистика Столото + как у ассистента */}
          <Box bg={heroBg} color={heroTextColor} px={{ base: 4, md: 8 }} py={{ base: 4, md: 5 }}>
            <SimpleGrid columns={{ base: 1, md: 2 }} alignItems="center">
              <Stack>
                <HStack>
                  <Box
                    w={8}
                    h={8}
                    borderRadius="full"
                    bgGradient="linear(to-br, #FFD600, #FFA500)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="lg"
                    color="#000000"
                    boxShadow="md"
                  >
                    🎲
                  </Box>
                  <Box>
                    <Text
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="semibold"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      Аналитика Столото
                    </Text>
                    <Text fontSize="xs" opacity={0.9}>
                      Подбор и оценка лотерей по реальным данным
                    </Text>
                  </Box>
                </HStack>
                <Heading as="h1" size="md" lineHeight="1.25" fontWeight="extrabold">
                  Как мы проверяем лотереи на честность и комфортную игру
                </Heading>
              </Stack>

              <Stack alignItems={{ base: 'flex-start', md: 'flex-end' }}>
                <HStack>
                  <Badge
                    borderRadius="full"
                    px={3}
                    py={1}
                    bg={badgeBg}
                    color={badgeColor}
                    fontSize="0.7rem"
                    textTransform="uppercase"
                  >
                    данные Столото
                  </Badge>
                  <Badge
                    borderRadius="full"
                    px={3}
                    py={1}
                    bg="rgba(0,0,0,0.3)"
                    color="#FFFFFF"
                    fontSize="0.7rem"
                    textTransform="uppercase"
                  >
                    beta
                  </Badge>
                </HStack>
                <Text fontSize="xs" lineHeight="1.5" textAlign={{ base: 'left', md: 'right' }}>
                  Здесь мы собираем агрегированные метрики по моментальным и тиражным лотереям: цены
                  билетов, модельную вероятность выигрыша и распределение по ценовым сегментам. Эти
                  показатели используются внутри ассистента для рекомендаций.
                </Text>
              </Stack>
            </SimpleGrid>
          </Box>

          {/* Основной блок аналитики */}
          <Box bg={cardBg} px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
            {/* Верхний ряд метрик в виде "столото-карточек" */}
            <SimpleGrid columns={{ base: 1, md: 3 }} mb={6}>
              <Box borderWidth="1px" borderRadius="xl" borderColor={borderColor} p={4}>
                <Text
                  fontSize="xs"
                  textTransform="uppercase"
                  color="gray.400"
                  mb={1}
                  letterSpacing="0.06em"
                >
                  Средняя цена билета
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={textColor} mb={1}>
                  420 ₽
                </Text>
                <Text fontSize="xs" color="green.300">
                  ▲ +12% за 30 дней
                </Text>
                <Text fontSize="xs" color="gray.400" mt={2}>
                  Считается по всем активным лотереям: моментальным и тиражным.
                </Text>
              </Box>

              <Box borderWidth="1px" borderRadius="xl" borderColor={borderColor} p={4}>
                <Text
                  fontSize="xs"
                  textTransform="uppercase"
                  color="gray.400"
                  mb={1}
                  letterSpacing="0.06em"
                >
                  Модельная вероятность выигрыша
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={textColor} mb={1}>
                  37%
                </Text>
                <Text fontSize="xs" color="red.300">
                  ▼ −3 п.п. к прошлому месяцу
                </Text>
                <Text fontSize="xs" color="gray.400" mt={2}>
                  Это не официальные шансы, а оценка модели на основе структуры призов и стоимости.
                </Text>
              </Box>

              <Box borderWidth="1px" borderRadius="xl" borderColor={borderColor} p={4}>
                <Text
                  fontSize="xs"
                  textTransform="uppercase"
                  color="gray.400"
                  mb={1}
                  letterSpacing="0.06em"
                >
                  Активных лотерей в витрине
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={textColor} mb={1}>
                  24
                </Text>
                <Text fontSize="xs" color="gray.300">
                  9 моментальных, 15 тиражных
                </Text>
                <Text fontSize="xs" color="gray.400" mt={2}>
                  Считаем только доступные сейчас для покупки лотереи.
                </Text>
              </Box>
            </SimpleGrid>

            {/* Графики в духе «витрины» */}
            <SimpleGrid columns={{ base: 1, md: 2 }}>
              {/* Линия: динамика win_rate */}
              <Box borderWidth="1px" borderRadius="xl" borderColor={borderColor} p={4} h="260px">
                <Heading as="h2" size="sm" mb={1} color={textColor}>
                  Динамика модельной вероятности выигрыша
                </Heading>
                <Text fontSize="xs" color="gray.400" mb={3}>
                  По всем активным лотереям, помесячно
                </Text>
                <Box w="100%" h="180px">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={winRateData}
                      margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                      <XAxis dataKey="name" stroke="#888888" />
                      <YAxis unit="%" stroke="#888888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111111',
                          border: '1px solid #333333',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="winRate"
                        stroke="#FFD600"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              {/* Бар-чарт: распределение по ценовым сегментам */}
              <Box borderWidth="1px" borderRadius="xl" borderColor={borderColor} p={4} h="260px">
                <Heading as="h2" size="sm" mb={1} color={textColor}>
                  Распределение лотерей по ценовым сегментам
                </Heading>
                <Text fontSize="xs" color="gray.400" mb={3}>
                  Эти сегменты используются для нормализации стоимости билета в модели рекомендаций
                </Text>
                <Box w="100%" h="180px">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={priceSegmentsData}
                      margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                      <XAxis dataKey="segment" stroke="#888888" />
                      <YAxis stroke="#888888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111111',
                          border: '1px solid #333333',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="count" fill="#FFB400" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </SimpleGrid>

            {/* Описание методологии, как в продуктовой документации */}
            <Box mt={6}>
              <Heading as="h2" size="sm" mb={2} color={textColor}>
                Методология расчёта
              </Heading>
              <Text fontSize="xs" color="gray.300" lineHeight="1.6">
                Источником данных выступают официальные эндпоинты Столото и твой внутренний каталог
                лотерей. Для каждой игры мы сохраняем историю тиражей, суперпризов и стоимости
                билетов, нормализуем цены в рублях и приводим вероятность выигрыша к единой шкале.
                На основе этих данных строятся агрегированные показатели, которые используются
                рекомендационной моделью ассистента для подбора «честных» и комфортных по бюджету
                лотерей.
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard;
