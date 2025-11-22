import { useColorMode } from '@/components/ui/color-mode';
import { Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
const HomePage = () => {
  const navigate = useNavigate();
  const { toggleColorMode } = useColorMode();
  return (
    <div>
      <Button
        variant="outline"
        onClick={() => {
          toggleColorMode();
        }}
      >
        Изменить
      </Button>
      <Button variant="outline" onClick={() => navigate('https://www.stoloto.ru/oxota-vyzov')}>
        Перейти
      </Button>
    </div>
  );
};

export default HomePage;
