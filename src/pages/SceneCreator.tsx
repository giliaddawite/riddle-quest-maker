import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage, firebaseEnabled } from "@/integrations/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface HiddenItem {
  id: string;
  name: string;
  riddle: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_ITEM_SIZE = 4;

const SceneCreator = () => {
  const [title, setTitle] = useState("");
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [items, setItems] = useState<HiddenItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<HiddenItem>>({});
  const [isPlacing, setIsPlacing] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isResizing, setIsResizing] = useState<string | null>(null); // e.g., 'bottom-right', 'top-left', null

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundImage(file);
      setBackgroundUrl(URL.createObjectURL(file));
    }
  };
  // UPDATE handleImageClick
const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
  // Only allow placement if we are currently in placing mode AND not resizing.
  if (!isPlacing || isResizing || !imageRef.current) return; 

  const rect = imageRef.current.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  // Set initial small box that the user can resize
  setCurrentItem({ 
    ...currentItem, 
    x, 
    y, 
    width: DEFAULT_ITEM_SIZE, 
    height: DEFAULT_ITEM_SIZE 
  });
  // DO NOT set setIsPlacing(false) here. Keep it true until the user is done with the item details.
  // setIsPlacing(false); // <--- REMOVE THIS LINE
  toast({ title: "Area placed!", description: "Now adjust the size using the handles." });
};
  const getRelativeCoordinates = (e: MouseEvent) => { // Use MouseEvent here as this is for global listeners
  if (!imageRef.current) return null;
  const rect = imageRef.current.getBoundingClientRect();
  
  // Calculate raw percentage coordinates
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  
  // CRITICAL: Clamp coordinates between 0 and 100
  const clampedX = Math.max(0, Math.min(x, 100));
  const clampedY = Math.max(0, Math.min(y, 100));

  return { x: clampedX, y: clampedY };
};

// --- MOUSE DOWN on a HANDLE (Starts the Resize) ---
const handleHandleMouseDown = (e: React.MouseEvent, handle: string) => {
  // Prevent the event from bubbling up to the image (which would trigger handleImageClick)
  e.stopPropagation(); 
  
  // Prevent text selection during drag
  e.preventDefault(); 

  // We only care about the item currently being worked on
  if (currentItem.x === undefined) return;

  setIsResizing(handle);
  
  // Attach global listeners for move/up
  document.addEventListener('mousemove', handleGlobalResizeMove);
  document.addEventListener('mouseup', handleGlobalResizeUp);
};

// --- GLOBAL MOUSE MOVE (The core resizing logic) ---
const handleGlobalResizeMove = (e: MouseEvent) => {
  if (!isResizing || currentItem.x === undefined || currentItem.y === undefined) return;

  const currentCoords = getRelativeCoordinates(e);
  if (!currentCoords) return;

  let newX = currentItem.x;
  let newY = currentItem.y;
  let newWidth = currentItem.width || DEFAULT_ITEM_SIZE;
  let newHeight = currentItem.height || DEFAULT_ITEM_SIZE;
  
  // The right edge position: X + Width
  const rightEdge = currentItem.x + newWidth;
  // The bottom edge position: Y + Height
  const bottomEdge = currentItem.y + newHeight;

  switch (isResizing) {
    case 'tl': // Top-Left handle
      // Recalculate Width: New width is (Right Edge - Mouse X)
      newWidth = rightEdge - currentCoords.x;
      // Recalculate Height: New height is (Bottom Edge - Mouse Y)
      newHeight = bottomEdge - currentCoords.y;

      // Update X and Y origin only if the box doesn't flip/collapse
      if (newWidth > 0 && newHeight > 0) {
        newX = currentCoords.x;
        newY = currentCoords.y;
      }
      break;

    case 'br': // Bottom-Right handle
      // New width is (Mouse X - Origin X)
      newWidth = currentCoords.x - currentItem.x;
      // New height is (Mouse Y - Origin Y)
      newHeight = currentCoords.y - currentItem.y;
      break;

    // Add cases for 'tr' and 'bl' if you implement more handles
  }
  
  // Ensure dimensions are never negative (box can't be inverted)
  newWidth = Math.max(0.5, newWidth); 
  newHeight = Math.max(0.5, newHeight);

  setCurrentItem(prev => ({
    ...prev,
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  }));
};

