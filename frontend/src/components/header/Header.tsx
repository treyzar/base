import { Flex, HStack, Link, Box, Text } from '@chakra-ui/react';
import { ColorModeButton, useColorMode, useColorModeValue } from '@components/ui/color-mode';
import { Image } from '@chakra-ui/react';
import { links } from '@lib';
import logoLight from '@lib/assets/images/LogoLight.svg';
import logoDark from '@lib/assets/images/LogoDark.svg';

const Header = () => {
  const { colorMode } = useColorMode();
  const logoSrc = colorMode === 'light' ? logoLight : logoDark;

  const titleColor = useColorModeValue('gray.800', '#FFF42A');

  const textStyles = {
    fontFamily: 'Unbounded, sans-serif',
    fontWeight: '600',
    fontSize: '30.25px',
    lineHeight: '50.32px',
    ml: 2,
  };

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
      position="fixed"
      top={0}
      zIndex={100}
    >
      <HStack>
        <Box>
          <Link
            key="main"
            href="/"
            border="none"
            borderWidth={0}
            outline="none"
            boxShadow="none"
            _focus={{
              boxShadow: 'none',
              outline: 'none',
              border: 'none',
            }}
          >
            <Image
              src={logoSrc}
              boxSize="40px"
              cursor={'pointer'}
              opacity={0.85}
              border="none"
              borderWidth={0}
              outline="none"
              boxShadow="none"
            ></Image>
          </Link>
        </Box>
        <Text color={titleColor} {...textStyles}>
          Триумф
        </Text>
      </HStack>

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
