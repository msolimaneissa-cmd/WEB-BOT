import { Header } from "@/components/header";
import { HeroSection } from "@/components/landing/hero-section";
import { RulesSection } from "@/components/landing/rules-section";
import { TeamSection } from "@/components/landing/team-section";
import { PartnersSection } from "@/components/landing/partners-section";
import { StreamersSection } from "@/components/landing/streamers-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCommunitySettings, getRules, getTeam, getStreamers, getPartners } from "@/lib/fetch-data";

export default async function Home() {
  const [
    communitySettings, 
    rules,
    team,
    streamers,
    partners,
  ] = await Promise.all([
    getCommunitySettings(),
    getRules(),
    getTeam(),
    getStreamers(),
    getPartners(),
  ]);

  return (
    <>
      <Header />
      <main className="flex-grow">
        <HeroSection communitySettings={communitySettings} />
        <StreamersSection initialStreamers={streamers} />
        <Suspense fallback={<Skeleton className="h-96 w-full my-20" />}>
          <RulesSection initialRules={rules} />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-96 w-full my-20" />}>
          <TeamSection initialTeam={team} />
        </Suspense>
        <PartnersSection initialPartners={partners} />
        <CtaSection />
      </main>
    </>
  );
}
