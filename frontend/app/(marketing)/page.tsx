import { Hero } from "./sections/Hero";
import { Problem } from "./sections/Problem";
import { HowHeronSees } from "./sections/HowHeronSees";
import { StatsStrip } from "./sections/StatsStrip";
import { FinalCta } from "./sections/FinalCta";

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <HowHeronSees />
      <StatsStrip />
      <FinalCta />
    </>
  );
}
