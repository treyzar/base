import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Header from '@components/header/Header';
import Footer from '@components/footer/Footer';
import AppBackground from '@/components/layout/AppBackground';
import { LayoutProps } from '@lib';

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AppBackground>
      <Flex direction="column" minH="100vh">
        <Header />
        <Box as="main" flex="1" display="flex" flexDirection="column" pt="60px">
          {children}
        </Box>
        <Footer />
      </Flex>
    </AppBackground>
  );
};