// --- GLOBAL MOUSE UP (Stops the Resize) ---
const handleGlobalResizeUp = () => {
  if (!isResizing) return;

  setIsResizing(null);
  // Optional: Check for minimum size here and reset if too small.
  
  // Cleanup global listeners
  document.removeEventListener('mousemove', handleGlobalResizeMove);
  document.removeEventListener('mouseup', handleGlobalResizeUp);
  toast({ title: "Item area adjusted." });
};
  const addItem = () => {
    if (!currentItem.name || !currentItem.riddle || currentItem.x === undefined) {
      toast({ title: "Please complete all item details", variant: "destructive" });
      return;
    }

    const newItem: HiddenItem = {
      id: crypto.randomUUID(),
      name: currentItem.name!,
      riddle: currentItem.riddle!,
      x: currentItem.x!,
      y: currentItem.y!,
      width: currentItem.width || DEFAULT_ITEM_SIZE,
      height: currentItem.height || DEFAULT_ITEM_SIZE,
    };

    setItems([...items, newItem]);
    setCurrentItem({});
    toast({ title: "Item added to scene!" });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const saveScene = async () => {
    if (!title || !backgroundImage || items.length === 0) {
      toast({ title: "Please complete the scene with title, image, and items", variant: "destructive" });
      return;
    }

    if (!firebaseEnabled || !auth || !db || !storage) {
      toast({
        title: "Firebase disabled",
        description: "Scene saving is unavailable right now.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const fileExt = backgroundImage.name.split('.').pop();
      const fileName = `${user.uid}/${crypto.randomUUID()}.${fileExt}`;
      const storagePath = `scene-images/${fileName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, backgroundImage);
      const publicUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, "scenes"), {
        title,
        creator_id: user.uid,
        background_url: publicUrl,
        items: items,
        created_at: serverTimestamp(),
      });

      toast({ title: "Scene saved successfully!" });
      navigate("/scenes");
    } catch (error: any) {
      toast({ title: "Error saving scene", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-amber-glow/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-treasure-gold to-amber-glow bg-clip-text text-transparent">
            Create Treasure Scene
          </h1>
          <Button onClick={saveScene} disabled={saving} size="lg" className="bg-gradient-to-r from-treasure-gold to-amber-glow">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Scene"}
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
                <Button variant="outline" size="icon" onClick={() => document.getElementById('background')?.click()}>
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
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
                    className="absolute border-2 border-primary bg-primary/20 rounded"
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      width: `${item.width}%`,
                      height: `${item.height}%`,
                    }}
                  />
                ))}
                {currentItem.x !== undefined && (
    <div
      className={`absolute border-2 border-accent bg-accent/20 rounded ${isResizing ? '' : 'animate-pulse'}`}
      style={{
        left: `${currentItem.x}%`,
        top: `${currentItem.y}%`,
        width: `${currentItem.width || DEFAULT_ITEM_SIZE}%`,
        height: `${currentItem.height || DEFAULT_ITEM_SIZE}%`,
      }}
    >
      {/* Resizable Handles (Display only if placing is done OR if we are resizing) */}
      {(currentItem.width > 0.5) && (
        <>
          {/* Top-Left Handle */}
          <div 
            className="absolute w-3 h-3 bg-white border border-accent rounded-full -left-1.5 -top-1.5 cursor-nwse-resize"
            onMouseDown={(e) => handleHandleMouseDown(e, 'tl')}
          />
          {/* Bottom-Right Handle */}
          <div 
            className="absolute w-3 h-3 bg-white border border-accent rounded-full -right-1.5 -bottom-1.5 cursor-nwse-resize"
            onMouseDown={(e) => handleHandleMouseDown(e, 'br')}
          />
          {/* ... Add other handles (tr, bl) as needed ... */}
        </>
      )}
    </div>
)}
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Hidden Items</h2>
            
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  placeholder="Golden Coin"
                  value={currentItem.name || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riddle">Riddle</Label>
                <Textarea
                  id="riddle"
                  placeholder="I shine bright but hold no light, ancient trade made me right..."
                  value={currentItem.riddle || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, riddle: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setIsPlacing(true)}
                  variant="outline"
                  className="flex-1"
                  disabled={!backgroundUrl}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Click on Image to Place
                </Button>
                <Button
                  onClick={addItem}
                  disabled={!currentItem.x}
                  className="flex-1 bg-secondary"
                >
                  Add Item
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between p-3 bg-card border border-border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.riddle}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SceneCreator;