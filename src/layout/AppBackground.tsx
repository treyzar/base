import React from "react"
import { Box } from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"

const GlowingOrb = ({ color, size, ...props }: any) => {
  return (
    <Box
      position="absolute"
      width={size}
      height={size}
      borderRadius="full"
      bg={color}
      filter="blur(120px)"
      pointerEvents="none"
      {...props}
    />
  )
}

const AppBackground = ({ children }: { children: React.ReactNode }) => {
  const bgColor = useColorModeValue("white", "black")
  const overlayColor = useColorModeValue("rgba(255, 255, 255, 1)", "rgba(0, 0, 0, 1)")

  return (
    <Box
      minH="100vh"
      w="full"
      bg={bgColor}
      position="relative"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      <Box position="absolute" inset="0" zIndex="0" overflow="hidden">
        <GlowingOrb
          color="#FFA500"
          size="700px"
          top="10%"
          left="-320px"
          opacity={0.3}
        />
        <GlowingOrb
          color="#FFA500"
          size="700px"
          bottom="10%"
          right="-320px"
          opacity={0.3}
        />

        <GlowingOrb
          color="#FF4D4D"
          size="700px"
          bottom="-320px"
          left="10%"
          opacity={0.3}
        />
        <GlowingOrb
          color="#FF4D4D"
          size="700px"
          top="-320px"
          right="10%"
          opacity={0.3}
        />
      </Box>

      <Box
        position="absolute"
        inset="0"
        zIndex="0"
        style={{
          backgroundImage: `repeating-linear-gradient(to right, ${overlayColor}, ${overlayColor} 2px, transparent 2px, transparent 30px)`,
          pointerEvents: "none"
        }}
      />

      <Box position="relative" zIndex="1" flex="1" display="flex" flexDirection="column">
        {children}
      </Box>
    </Box>
  )
}

export default AppBackground