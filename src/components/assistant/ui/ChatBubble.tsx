import React from 'react';
import type { ChatBubbleProps } from '@/lib';
import { useColorModeValue } from '@/components/ui/color-mode';
import { useBreakpointValue, Box } from '@chakra-ui/react';

export const ChatBubble: React.FC<ChatBubbleProps> = ({ role, children }) => {
  const isAssistant = role === 'assistant';
  const isUser = role === 'user';

  const bubbleBg = useColorModeValue(
    isAssistant ? 'white' : isUser ? 'orange.500' : 'gray.100',
    isAssistant ? 'gray.800' : isUser ? 'orange.400' : 'gray.700'
  );
  const bubbleBorder = useColorModeValue(
    isAssistant ? 'orange.100' : isUser ? 'orange.500' : 'gray.200',
    isAssistant ? 'orange.600' : isUser ? 'orange.300' : 'gray.600'
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
