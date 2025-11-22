import { useState, useEffect } from 'react';
import { Flex, HStack, Link, Box } from '@chakra-ui/react';
import { ColorModeButton } from '@components/ui/color-mode';
import { Image } from '@chakra-ui/react';
import logo from '@lib/assets/images/LogoHeader.svg';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const links = [
    { label: 'Главная', href: '#' },
    { label: 'О нас', href: '#' },
    { label: 'Контакты', href: '#' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      bg="bg.panel"
      backdropFilter={isScrolled ? 'blur(10px)' : 'none'}
      opacity={isScrolled ? 0.7 : 1}
      transition="all 0.3s"
      position="sticky"
      top={0}
      zIndex="sticky"
    >
      <Box>
        <Image src={logo} boxSize="40px" cursor={'pointer'}></Image>
      </Box>

      <HStack gap={8} display={{ base: 'none', md: 'flex' }}>
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            fontWeight="medium"
            _hover={{ textDecoration: 'none', color: 'fg.subtle' }}
          >
            {link.label}
          </Link>
        ))}
      </HStack>

      <Box>
        <ColorModeButton />
      </Box>
    </Flex>
  );
};

export default Header;
