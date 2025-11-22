import { Flex, HStack, Link, Box } from '@chakra-ui/react';
import { ColorModeButton } from '@components/ui/color-mode';
import { Image } from '@chakra-ui/react';
import { links } from '@lib';
import logo from '@lib/assets/images/LogoHeader.svg';

const Header = () => {
  return (
    <Flex
      as="header"
      w="full"
      align="center"
      justify="space-between"
      py={1}
      px={8}
      borderBottomWidth="1px"
      borderColor="border.muted"
      bg="transparent"
      backdropFilter="blur(10px)"
      transition="all 0.3s"
      position="fixed" // Ключевое изменение: Фиксируем хедер на экране
      top={0}
      zIndex={100} // Гарантируем, что хедер поверх всего
    >
      <Box>
        <Link key="main" href="/">
            <Image src={logo} boxSize="40px" cursor={'pointer'}></Image>
        </Link>
      </Box>

      <HStack gap={8} display={{ base: 'none', md: 'flex' }}>
        {links.map((link) => {
            const isExternal = link.href.startsWith('http') || link.href.includes('://');

            return (
            <Link
                key={link.label}
                href={link.href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                fontWeight="medium"
                _hover={{ textDecoration: 'none', color: 'fg.subtle' }}
            >
                {link.label}
            </Link>
            );
        })}
        </HStack>

      <Box>
        <ColorModeButton />
      </Box>
    </Flex>
  );
};

export default Header;