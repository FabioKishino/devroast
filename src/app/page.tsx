import { HomePageClient } from "./_components/home-page-client";
import { HomepageStats } from "./_components/homepage-stats";

export default function HomePage() {
  return <HomePageClient stats={<HomepageStats />} />;
}
