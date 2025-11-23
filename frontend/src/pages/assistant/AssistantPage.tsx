import React, { useEffect, useRef } from 'react';
import { Box, Flex, Image } from '@chakra-ui/react';
import { Assistant } from '@/components/assistant/Assistant'; 
import { useColorModeValue } from '@/components/ui/color-mode'; 
import AiratOnBarrel from "@lib/assets/images/AiratOnBarrel.png";

const AssistantPage: React.FC = () => {
  const textColor = useColorModeValue('black', 'white');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Градиенты убраны для прозрачности
  // const sidebarGradient = useColorModeValue(
  //   "linear(to-br, purple.600, blue.600, teal.400)",
  //   "linear(to-br, gray.800, gray.700, gray.600)" 
  // );

  useEffect(() => {
    if (!chatContainerRef.current) return;

    const observer = new MutationObserver(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    });

    observer.observe(chatContainerRef.current, {
      childList: true,
      subtree: true, 
      characterData: true
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Flex
      w="100%"     
      bg="transparent" // Уже был прозрачным
      p={{ base: 0, lg: 6 }}
      flex="1"
      align="flex-start"
    >
      <Flex
        w="100%"
        minH={{ base: 'auto', lg: '80vh' }}
        bg="transparent" // Уже был прозрачным
        borderRadius={{ base: '0', lg: '3xl' }}
        overflow="hidden"
        flexDirection={{ base: 'column', lg: 'row' }}
      >
        <Box
          w={{ base: '0', lg: '20%', xl: '18%' }}
          display={{ base: 'none', lg: 'flex' }}
          bg="transparent" // Сделали фон прозрачным
          position="relative"
          flexDirection="column"
          color={textColor}
          overflow="hidden"
          minH="full"
        >
          {/* Box с фоновым паттерном (opacity 0.1) удален для полной прозрачности */}

          <Box 
            w="full" 
            p={8} 
            mt={10} 
            zIndex={1}
            flexGrow={1}
          >
            <Box w="full" h="200px" />
          </Box>

          <Box
            position="sticky"
            bottom="0" 
            w="full"
            display="flex"
            justifyContent="center"
            zIndex={0}
            pb={0}
          >
            <Box w="90%" maxW="300px">
                <Image 
                  src={AiratOnBarrel} 
                  w="100%" 
                  h="auto" 
                  objectFit="contain"
                />
            </Box>
          </Box>
        </Box>

        <Box 
          flex="1" 
          bg="transparent" // Убедились, что фон прозрачен
          position="relative"
          ref={chatContainerRef}
        >
          <Assistant />
        </Box>
      </Flex>
    </Flex>
  );
};

export default AssistantPage;