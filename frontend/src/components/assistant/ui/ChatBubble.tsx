import React from 'react';
import type { ChatBubbleProps } from '@/lib';
import { useColorModeValue } from '@/components/ui/color-mode';
import { useBreakpointValue, Box } from '@chakra-ui/react';

export const ChatBubble: React.FC<ChatBubbleProps> = ({ role, children }) => {
  const isAssistant = role === 'assistant';
  const isUser = role === 'user';

  // Лёгкий бело-оранжевый градиент для ассистента в светлой теме
  const lightAssistantBg = 'linear-gradient(180deg, #FFFFFF 0%, #FFF7F5 100%)';
  const darkAssistantBg = '#000000';

  const bubbleBg = useColorModeValue(
    isAssistant ? lightAssistantBg : isUser ? '#FFA500' : lightAssistantBg,
    isAssistant ? darkAssistantBg : isUser ? '#FFA500' : darkAssistantBg
  );

  // Ширина рамки
  const bubbleBorderWidth = useColorModeValue(
    isAssistant ? '0px' : isUser ? '1px' : '0px',
    isAssistant ? '1px' : isUser ? '1px' : '1px'
  );

  // Цвет рамки
  const bubbleBorder = useColorModeValue(
    isUser ? '#FFA500' : 'transparent',
    isAssistant ? '#000000' : isUser ? '#FFA500' : '#000000'
  );

  const textColor = useColorModeValue(isUser ? '#000000' : '#000000', '#FFFFFF');

  // Тень для ассистента
  const bubbleShadow = useColorModeValue(
    isAssistant ? 'md' : 'none',
    isAssistant ? '0px 0px 10px rgba(255, 255, 255, 0.2)' : 'none'
  );

  const maxWidth = useBreakpointValue({ base: '100%', md: '80%' });
  const justifyContent = isUser ? 'flex-end' : isAssistant ? 'flex-start' : 'center';

  return (
    <Box display="flex" justifyContent={justifyContent}>
      <Box
        maxW={maxWidth}
        bg={bubbleBg}
        borderRadius="2xl"
        borderWidth={bubbleBorderWidth}
        borderColor={bubbleBorder}
        boxShadow={bubbleShadow}
        p={{ base: 4, md: 5 }}
        color={textColor}
      >
        {children}
      </Box>
    </Box>
  );
};
