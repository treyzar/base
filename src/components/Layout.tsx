import React from 'react';
import { Box, Flex } from "@chakra-ui/react"
import Header from '@components/header/Header';
import Footer from '@components/footer/Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Flex direction="column" minH="100vh"> 
      <Header />
      <Box as="main" flex="1"> 
        {children}
      </Box>
      <Footer /> 
    </Flex>
  );
};