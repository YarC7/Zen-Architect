"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Users, User, Settings } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { Database } from "@/types/supabase";
import { ProfileEditDialog } from "./ProfileEditDialog";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function UserNav() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  useEffect(() => {
    getProfile();
  }, [supabase]);

  const handleSignOut = async () => {
    await signOutAction();
  };

  if (!profile) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12 rounded-full border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-all p-0 overflow-hidden">
          <Avatar className="h-full w-full">
            <AvatarImage src={profile.avatar_url ?? ""} alt={profile.full_name ?? ""} />
            <AvatarFallback className="bg-zinc-100 text-zinc-500 font-medium text-xs">
              {profile.full_name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 mt-2 border-zinc-200 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-1.5" align="end" forceMount>
        <DropdownMenuLabel className="font-normal px-3 py-4">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-zinc-900 tracking-tight">{profile.full_name}</p>
            <p className="text-xs leading-none text-zinc-500">
              @{profile.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-100 mx-1" />
        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem 
            className="focus:bg-zinc-50 focus:text-zinc-900 cursor-pointer transition-colors rounded-md h-10 px-3"
            onClick={() => setIsProfileOpen(true)}
          >
            <User className="mr-3 h-4 w-4 text-zinc-400" />
            <span className="text-sm font-medium">Profile</span>
          </DropdownMenuItem>
          <Link href="/users">
            <DropdownMenuItem className="focus:bg-zinc-50 focus:text-zinc-900 cursor-pointer transition-colors rounded-md h-10 px-3">
              <Users className="mr-3 h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium">User Management</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem className="focus:bg-zinc-50 focus:text-zinc-900 cursor-pointer transition-colors rounded-md h-10 px-3">
            <Settings className="mr-3 h-4 w-4 text-zinc-400" />
            <span className="text-sm font-medium">Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-zinc-100 mx-1" />
        <div className="p-1">
          <DropdownMenuItem 
            className="focus:bg-red-50 focus:text-red-600 text-red-500 cursor-pointer transition-colors rounded-md h-10 px-3"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span className="text-sm font-medium">Sign out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
      <ProfileEditDialog 
        profile={profile} 
        open={isProfileOpen} 
        onOpenChange={setIsProfileOpen}
        onSuccess={getProfile}
      />
    </DropdownMenu>
  );
}
