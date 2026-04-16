import { useEffect, useState } from "react";

interface BucketStats {
  usedBytes: number;
  maxBytes: number;
  usedGB: string;
  maxGB: number;
  remainingGB: string;
  percentUsed: string;
}

export function useBucketStats() {
  const [stats, setStats] = useState<BucketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/bucket-stats");
        if (!response.ok) {
          throw new Error("Failed to fetch bucket stats");
        }
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
}
