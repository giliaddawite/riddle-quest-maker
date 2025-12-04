import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, firebaseEnabled } from "@/integrations/firebase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Clock } from "lucide-react";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
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
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
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
      // Demo leaderboard data
      setEntries([
        {
          id: "demo-1",
          playerName: "Treasure Master",
          sceneTitle: "The Ancient Temple",
          sceneId: "scene-1",
          score: 950,
          itemsFound: 3,
          totalItems: 3,
          timeLeft: 45,
          energyLeft: 15,
          completedAt: new Date().toISOString(),
        },
        {
          id: "demo-2",
          playerName: "Explorer Elite",
          sceneTitle: "The Lost Shipwreck",
          sceneId: "scene-2",
          score: 880,
          itemsFound: 3,
          totalItems: 3,
          timeLeft: 30,
          energyLeft: 12,
          completedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "demo-3",
          playerName: "Riddle Solver",
          sceneTitle: "The Enchanted Forest",
          sceneId: "scene-3",
          score: 820,
          itemsFound: 3,
          totalItems: 3,
          timeLeft: 20,
          energyLeft: 10,
          completedAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      console.log("Loading leaderboard from Firestore...");
      let snapshot;
      
      try {
        // Try to query with orderBy first (requires index)
        const leaderboardQuery = query(
          collection(db, "leaderboard"),
          orderBy("score", "desc"),
          limit(50)
        );
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
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-treasure-gold to-amber-glow bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-xl text-muted-foreground">Top Treasure Hunters</p>
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
                          <span className="font-medium">{entry.sceneTitle}</span>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/play/${entry.sceneId}`)}
                          className="mt-2"
                        >
                          Play Scene
                        </Button>
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

