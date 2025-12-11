import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, firebaseEnabled } from "@/integrations/firebase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Clock, ArrowLeft } from "lucide-react";
import { collection, getDocs, orderBy, query, limit, where, doc, getDoc } from "firebase/firestore";
import { getDemoSceneById, DEMO_SCENES } from "@/lib/demoScenes";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface LeaderboardEntry {
  id: string;
  playerName: string;
  sceneTitle: string;
  sceneId: string;
  score: number;
  itemsFound: number;
  totalItems: number;
  timeLeft: number;
  energyLeft: number;
  completedAt: any;
}

const Leaderboard = () => {
  const { sceneId } = useParams<{ sceneId?: string }>();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sceneTitle, setSceneTitle] = useState<string>("");
  const navigate = useNavigate();

  const calculateScore = (entry: LeaderboardEntry) => {
    // Score calculation: base points + time bonus + energy bonus
    const baseScore = entry.itemsFound * 100;
    const timeBonus = entry.timeLeft * 5;
    const energyBonus = entry.energyLeft * 10;
    return baseScore + timeBonus + energyBonus;
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Reload leaderboard when component becomes visible (user navigates to this page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page became visible, reloading leaderboard...");
        loadLeaderboard();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const loadLeaderboard = async () => {
    if (!firebaseEnabled || !db) {
      // Demo leaderboard data - filter by scene if provided
      let demoData: LeaderboardEntry[] = [];
      
      if (sceneId) {
        const demoScene = getDemoSceneById(sceneId);
        if (demoScene) {
          setSceneTitle(demoScene.title);
          // Generate demo scores for this specific scene
          demoData = [
            {
              id: `demo-${sceneId}-1`,
              playerName: "Treasure Master",
              sceneTitle: demoScene.title,
              sceneId: sceneId,
              score: 950,
              itemsFound: demoScene.items.length,
              totalItems: demoScene.items.length,
              timeLeft: 45,
              energyLeft: 15,
              completedAt: new Date().toISOString(),
            },
            {
              id: `demo-${sceneId}-2`,
              playerName: "Explorer Elite",
              sceneTitle: demoScene.title,
              sceneId: sceneId,
              score: 880,
              itemsFound: demoScene.items.length,
              totalItems: demoScene.items.length,
              timeLeft: 30,
              energyLeft: 12,
              completedAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: `demo-${sceneId}-3`,
              playerName: "Riddle Solver",
              sceneTitle: demoScene.title,
              sceneId: sceneId,
              score: 820,
              itemsFound: demoScene.items.length,
              totalItems: demoScene.items.length,
              timeLeft: 20,
              energyLeft: 10,
              completedAt: new Date(Date.now() - 7200000).toISOString(),
            },
          ];
        }
      } else {
        // All scenes leaderboard
        DEMO_SCENES.forEach((scene, idx) => {
          demoData.push({
            id: `demo-all-${idx}-1`,
            playerName: `Top Player ${idx + 1}`,
            sceneTitle: scene.title,
            sceneId: scene.id,
            score: 950 - (idx * 30),
            itemsFound: scene.items.length,
            totalItems: scene.items.length,
            timeLeft: 45 - (idx * 5),
            energyLeft: 15 - (idx * 2),
            completedAt: new Date(Date.now() - idx * 3600000).toISOString(),
          });
        });
      }
      
      setEntries(demoData);
      setLoading(false);
      return;
    }

    try {
      console.log("Loading leaderboard from Firestore...");
      let snapshot;
      
      try {
        // Try to query with orderBy first (requires index)
        let leaderboardQuery;
      if (sceneId) {
        // Filter by scene
        leaderboardQuery = query(
          collection(db, "leaderboard"),
          where("sceneId", "==", sceneId),
          orderBy("score", "desc"),
          limit(50)
        );
        
        // Get scene title
        const sceneRef = doc(db, "scenes", sceneId);
        const sceneSnap = await getDoc(sceneRef);
        if (sceneSnap.exists()) {
          setSceneTitle(sceneSnap.data().title);
        }
      } else {
        // All scenes
        leaderboardQuery = query(
            collection(db, "leaderboard"),
            orderBy("score", "desc"),
            limit(50)
          );
      }
      
        snapshot = await getDocs(leaderboardQuery);
      } catch (indexError: any) {
        // If index is missing, fall back to getting all docs and sorting in memory
        if (indexError.code === "failed-precondition") {
          console.warn("Firestore index missing. Fetching all entries and sorting in memory...");
          console.warn("To fix: Create a composite index for 'leaderboard' collection with 'score' field (descending)");
          const allDocs = await getDocs(collection(db, "leaderboard"));
          snapshot = allDocs;
        } else {
          throw indexError;
        }
      }
      
      console.log(`Found ${snapshot.docs.length} leaderboard entries`);
      let leaderboardData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Leaderboard entry:", { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data,
        };
      }) as LeaderboardEntry[];
      
      // Sort by score descending if we didn't use orderBy
      leaderboardData = leaderboardData.sort((a, b) => {
        const scoreA = a.score || calculateScore(a);
        const scoreB = b.score || calculateScore(b);
        return scoreB - scoreA;
      });
      
      // Limit to top 50
      leaderboardData = leaderboardData.slice(0, 50);
      
      setEntries(leaderboardData || []);
      console.log("Leaderboard loaded successfully:", leaderboardData.length, "entries");
    } catch (error: any) {
      console.error("Error loading leaderboard:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "Unknown";
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "Unknown";
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{index + 1}</span>;
  };

  const getRankColor = (index: number) => {
    if (index === 0) return "border-yellow-500 bg-yellow-500/10";
    if (index === 1) return "border-gray-400 bg-gray-400/10";
    if (index === 2) return "border-amber-600 bg-amber-600/10";
    return "border-border";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-glow/5 to-ocean-blue/10 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          {sceneId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/leaderboard")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Scenes Leaderboard
            </Button>
          )}
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-treasure-gold to-amber-glow bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <p className="text-xl text-muted-foreground">
              {sceneId && sceneTitle ? `${sceneTitle} - Top Players` : "Top Treasure Hunters"}
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading leaderboard..." />
        ) : entries.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">No scores yet</p>
            <p className="text-sm text-muted-foreground mb-6">Be the first to complete a scene and claim the top spot!</p>
            <Button onClick={() => navigate("/scenes")} className="bg-gradient-to-r from-treasure-gold to-amber-glow">
              Play Now
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => {
              const score = entry.score || calculateScore(entry);
              return (
                <Card
                  key={entry.id}
                  className={`border-2 transition-all hover:shadow-lg ${getRankColor(index)}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {getRankIcon(index)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-foreground truncate">
                            {entry.playerName}
                          </h3>
                          <span className="text-2xl font-bold text-treasure-gold">
                            {score.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {!sceneId && <span className="font-medium">{entry.sceneTitle}</span>}
                          <span className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            {entry.itemsFound}/{entry.totalItems} items
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {entry.timeLeft}s remaining
                          </span>
                          <span>⚡ {entry.energyLeft} energy</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.completedAt)}
                        </p>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/play/${entry.sceneId}`)}
                          >
                            Play Scene
                          </Button>
                          {!sceneId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/leaderboard/${entry.sceneId}`)}
                            >
                              View Scene LB
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center space-y-4">
          <Card className="p-6 bg-gradient-to-r from-amber-glow/10 to-treasure-gold/10">
            <CardHeader>
              <CardTitle>How Scoring Works</CardTitle>
              <CardDescription>
                Compete for the top spots on the leaderboard
              </CardDescription>
            </CardHeader>
            <CardContent className="text-left space-y-2">
              <p className="text-sm">
                <strong>Base Score:</strong> 100 points per item found
              </p>
              <p className="text-sm">
                <strong>Time Bonus:</strong> 5 points per second remaining
              </p>
              <p className="text-sm">
                <strong>Energy Bonus:</strong> 10 points per energy point remaining
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Complete scenes faster and with more energy to maximize your score!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

