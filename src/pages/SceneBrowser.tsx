import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/firebase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

interface Scene {
  id: string;
  title: string;
  background_url: string;
  items: any[];
  created_at: string;
}

const SceneBrowser = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadScenes();
  }, []);

  const loadScenes = async () => {
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
                <CardContent>
                  <Button
                    onClick={() => navigate(`/play/${scene.id}`)}
                    className="w-full bg-gradient-to-r from-secondary to-ocean-blue hover:opacity-90"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Hunt
                  </Button>
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