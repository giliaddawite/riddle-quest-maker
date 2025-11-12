import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, firebaseEnabled } from "@/integrations/firebase/client";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Compass, LogOut, Home, Map, Plus, Trophy } from "lucide-react";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (!firebaseEnabled || !auth) return;
    try {
      await signOut(auth);
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Don't show nav bar on auth page
  if (location.pathname === "/auth") {
    return null;
  }

  return (
    <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-treasure-gold to-amber-glow flex items-center justify-center">
              <Compass className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-treasure-gold to-amber-glow bg-clip-text text-transparent">
              Treasure Seeker
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/")}
              className={isActive("/") ? "bg-primary/10" : ""}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant={isActive("/scenes") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/scenes")}
              className={isActive("/scenes") ? "bg-primary/10" : ""}
            >
              <Map className="w-4 h-4 mr-2" />
              Browse Scenes
            </Button>
            <Button
              variant={isActive("/create") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/create")}
              className={isActive("/create") ? "bg-primary/10" : ""}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
            <Button
              variant={isActive("/leaderboard") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/leaderboard")}
              className={isActive("/leaderboard") ? "bg-primary/10" : ""}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-2">
            {!loading && (
              <>
                {firebaseEnabled && auth ? (
                  user ? (
                    <Button onClick={handleSignOut} variant="outline" size="sm">
                      <LogOut className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Sign Out</span>
                    </Button>
                  ) : (
                    <Button onClick={() => navigate("/auth")} variant="outline" size="sm">
                      Sign In
                    </Button>
                  )
                ) : (
                  <Button onClick={() => navigate("/scenes")} variant="outline" size="sm">
                    <span className="hidden sm:inline">Browse</span>
                    <Map className="w-4 h-4 sm:ml-2" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4 flex items-center gap-2 overflow-x-auto">
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/")}
            className={isActive("/") ? "bg-primary/10" : ""}
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button
            variant={isActive("/scenes") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/scenes")}
            className={isActive("/scenes") ? "bg-primary/10" : ""}
          >
            <Map className="w-4 h-4 mr-2" />
            Browse
          </Button>
          <Button
            variant={isActive("/create") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/create")}
            className={isActive("/create") ? "bg-primary/10" : ""}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
          <Button
            variant={isActive("/leaderboard") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/leaderboard")}
            className={isActive("/leaderboard") ? "bg-primary/10" : ""}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

