import { getHomeData } from '@/hooks/useApi';
import HomeClientPage from './HomeClientPage';
import LoadingSpinner from '@/components/LoadingSpinner';

export const dynamic = 'force-dynamic';

const HomePage = async () => {
  const homeData = await getHomeData();

  if (!homeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">Не удалось загрузить данные</p>
        </div>
      </div>
    );
  }

  return <HomeClientPage homeData={homeData} />;
};

export default HomePage;