import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, firebaseEnabled } from "@/integrations/firebase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pencil, Trash2, Trophy } from "lucide-react";
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
import { DEMO_SCENES } from "@/lib/demoScenes";
import { useToast } from "@/hooks/use-toast";

interface Scene {
  id: string;
  title: string;
  background_url: string;
  items: any[];
  created_at: string;
  creator_id?: string;
}

const SceneBrowser = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!firebaseEnabled || !db) {
      setScenes(DEMO_SCENES);
      setLoading(false);
      return;
    }
    loadScenes();
  }, [firebaseEnabled, db]);

  const loadScenes = async () => {
    if (!db) return;
    try {
      const scenesQuery = query(collection(db, "scenes"), orderBy("created_at", "desc"));
      const snapshot = await getDocs(scenesQuery);
      const scenesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Scene[];
      setScenes(scenesData || []);
    } catch (error) {
      console.error('Error loading scenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sceneId: string, sceneTitle: string) => {
    if (!firebaseEnabled || !db) return;

    const confirmed = window.confirm(
      `Delete "${sceneTitle}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "scenes", sceneId));
      toast({ title: "Scene deleted successfully!" });
      await loadScenes();
    } catch (error: any) {
      toast({
        title: "Error deleting scene",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-ocean-blue/5 to-amber-glow/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-treasure-gold to-amber-glow bg-clip-text text-transparent mb-2">
            Treasure Hunt Scenes
          </h1>
          <p className="text-xl text-muted-foreground">Choose your next adventure</p>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading scenes...</div>
        ) : scenes.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">No scenes created yet</p>
            <Button onClick={() => navigate("/create")} className="bg-gradient-to-r from-treasure-gold to-amber-glow">
              Create First Scene
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenes.map((scene) => (
              <Card
                key={scene.id}
                className="overflow-hidden hover:shadow-[var(--shadow-treasure)] transition-all duration-300 border-2 border-transparent hover:border-primary/30"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={scene.background_url}
                    alt={scene.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{scene.title}</CardTitle>
                  <CardDescription>
                    {scene.items?.length || 0} hidden treasures to find
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => navigate(`/play/${scene.id}`)}
                    className="w-full bg-gradient-to-r from-secondary to-ocean-blue hover:opacity-90"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Hunt
                  </Button>
                  <Button
                    onClick={() => navigate(`/leaderboard/${scene.id}`)}
                    variant="outline"
                    className="w-full"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    View Leaderboard
                  </Button>
                  {firebaseEnabled && auth?.currentUser?.uid === scene.creator_id && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/edit/${scene.id}`)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(scene.id, scene.title)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneBrowser;