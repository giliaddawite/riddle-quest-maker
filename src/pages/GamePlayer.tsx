import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, firebaseEnabled, auth } from "@/integrations/firebase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Heart, Clock, Home, Lightbulb } from "lucide-react";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getDemoSceneById } from "@/lib/demoScenes";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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

const TIME_PER_ITEM_SECONDS = 30;
const MIN_TOTAL_TIME_SECONDS = TIME_PER_ITEM_SECONDS * 3; // 90s safety net for very small scenes
const HINT_COST = 5; // Energy cost to use a hint

const GamePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scene, setScene] = useState<Scene | null>(null);
  const [foundItems, setFoundItems] = useState<Set<string>>(new Set());
  const [energy, setEnergy] = useState(20);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [currentRiddle, setCurrentRiddle] = useState("");
  const [hintedItemId, setHintedItemId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const scoreSubmittedRef = useRef(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadScene();
  }, [id, firebaseEnabled, db]);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (gameOver || !scene || totalTime === 0) return;

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
  }, [gameOver, scene, totalTime]);

  useEffect(() => {
    if (scene && foundItems.size === scene.items.length && scene.items.length > 0) {
      setWon(true);
      setGameOver(true);
      toast({ title: "Victory!", description: "You found all the treasures!" });
    }
  }, [foundItems, scene, toast]);

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

  useEffect(() => {
    // Clear hint if the hinted item is found
    if (hintedItemId && foundItems.has(hintedItemId)) {
      setHintedItemId(null);
    }
  }, [foundItems, hintedItemId]);

  const applyScene = (sceneData: Scene) => {
    setScene(sceneData);
    const itemsCount = sceneData.items?.length ?? 0;
    const calculatedTotal = Math.max(itemsCount * TIME_PER_ITEM_SECONDS, MIN_TOTAL_TIME_SECONDS);
    setTotalTime(calculatedTotal);
    setTimeLeft(calculatedTotal);
    setFoundItems(new Set());
    setGameOver(false);
    setWon(false);
    setHintedItemId(null);
    scoreSubmittedRef.current = false; // Reset score submission flag for new game
  };

  const calculateScore = useCallback((itemsFound: number, timeLeft: number, energyLeft: number): number => {
    // Same calculation as Leaderboard.tsx
    const baseScore = itemsFound * 100;
    const timeBonus = timeLeft * 5;
    const energyBonus = energyLeft * 10;
    return baseScore + timeBonus + energyBonus;
  }, []);

  const submitScoreToLeaderboard = useCallback(async () => {
    // Prevent duplicate submissions
    if (scoreSubmittedRef.current) {
      console.log("Score already submitted, skipping duplicate submission");
      return;
    }

    // Only submit if Firebase is enabled, user is authenticated, and scene is loaded
    if (!firebaseEnabled) {
      console.log("Firebase not enabled, skipping score submission");
      return;
    }

    if (!db) {
      console.log("Firestore database not available, skipping score submission");
      return;
    }

    if (!auth) {
      console.log("Firebase auth not available, skipping score submission");
      return;
    }

    if (!user) {
      console.log("User not authenticated, skipping score submission");
      console.log("Current auth state:", auth.currentUser ? "authenticated" : "not authenticated");
      return;
    }

    if (!scene) {
      console.log("Scene not loaded, skipping score submission");
      return;
    }

    if (!id) {
      console.log("Scene ID not available, skipping score submission");
      return;
    }

    // Set flag to prevent duplicate submissions during the async operation
    // Only set it after all validation checks pass
    scoreSubmittedRef.current = true;

    try {
      const itemsFound = foundItems.size;
      const totalItems = scene.items.length;
      const score = calculateScore(itemsFound, timeLeft, energy);

      console.log("Submitting score to leaderboard:", {
        itemsFound,
        totalItems,
        timeLeft,
        energy,
        score,
        sceneId: id,
        sceneTitle: scene.title,
      });

      // Get user's display name or fallback to email or "Anonymous"
      const playerName = user.displayName || user.email?.split("@")[0] || "Anonymous";

      const leaderboardEntry = {
        playerName,
        sceneTitle: scene.title,
        sceneId: id,
        score,
        itemsFound,
        totalItems,
        timeLeft,
        energyLeft: energy,
        completedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "leaderboard"), leaderboardEntry);
      console.log("Score submitted successfully with document ID:", docRef.id);
      
      toast({
        title: "Score submitted!",
        description: `Your score of ${score.toLocaleString()} has been added to the leaderboard!`,
      });
    } catch (error: any) {
      console.error("Error submitting score to leaderboard:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      // Reset flag on error so user can try again
      scoreSubmittedRef.current = false;
      toast({
        title: "Failed to submit score",
        description: error.message || "Your score couldn't be added to the leaderboard, but great job completing the challenge!",
        variant: "destructive",
      });
    }
  }, [firebaseEnabled, db, auth, user, scene, id, foundItems.size, timeLeft, energy, calculateScore, toast]);

  useEffect(() => {
    // Submit score to leaderboard when game is won
    console.log("Score submission useEffect triggered:", { won, hasScene: !!scene, alreadySubmitted: scoreSubmittedRef.current, user: user?.email || "not authenticated" });
    if (won && scene && !scoreSubmittedRef.current) {
      console.log("Conditions met! Submitting score...");
      // Don't set flag yet - let the function handle it after successful submission
      submitScoreToLeaderboard();
    } else {
      if (!won) console.log("Score submission skipped: game not won yet");
      if (!scene) console.log("Score submission skipped: scene not loaded");
      if (scoreSubmittedRef.current) console.log("Score submission skipped: already submitted");
    }
  }, [won, scene, submitScoreToLeaderboard, user]);

  const loadScene = async () => {
    // Check if this is a demo scene (when Firebase is disabled or explicit demo ID)
    if (!firebaseEnabled || !db) {
      if (id) {
        const demoScene = getDemoSceneById(id);
        if (demoScene) {
          applyScene({
            title: demoScene.title,
            background_url: demoScene.background_url,
            items: demoScene.items,
          });
          return;
        }
      }
      // Fallback to first demo scene if no ID or scene not found
      const firstDemo = getDemoSceneById("scene-1");
      if (firstDemo) {
        applyScene({
          title: firstDemo.title,
          background_url: firstDemo.background_url,
          items: firstDemo.items,
        });
      }
      return;
    }

    try {
      if (!id) {
        throw new Error("Scene id is missing");
      }
      const sceneRef = doc(db, "scenes", id);
      const sceneSnap = await getDoc(sceneRef);
      if (!sceneSnap.exists()) {
        throw new Error("Scene not found");
      }
      applyScene(sceneSnap.data() as Scene);
    } catch (error) {
      console.error("Error loading scene:", error);
      toast({ title: "Unable to load scene", description: "Returning to scene browser." });
      navigate("/scenes");
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

  const useHint = () => {
    if (gameOver || !scene || energy < HINT_COST) {
      if (energy < HINT_COST) {
        toast({ title: "Not enough energy!", description: `Hints cost ${HINT_COST} energy.`, variant: "destructive" });
      }
      return;
    }

    const unfoundItems = scene.items.filter(item => !foundItems.has(item.id));
    if (unfoundItems.length === 0) {
      toast({ title: "All items found!", description: "No hints needed!" });
      return;
    }

    // Pick a random unfound item to hint
    const randomItem = unfoundItems[Math.floor(Math.random() * unfoundItems.length)];
    setHintedItemId(randomItem.id);
    setEnergy(prev => Math.max(0, prev - HINT_COST));
    toast({ title: "Hint activated!", description: "Look for the glowing circle!" });
  };

  if (!scene) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-ocean-blue/10">
        <LoadingSpinner message="Loading scene..." size="lg" />
      </div>
    );
  }

  const progress = (foundItems.size / scene.items.length) * 100;
  const energyPercent = (energy / 20) * 100;
  const timePercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

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

        <div className="flex gap-4">
          <Card className="flex-1 p-4 bg-gradient-to-r from-amber-glow/10 to-treasure-gold/10 border-2 border-primary/30">
            <p className="text-sm font-medium text-muted-foreground mb-1">Current Riddle:</p>
            <p className="text-lg italic text-foreground">{currentRiddle || "Find all the treasures!"}</p>
          </Card>
          {!gameOver && (
            <Button
              onClick={useHint}
              disabled={energy < HINT_COST || foundItems.size === scene.items.length}
              variant="outline"
              className="bg-gradient-to-r from-amber-glow/20 to-treasure-gold/20 border-2 border-primary/30"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Hint ({HINT_COST} energy)
            </Button>
          )}
        </div>

        <div className="relative border-4 border-primary/30 rounded-lg overflow-hidden shadow-[var(--shadow-treasure)]">
          <img
            ref={imageRef}
            src={scene.background_url}
            alt="Scene"
            onClick={handleClick}
            className={`w-full ${gameOver ? 'cursor-default' : 'cursor-crosshair'}`}
          />
          {scene.items.map((item) => {
            // Show found items
            if (foundItems.has(item.id)) {
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
            }
            // Show hint circle
            if (hintedItemId === item.id) {
              const centerX = item.x + item.width / 2;
              const centerY = item.y + item.height / 2;
              const radius = Math.max(item.width, item.height) * 2; // Circle is 4x (400%) as large as the item
              return (
                <div
                  key={`hint-${item.id}`}
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: `${centerX - radius}%`,
                    top: `${centerY - radius}%`,
                    width: `${radius * 2}%`,
                    height: `${radius * 2}%`,
                  }}
                >
                  <div className="w-full h-full rounded-full border-4 border-amber-400 bg-amber-400/20 animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.8)]" />
                </div>
              );
            }
            return null;
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