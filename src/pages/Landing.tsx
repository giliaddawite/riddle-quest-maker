import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import scene1Image from "@/lib/scene1.png";
import scene2Image from "@/lib/scene2.png";
import scene3Image from "@/lib/scene3.png";
import { 
  Play, 
  Clock, 
  Trophy, 
  Zap, 
  Users, 
  Target, 
  MapPin, 
  Search, 
  Timer,
  Sparkles,
  Compass,
  Star,
  ChevronRight,
  ArrowRight,
  Home
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const demoSectionRef = useRef<HTMLDivElement>(null);

  // Auto-rotate screenshots
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll("[data-animate]");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToDemo = () => {
    demoSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const screenshots = [
    {
      title: "Solve Clever Riddles",
      description: "Use your wits to decipher clues and locate hidden treasures",
      gradient: "from-blue-600 to-purple-600",
    },
    {
      title: "Race Against Time",
      description: "Beat the clock and maximize your score with strategic gameplay",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      title: "Compete Globally",
      description: "Climb the leaderboards and prove you're the ultimate treasure seeker",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "Create Your Own Scenes",
      description: "Build custom challenges and share them with the community",
      gradient: "from-rose-500 to-pink-600",
    },
  ];

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Create Custom Scenes",
      description: "Design your own hidden object challenges with custom images and riddles",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Randomized Every Time",
      description: "Each playthrough offers a unique experience with dynamic item placement",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Strategic Energy System",
      description: "Manage your energy wisely - use hints strategically to maximize your score",
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Global Leaderboards",
      description: "Compete with players worldwide and see how you rank",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Challenge Friends",
      description: "Share your scenes and compete with friends on the same challenges",
    },
    {
      icon: <Timer className="w-8 h-8" />,
      title: "Multiple Difficulty Levels",
      description: "From beginner-friendly to expert challenges, there's something for everyone",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Pick Your Scene",
      description: "Browse themed challenges from space pirates to wild west adventures",
      icon: <Compass className="w-12 h-12" />,
    },
    {
      number: "2",
      title: "Solve & Seek",
      description: "Use riddles to find hidden items before time runs out",
      icon: <Search className="w-12 h-12" />,
    },
    {
      number: "3",
      title: "Beat the Clock",
      description: "Climb the leaderboard and compete for the top spot",
      icon: <Trophy className="w-12 h-12" />,
    },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-glow/5 to-ocean-blue/10">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-20 h-20 bg-treasure-gold/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-amber-glow/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-treasure-gold/20 rounded-full blur-xl animate-pulse delay-2000"></div>
          <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-ocean-blue/20 rounded-full blur-2xl animate-pulse delay-3000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-6 animate-fade-in">
            <div className="inline-block mb-4">
              <Compass className="w-16 h-16 text-treasure-gold mx-auto animate-spin-slow" />
            </div>
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-treasure-gold via-amber-glow to-ocean-blue bg-clip-text text-transparent animate-fade-in-up">
              Treasure Seeker
            </h1>
            <p className="text-xl md:text-3xl text-foreground mb-8 font-light animate-fade-in-up delay-200">
              Find Hidden Objects. Solve Riddles. Race Against Time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-400">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-gradient-to-r from-treasure-gold to-amber-glow hover:from-treasure-gold/90 hover:to-amber-glow/90 text-primary-foreground text-xl px-8 py-6 rounded-full shadow-[var(--shadow-treasure)] transition-all transform hover:scale-105"
              >
                <Play className="w-6 h-6 mr-2" />
                Play Now
              </Button>
              <Button
                onClick={scrollToDemo}
                size="lg"
                variant="outline"
                className="border-2 border-ocean-blue text-ocean-blue hover:bg-ocean-blue/10 text-xl px-8 py-6 rounded-full"
              >
                Watch How It Works
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section
        ref={demoSectionRef}
        className="py-16 bg-gradient-to-b from-background to-card"
        data-animate
        id="demo"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-3 text-foreground">
            See It In Action
          </h2>
          <p className="text-lg text-center text-muted-foreground mb-8">
            Experience the thrill of treasure hunting
          </p>

          <div className="relative max-w-5xl mx-auto">
            {/* Game UI Mockup */}
            <div className="bg-card rounded-2xl shadow-[var(--shadow-treasure)] border-2 border-primary/20 p-6">
              {/* Title Bar */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-treasure-gold to-amber-glow bg-clip-text text-transparent">
                  The Ancient Temple
                </h3>
                <Button variant="outline" size="sm" className="border-ocean-blue text-ocean-blue">
                  <Home className="w-4 h-4 mr-2" />
                  Exit
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Card className="p-3 bg-gradient-to-br from-card to-background border-primary/20">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-ocean-blue" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Time</p>
                      <Progress value={65} className="h-1.5 mt-1" />
                      <p className="text-xs text-muted-foreground mt-0.5">45s</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-card to-background border-primary/20">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-glow" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Energy</p>
                      <Progress value={75} className="h-1.5 mt-1" />
                      <p className="text-xs text-muted-foreground mt-0.5">15/20</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-card to-background border-primary/20">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-treasure-gold" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Found</p>
                      <Progress value={66} className="h-1.5 mt-1" />
                      <p className="text-xs text-muted-foreground mt-0.5">2/3</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Riddle Card */}
              <Card className="p-4 mb-4 bg-gradient-to-r from-amber-glow/10 to-treasure-gold/10 border-2 border-primary/30">
                <p className="text-xs font-medium text-muted-foreground mb-1">Current Riddle:</p>
                <p className="text-base italic text-foreground">
                  "I shine bright but hide in shadow, found where ancient secrets flow"
                </p>
              </Card>

              {/* Game Scene */}
              <div className="relative border-4 border-primary/30 rounded-lg overflow-hidden shadow-lg aspect-video mb-4">
                {/* Random Background Image - cycles through demo scenes */}
                <div 
                  className="w-full h-full bg-cover bg-center relative transition-all duration-1000"
                  style={{
                    backgroundImage: `url(${
                      currentSlide === 0 ? scene1Image : 
                      currentSlide === 1 ? scene2Image : 
                      currentSlide === 2 ? scene3Image : 
                      scene1Image
                    })`,
                  }}
                >
                  {/* Overlay for better visibility of UI elements */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20"></div>
                  
                  {/* Hidden Items Overlay - Found Items */}
                  <div className="absolute top-[20%] left-[30%] w-16 h-16 border-2 border-treasure-gold bg-treasure-gold/30 rounded animate-pulse backdrop-blur-sm">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-treasure-gold drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="absolute top-[60%] right-[25%] w-16 h-16 border-2 border-treasure-gold bg-treasure-gold/30 rounded animate-pulse backdrop-blur-sm">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Star className="w-8 h-8 text-treasure-gold drop-shadow-lg" />
                    </div>
                  </div>
                  
                  {/* Hidden Item - Not Found Yet (with hint glow) */}
                  <div className="absolute bottom-[30%] left-[50%] transform -translate-x-1/2">
                    <div className="w-32 h-32 rounded-full border-4 border-amber-400 bg-amber-400/20 animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.8)] backdrop-blur-sm">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-amber-400 drop-shadow-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hint Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="bg-gradient-to-r from-amber-glow/20 to-treasure-gold/20 border-2 border-primary/30"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Hint (5 energy)
                </Button>
              </div>

              {/* Caption */}
              <div className="mt-6 text-center">
                <p className="text-sm font-medium text-foreground mb-1">
                  {screenshots[currentSlide].title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {screenshots[currentSlide].description}
                </p>
              </div>
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {screenshots.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    currentSlide === index
                      ? "w-8 bg-treasure-gold"
                      : "w-2 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section
        className="py-16 bg-gradient-to-b from-card to-background"
        data-animate
        id="features"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-3 text-foreground">
            Why Treasure Seeker?
          </h2>
          <p className="text-lg text-center text-muted-foreground mb-12">
            Everything you need for the ultimate treasure hunting experience
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 bg-card border-2 border-primary/20 hover:border-primary/50 transition-all transform hover:scale-105 hover:shadow-[var(--shadow-treasure)]"
                data-animate
              >
                <div className="text-treasure-gold mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-b from-background via-amber-glow/5 to-ocean-blue/10" data-animate id="how-it-works">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-3 text-foreground">
            How It Works
          </h2>
          <p className="text-lg text-center text-muted-foreground mb-12">
            Start your treasure hunting adventure in three simple steps
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div
                key={index}
                className="text-center"
                data-animate
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-treasure-gold to-amber-glow rounded-full flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-[var(--shadow-treasure)]">
                    {step.number}
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-treasure-gold">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-background via-amber-glow/10 to-ocean-blue/10 relative overflow-hidden" data-animate id="cta">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="mb-8">
            <Star className="w-12 h-12 text-treasure-gold mx-auto mb-4 animate-pulse" />
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-treasure-gold via-amber-glow to-ocean-blue bg-clip-text text-transparent">
              Ready to Start Your Adventure?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of treasure seekers competing for glory
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="bg-gradient-to-r from-treasure-gold to-amber-glow hover:from-treasure-gold/90 hover:to-amber-glow/90 text-primary-foreground text-xl px-10 py-7 rounded-full shadow-[var(--shadow-treasure)] transition-all transform hover:scale-105"
            >
              <Play className="w-7 h-7 mr-3" />
              Play Treasure Seeker Now
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            
            <p className="text-muted-foreground text-base mt-2">
              Sign in with Google to save your progress
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 mt-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-treasure-gold" />
                <span className="text-sm">Free to play</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-treasure-gold" />
                <span className="text-sm">Create unlimited scenes</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-treasure-gold" />
                <span className="text-sm">Compete worldwide</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-primary/20 py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-sm">© 2024 Treasure Seeker. Embark on your adventure today.</p>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-400 {
          animation-delay: 0.4s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        .delay-2000 {
          animation-delay: 2s;
        }

        .delay-3000 {
          animation-delay: 3s;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        [data-animate] {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }

        [data-animate].visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default Landing;

