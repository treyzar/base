import React from "react"
import { Box, Text, Flex } from "@chakra-ui/react"

const Footer = () => {
  return (
    <Box 
      as="footer"
      w="full"
      py={4}
      px={8}
      bg="bg.panel" 
      borderTopWidth="1px"
      borderColor="border.muted"
    >
      <Flex 
        justify="center"
        align="center"
        h="full"
      >
        <Text 
          fontSize="sm" 
          color="fg.subtle"
          textAlign="center"
        >
          Powered by FSP Chuvashia
        </Text>
      </Flex>
    </Box>
  )
}

export default Footer;