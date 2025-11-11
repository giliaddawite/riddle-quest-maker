import scene1Image from "./scene1.png";
import scene2Image from "./scene2.png";
import scene3Image from "./scene3.png";

export interface HiddenItem {
  id: string;
  name: string;
  riddle: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DemoScene {
  id: string;
  title: string;
  background_url: string;
  items: HiddenItem[];
  created_at: string;
}

export const DEMO_SCENES: DemoScene[] = [
  {
    id: "scene-1",
    title: "The Ancient Temple",
    background_url: scene1Image,
    items: [
      { 
        id: "gem-1", 
        name: "Sacred Gem", 
        riddle: "I shine without a flame, hidden in the shadows of time.", 
        x: 30, 
        y: 45, 
        width: 12, 
        height: 12 
      },
      { 
        id: "map-1", 
        name: "Ancient Map", 
        riddle: "I guide but do not speak, showing paths long forgotten.", 
        x: 62, 
        y: 58, 
        width: 10, 
        height: 10 
      },
      { 
        id: "compass-1", 
        name: "Mystic Compass", 
        riddle: "Always pointing, never moving, I reveal the hidden truth.", 
        x: 42, 
        y: 30, 
        width: 8, 
        height: 8 
      },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "scene-2",
    title: "The Lost Shipwreck",
    background_url: scene2Image,
    items: [
      { 
        id: "coin-2", 
        name: "Pirate's Coin", 
        riddle: "Once traded for treasures, now lost to the depths.", 
        x: 25, 
        y: 50, 
        width: 10, 
        height: 10 
      },
      { 
        id: "chest-2", 
        name: "Treasure Chest", 
        riddle: "I hold secrets of the sea, locked away for centuries.", 
        x: 55, 
        y: 40, 
        width: 15, 
        height: 12 
      },
      { 
        id: "anchor-2", 
        name: "Ancient Anchor", 
        riddle: "I held ships steady, now I rest in silence.", 
        x: 70, 
        y: 60, 
        width: 12, 
        height: 14 
      },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "scene-3",
    title: "The Enchanted Forest",
    background_url: scene3Image,
    items: [
      { 
        id: "crystal-3", 
        name: "Magic Crystal", 
        riddle: "I glow with inner light, a source of ancient power.", 
        x: 35, 
        y: 40, 
        width: 8, 
        height: 8 
      },
      { 
        id: "scroll-3", 
        name: "Mystical Scroll", 
        riddle: "Words of old magic, written in forgotten tongues.", 
        x: 60, 
        y: 55, 
        width: 10, 
        height: 12 
      },
      { 
        id: "key-3", 
        name: "Golden Key", 
        riddle: "I unlock what time has sealed, opening doors to the past.", 
        x: 45, 
        y: 65, 
        width: 6, 
        height: 8 
      },
    ],
    created_at: new Date().toISOString(),
  },
];

// Helper function to get a demo scene by ID
export const getDemoSceneById = (id: string): DemoScene | undefined => {
  return DEMO_SCENES.find(scene => scene.id === id);
};

