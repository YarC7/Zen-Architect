"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useUser() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    }
    getProfile();
  }, [supabase]);

  return { profile, loading };
}
