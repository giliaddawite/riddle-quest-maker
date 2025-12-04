import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, firebaseEnabled } from "@/integrations/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Compass, ArrowLeft } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
} from "firebase/auth";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      return;
    }
    
    // Check for redirect result (for Google auth fallback)
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // User signed in via redirect
          console.log("Google sign-in successful via redirect:", result.user.email);
          toast({ title: "Welcome! Sign in successful." });
          // Navigation will happen via onAuthStateChanged
        }
      })
      .catch((error) => {
        // Only log if it's not a "no redirect" error (normal case when no redirect happened)
        if (error.code !== "auth/no-auth-event") {
          console.error("Redirect result error:", error);
        }
      });
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User authenticated:", user.email);
        navigate("/home");
      }
    });

    return () => unsubscribe();
  }, [navigate, firebaseEnabled, auth, toast]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseEnabled || !auth) {
      toast({
        title: "Firebase disabled",
        description: "Email authentication is unavailable right now.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back, Treasure Seeker!" });
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        if (user && name) {
          await updateProfile(user, { displayName: name });
        }
        toast({ title: "Account created! Start your treasure hunt!" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!firebaseEnabled || !auth || !googleProvider) {
      toast({
        title: "Firebase disabled",
        description: "Google authentication is unavailable right now.",
        variant: "destructive",
      });
      return;
    }

    // Prevent multiple simultaneous requests
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      // Try popup first (better UX)
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in successful:", result.user.email);
      toast({ title: "Welcome! Sign in successful." });
      setLoading(false);
      // Navigation will happen via onAuthStateChanged
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      const errorCode = error?.code;
      const errorMessage = error?.message || "";
      
      // Silently ignore user cancellation errors
      if (
        errorCode === "auth/cancelled-popup-request" ||
        errorCode === "auth/popup-closed-by-user"
      ) {
        console.log("User cancelled popup");
        setLoading(false);
        return;
      }
      
      // Check if popup showed a 404 error (auth handler not found)
      // This happens when OAuth redirect URIs aren't configured correctly
      if (
        errorCode === "auth/popup-blocked" ||
        errorCode === "auth/network-request-failed" ||
        errorCode === "auth/internal-error" ||
        errorCode === "auth/unauthorized-domain" ||
        errorMessage.includes("404") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("auth/handler") ||
        errorMessage.includes("Page not found")
      ) {
        console.log("Popup failed (likely 404 or config issue), switching to redirect");
        toast({
          title: "Switching to redirect",
          description: "Popup authentication unavailable. Redirecting to Google sign-in...",
        });
        try {
          await signInWithRedirect(auth, googleProvider);
          // Redirect will happen, don't set loading to false
          return;
        } catch (redirectError: any) {
          console.error("Redirect error:", redirectError);
          toast({
            title: "Authentication Configuration Error",
            description: "Please ensure OAuth redirect URIs are configured in Google Cloud Console. See FIREBASE_SETUP.md for details.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }
      
      // Handle account exists with different credential error
      if (errorCode === "auth/account-exists-with-different-credential") {
        toast({
          title: "Account Exists",
          description: "An account already exists with this email. Please sign in with your original method.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Show generic error for other cases
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (!firebaseEnabled || !auth || !googleProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-amber-glow/5 to-ocean-blue/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Authentication Unavailable</CardTitle>
            <CardDescription>
              Firebase is disabled in this environment. Sign in to access this page when Firebase is configured.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center text-muted-foreground">
            <p>You can still explore other areas of the app such as browsing scenes or playing the demo.</p>
            <div className="flex justify-center">
              <Button onClick={() => navigate("/landing")} variant="outline">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-amber-glow/5 to-ocean-blue/10 p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-[var(--shadow-treasure)] relative">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/landing")}
          className="absolute top-4 left-4"
          aria-label="Go back to landing page"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-treasure-gold to-amber-glow flex items-center justify-center mb-2">
            <Compass className="w-8 h-8 text-primary-foreground animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-treasure-gold to-amber-glow bg-clip-text text-transparent">
            Treasure Seeker
          </CardTitle>
          <CardDescription className="text-base">
            {isLogin ? "Continue your adventure" : "Begin your treasure hunt"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleAuth}
            variant="outline"
            className="w-full border-primary/30 hover:border-primary hover:bg-primary/5 transition-all"
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? "Connecting..." : "Continue with Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Explorer Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seeker@treasure.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-treasure-gold to-amber-glow hover:opacity-90 transition-all"
              disabled={loading}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Create account" : "Sign in"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;