import { Compass } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner = ({ message = "Loading...", size = "md" }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <Compass
          className={`${sizeClasses[size]} text-treasure-gold animate-spin-slow`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${sizeClasses[size]} border-4 border-treasure-gold/20 border-t-treasure-gold rounded-full animate-spin`}></div>
        </div>
      </div>
      <p className={`${textSizes[size]} text-muted-foreground font-medium`}>{message}</p>
    </div>
  );
};

