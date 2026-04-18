"use client";

import { signOutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => signOutAction()}
      className="border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
}
