import React from "react"
import { Flex, HStack, Link, Text, Box } from "@chakra-ui/react"
import { ColorModeButton } from "@components/ui/color-mode" 

const Header = () => {
  const links = [
    { label: "Главная", href: "#" },
    { label: "О нас", href: "#" },
    { label: "Контакты", href: "#" },
  ]

  return (
    <Flex
      as="header"
      w="full"
      align="center"
      justify="space-between"
      py={4}
      px={8}
      borderBottomWidth="1px"
      borderColor="border.muted" // Цвет границы из темы Chakra
      bg="bg.panel" // Цвет фона (меняется автоматически в темной/светлой теме)
      position="sticky"
      top={0}
      zIndex="sticky"
    >
      {/* Слева: Логотип */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" letterSpacing="tight">
          MyLogo
        </Text>
      </Box>

      {/* В центре: Ссылки */}
      {/* Используем display={{ base: 'none', md: 'flex' }}, чтобы скрыть ссылки на мобильных, если нужно */}
      <HStack gap={8} display={{ base: "none", md: "flex" }}>
        {links.map((link) => (
          <Link 
            key={link.label} 
            href={link.href} 
            fontWeight="medium"
            _hover={{ textDecoration: "none", color: "fg.subtle" }}
          >
            {link.label}
          </Link>
        ))}
      </HStack>

      {/* Справа: Кнопка смены темы */}
      <Box>
        <ColorModeButton />
      </Box>
    </Flex>
  )
}

export default Header;