import { HomeSection } from '../components/HomeSection';
import { FavoriteSection } from '../components/FavoritesSection';
import { FeaturedLeaguesSection } from '../components/FeaturedLeaguesSection';

export default function Home() {
  return (
    <main className="snap-y snap-mandatory">
      <HomeSection />
      <FavoriteSection />
      <FeaturedLeaguesSection />
    </main>
  );
}
