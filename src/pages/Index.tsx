
import Hero from "@/components/Hero";
import NavBar from "@/components/NavBar";
import { AuroraBackground } from "@/components/ui/aurora-background";

const Index = () => {
  return (
    <div className="min-h-screen">
      <NavBar />
      <AuroraBackground>
        <main>
          <Hero />
        </main>
      </AuroraBackground>
    </div>
  );
};

export default Index;
