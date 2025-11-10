import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Heart, Clock, Home } from "lucide-react";

interface HiddenItem {
  id: string;
  name: string;
  riddle: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Scene {
  title: string;
  background_url: string;
  items: HiddenItem[];
}

const GamePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scene, setScene] = useState<Scene | null>(null);
  const [foundItems, setFoundItems] = useState<Set<string>>(new Set());
  const [energy, setEnergy] = useState(20);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [currentRiddle, setCurrentRiddle] = useState("");
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadScene();
  }, [id]);

  useEffect(() => {
    if (gameOver || !scene) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          toast({ title: "Time's up!", description: "Better luck next time!", variant: "destructive" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, scene]);

  useEffect(() => {
    if (scene && foundItems.size === scene.items.length && scene.items.length > 0) {
      setWon(true);
      setGameOver(true);
      toast({ title: "Victory!", description: "You found all the treasures!" });
    }
  }, [foundItems, scene]);

  useEffect(() => {
    if (energy <= 0) {
      setGameOver(true);
      toast({ title: "Out of energy!", description: "Better luck next time!", variant: "destructive" });
    }
  }, [energy]);

  useEffect(() => {
    if (scene && scene.items.length > 0) {
      const unfoundItems = scene.items.filter(item => !foundItems.has(item.id));
      if (unfoundItems.length > 0) {
        const randomItem = unfoundItems[Math.floor(Math.random() * unfoundItems.length)];
        setCurrentRiddle(randomItem.riddle);
      }
    }
  }, [scene, foundItems]);

  const loadScene = async () => {
    try {
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setScene(data as any);
    } catch (error) {
      console.error('Error loading scene:', error);
      navigate('/scenes');
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (gameOver || !imageRef.current || !scene) return;

    const rect = imageRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    let found = false;
    for (const item of scene.items) {
      if (foundItems.has(item.id)) continue;

      const inX = clickX >= item.x && clickX <= item.x + item.width;
      const inY = clickY >= item.y && clickY <= item.y + item.height;

      if (inX && inY) {
        setFoundItems(new Set([...foundItems, item.id]));
        toast({ title: `Found: ${item.name}!`, description: "Great discovery!" });
        found = true;
        break;
      }
    }

    if (!found) {
      setEnergy(prev => Math.max(0, prev - 1));
    }
  };

  if (!scene) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const progress = (foundItems.size / scene.items.length) * 100;
  const energyPercent = (energy / 20) * 100;
  const timePercent = (timeLeft / 60) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-ocean-blue/10 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-treasure-gold to-amber-glow bg-clip-text text-transparent">
            {scene.title}
          </h1>
          <Button onClick={() => navigate("/scenes")} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <Clock className={`w-6 h-6 ${timeLeft < 20 ? 'text-destructive animate-pulse' : 'text-accent'}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">Time</p>
              <Progress value={timePercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{timeLeft}s</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <Heart className={`w-6 h-6 ${energy < 5 ? 'text-destructive animate-pulse' : 'text-destructive'}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">Energy</p>
              <Progress value={energyPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{energy}/20</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-treasure-gold" />
            <div className="flex-1">
              <p className="text-sm font-medium">Found</p>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{foundItems.size}/{scene.items.length}</p>
            </div>
          </Card>
        </div>

        <Card className="p-4 bg-gradient-to-r from-amber-glow/10 to-treasure-gold/10 border-2 border-primary/30">
          <p className="text-sm font-medium text-muted-foreground mb-1">Current Riddle:</p>
          <p className="text-lg italic text-foreground">{currentRiddle || "Find all the treasures!"}</p>
        </Card>

        <div className="relative border-4 border-primary/30 rounded-lg overflow-hidden shadow-[var(--shadow-treasure)]">
          <img
            ref={imageRef}
            src={scene.background_url}
            alt="Scene"
            onClick={handleClick}
            className={`w-full ${gameOver ? 'cursor-default' : 'cursor-crosshair'}`}
          />
          {foundItems.size > 0 && scene.items.map((item) => {
            if (!foundItems.has(item.id)) return null;
            return (
              <div
                key={item.id}
                className="absolute border-2 border-treasure-gold bg-treasure-gold/30 rounded animate-pulse"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.width}%`,
                  height: `${item.height}%`,
                }}
              />
            );
          })}
        </div>

        {gameOver && (
          <Card className="p-8 text-center border-4 border-primary/50">
            <Trophy className={`w-16 h-16 mx-auto mb-4 ${won ? 'text-treasure-gold animate-bounce' : 'text-muted-foreground'}`} />
            <h2 className="text-3xl font-bold mb-2">{won ? "Victory!" : "Game Over"}</h2>
            <p className="text-lg text-muted-foreground mb-4">
              {won ? "You found all the treasures!" : "Better luck next time!"}
            </p>
            <p className="text-sm mb-6">Found {foundItems.size} of {scene.items.length} items</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-treasure-gold to-amber-glow">
                Play Again
              </Button>
              <Button onClick={() => navigate("/scenes")} variant="outline">
                Browse Scenes
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GamePlayer;