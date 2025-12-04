import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db, storage, firebaseEnabled } from "@/integrations/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Save, Upload, X, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
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

const defaultItemSize = 4;

const SceneEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const imageRef = useRef<HTMLImageElement>(null);

  const [loadingScene, setLoadingScene] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [items, setItems] = useState<HiddenItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<HiddenItem>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/scenes");
      return;
    }

    if (!firebaseEnabled || !db) {
      toast({
        title: "Firebase disabled",
        description: "Scene editing requires Firebase to be configured.",
        variant: "destructive",
      });
      navigate("/scenes");
      return;
    }

    const loadScene = async () => {
      try {
        const sceneRef = doc(db, "scenes", id);
        const snapshot = await getDoc(sceneRef);
        if (!snapshot.exists()) {
          toast({ title: "Scene not found", variant: "destructive" });
          navigate("/scenes");
          return;
        }

        const data = snapshot.data() as { title?: string; background_url?: string; items?: HiddenItem[] };
        setTitle(data.title ?? "");
        setBackgroundUrl(data.background_url ?? "");
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (error: any) {
        toast({ title: "Error loading scene", description: error.message, variant: "destructive" });
        navigate("/scenes");
      } finally {
        setLoadingScene(false);
      }
    };

    loadScene();
  }, [db, id, navigate, toast]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackgroundImageFile(file);
    setBackgroundUrl(URL.createObjectURL(file));
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isPlacing || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setCurrentItem((prev) => ({
      ...prev,
      x,
      y,
      width: prev.width ?? defaultItemSize,
      height: prev.height ?? defaultItemSize,
    }));
    setIsPlacing(false);
  };

  const resetCurrentItem = () => {
    setCurrentItem({});
    setEditingItemId(null);
    setIsPlacing(false);
  };

  const handleSaveItem = () => {
    if (!currentItem.name || !currentItem.riddle || currentItem.x === undefined || currentItem.y === undefined) {
      toast({ title: "Please complete all item details", variant: "destructive" });
      return;
    }

    const normalizedItem: HiddenItem = {
      id: editingItemId ?? crypto.randomUUID(),
      name: currentItem.name,
      riddle: currentItem.riddle,
      x: currentItem.x,
      y: currentItem.y,
      width: currentItem.width ?? defaultItemSize,
      height: currentItem.height ?? defaultItemSize,
    };

    if (editingItemId) {
      setItems((prev) => prev.map((item) => (item.id === editingItemId ? normalizedItem : item)));
    } else {
      setItems((prev) => [...prev, normalizedItem]);
    }

    toast({ title: editingItemId ? "Item updated!" : "Item added to scene!" });
    resetCurrentItem();
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    if (editingItemId === itemId) {
      resetCurrentItem();
    }
  };

  const beginEditItem = (item: HiddenItem) => {
    setEditingItemId(item.id);
    setCurrentItem(item);
    setIsPlacing(false);
  };

  const saveScene = async () => {
    if (!id) return;
    if (!title || !backgroundUrl || items.length === 0) {
      toast({ title: "Please complete the scene with title, image, and items", variant: "destructive" });
      return;
    }

    if (!firebaseEnabled || !auth || !db || !storage) {
      toast({ title: "Firebase disabled", description: "Scene saving is unavailable right now.", variant: "destructive" });
      return;
    }

    if (!auth.currentUser) {
      toast({ title: "Not authenticated", description: "Please sign in again.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setSaving(true);

    try {
      let finalBackgroundUrl = backgroundUrl;

      if (backgroundImageFile) {
        const fileExt = backgroundImageFile.name.split(".").pop();
        const fileName = `${auth.currentUser.uid}/${crypto.randomUUID()}.${fileExt}`;
        const storagePath = `scene-images/${fileName}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, backgroundImageFile);
        finalBackgroundUrl = await getDownloadURL(storageRef);
      }

      const sceneRef = doc(db, "scenes", id);
      await updateDoc(sceneRef, {
        title,
        background_url: finalBackgroundUrl,
        items,
        updated_at: serverTimestamp(),
      });

      toast({ title: "Scene updated successfully!" });
      navigate("/scenes");
    } catch (error: any) {
      toast({ title: "Error updating scene", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loadingScene) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-amber-glow/5">
        <LoadingSpinner message="Loading scene editor..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/scenes")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Scenes
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              Edit Treasure Scene
            </h1>
          </div>
          <Button onClick={saveScene} disabled={saving} size="lg" className="bg-gradient-to-r from-secondary to-primary">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Scene Title</Label>
              <Input
                id="title"
                placeholder="The Lost Temple"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="background">Background Image</Label>
              <div className="flex gap-2">
                <Input
                  id="background"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => document.getElementById("background")?.click()}
                  title="Upload new background"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Uploading a new image will replace the current background. Existing items remain in place—reposition as needed.
              </p>
            </div>

            {backgroundUrl && (
              <div className="relative border-2 border-primary/30 rounded-lg overflow-hidden cursor-crosshair">
                <img
                  ref={imageRef}
                  src={backgroundUrl}
                  alt="Scene background"
                  onClick={handleImageClick}
                  className={isPlacing ? "cursor-crosshair" : "cursor-default"}
                />
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`absolute rounded border-2 ${editingItemId === item.id ? "border-accent bg-accent/30" : "border-primary bg-primary/20"}`}
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      width: `${item.width}%`,
                      height: `${item.height}%`,
                    }}
                  />
                ))}
                {currentItem.x !== undefined && editingItemId === null && (
                  <div
                    className="absolute border-2 border-accent bg-accent/20 rounded animate-pulse"
                    style={{
                      left: `${currentItem.x}%`,
                      top: `${currentItem.y}%`,
                      width: `${currentItem.width ?? defaultItemSize}%`,
                      height: `${currentItem.height ?? defaultItemSize}%`,
                    }}
                  />
                )}
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                {editingItemId ? "Edit Hidden Item" : "Hidden Items"}
              </h2>
              {editingItemId && (
                <Button variant="ghost" size="sm" onClick={resetCurrentItem}>
                  Cancel Edit
                </Button>
              )}
            </div>

            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  placeholder="Golden Coin"
                  value={currentItem.name ?? ""}
                  onChange={(e) => setCurrentItem((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riddle">Riddle</Label>
                <Textarea
                  id="riddle"
                  placeholder="I shine bright but hold no light, ancient trade made me right..."
                  value={currentItem.riddle ?? ""}
                  onChange={(e) => setCurrentItem((prev) => ({ ...prev, riddle: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (%)</Label>
                  <Input
                    id="width"
                    type="number"
                    min={1}
                    max={100}
                    value={currentItem.width ?? defaultItemSize}
                    onChange={(e) => setCurrentItem((prev) => ({ ...prev, width: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (%)</Label>
                  <Input
                    id="height"
                    type="number"
                    min={1}
                    max={100}
                    value={currentItem.height ?? defaultItemSize}
                    onChange={(e) => setCurrentItem((prev) => ({ ...prev, height: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setIsPlacing(true)}
                  variant="outline"
                  className="flex-1"
                  disabled={!backgroundUrl}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Click on Image to {editingItemId ? "Adjust Position" : "Place"}
                </Button>
                <Button onClick={handleSaveItem} className="flex-1 bg-secondary">
                  {editingItemId ? "Update Item" : "Add Item"}
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hidden items yet. Add at least one item to save the scene.
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between p-3 bg-card border rounded-lg ${
                      editingItemId === item.id ? "border-accent" : "border-border"
                    }`}
                  >
                    <div className="flex-1 pr-3">
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.riddle}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => beginEditItem(item)}
                        title="Edit item"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                        title="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SceneEditor;

