import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FallbackErrorProps {
  error: Error | null;
  onRetry?: () => void;
}

export function FallbackError({ error, onRetry }: FallbackErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-bold text-destructive mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}