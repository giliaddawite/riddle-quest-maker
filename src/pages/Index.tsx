import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firebaseEnabled } from "@/integrations/firebase/client";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Map, Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoadingUser(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingUser(false);
      if (!firebaseUser) {
        navigate("/landing");
      }
    });

    return () => unsubscribe();
  }, [navigate, firebaseEnabled, auth]);


  if (!firebaseEnabled || !auth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-background via-amber-glow/5 to-ocean-blue/10">
        <h1 className="text-3xl font-bold">Treasure Seeker (Demo Mode)</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Firebase is disabled in this environment. You can still explore the builders and demo gameplay.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => navigate("/create")}>Create Scene</Button>
          <Button onClick={() => navigate("/scenes")} variant="outline">
            Browse Scenes
          </Button>
          <Button onClick={() => navigate("/play/demo")} variant="secondary">
            Play Demo
          </Button>
        </div>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-amber-glow/5 to-ocean-blue/10">
        <LoadingSpinner message="Checking authentication..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-glow/5 to-ocean-blue/10">
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-6xl font-bold bg-gradient-to-r from-treasure-gold via-amber-glow to-ocean-blue bg-clip-text text-transparent">
            Welcome, Explorer!
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create hidden object scenes or embark on treasure hunts crafted by fellow adventurers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/create")}
            className="group relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card to-card/50 p-8 text-left transition-all hover:border-primary hover:shadow-[var(--shadow-treasure)] hover:scale-105"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-treasure-gold to-amber-glow flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">Create Scene</h3>
              <p className="text-muted-foreground">
                Design your own treasure hunt with hidden objects and mysterious riddles
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-treasure-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => navigate("/scenes")}
            className="group relative overflow-hidden rounded-2xl border-2 border-secondary/30 bg-gradient-to-br from-card to-card/50 p-8 text-left transition-all hover:border-secondary hover:shadow-[0_10px_30px_-10px_hsl(var(--ocean-blue)/0.3)] hover:scale-105"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-ocean-blue flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Map className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">Browse Scenes</h3>
              <p className="text-muted-foreground">
                Explore treasure hunts created by the community and test your skills
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Ready to become a legendary treasure hunter?
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
