// src/pages/NotFoundPage.tsx
import React from 'react';
import { Box, Heading, Text, Button, Stack, Flex } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useColorModeValue } from '@/components/ui/color-mode';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const bigTextColor = useColorModeValue('#671600', '#FFF42A');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const accentColor = '#671600';
  const buttonBg = '#671600';
  const buttonColor = '#FFFFFF';

  return (
    <Flex
      minH="100vh" // немного пространства под твой Layout
      align="center"
      justify="center"
      bg={bg}
      px={4}
      py={8}
    >
      <Box
        maxW="lg"
        w="100%"
        bg={cardBg}
        borderRadius="3xl"
        boxShadow="lg"
        px={{ base: 6, md: 10 }}
        py={{ base: 8, md: 10 }}
        position="relative"
        overflow="hidden"
      >
        {/* Декоративный круг сзади */}
        <Box
          position="absolute"
          right="-60px"
          top="-60px"
          w="180px"
          h="180px"
          borderRadius="full"
          bgGradient="radial(#FFF42A, #FFA500, #671600)"
          opacity={0.18}
        />

        <Stack position="relative">
          <Text
            fontSize="sm"
            fontWeight="medium"
            textTransform="uppercase"
            letterSpacing="0.12em"
            color={accentColor}
          >
            Ошибка 404
          </Text>

          <Heading
            as="h1"
            fontSize={{ base: '4xl', md: '5xl' }}
            lineHeight="shorter"
            color={bigTextColor}
          >
            Кажется, здесь нет такой страницы
          </Heading>

          <Text fontSize="md" color={textColor}>
            Ты попал на путь, которого нет в этом приложении. Возможно, ссылка устарела или была
            введена с опечаткой.
          </Text>

          <Text fontSize="md" color={textColor}>
            Не переживай — вернёмся к ассистенту и продолжим подбирать лотереи.
          </Text>

          <Stack direction={{ base: 'column', sm: 'row' }} pt={2}>
            <Button
              bg={buttonBg}
              color={buttonColor}
              _hover={{ bg: '#8A2300' }}
              borderRadius="full"
              onClick={() => navigate('/')}
            >
              Вернуться на главную
            </Button>

            <Button
              variant="outline"
              borderRadius="full"
              borderColor={accentColor}
              color={accentColor}
              onClick={() => navigate(-1)}
            >
              Назад
            </Button>
          </Stack>

          <Text fontSize="sm" color={textColor} pt={2}>
            Если ошибка повторяется, проверь адрес страницы или обратись к разработчику.
          </Text>
        </Stack>
      </Box>
    </Flex>
  );
};
