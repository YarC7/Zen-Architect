"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/supabase";
import { EditUserModal } from "./EditUserModal";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserListProps {
  initialProfiles: Profile[];
}

export function UserList({ initialProfiles }: UserListProps) {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (user: Profile) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)]">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 hover:bg-transparent bg-zinc-50/50">
              <TableHead className="text-zinc-500 font-semibold pl-6 h-14">User Profile</TableHead>
              <TableHead className="text-zinc-500 font-semibold h-14">Account ID</TableHead>
              <TableHead className="text-zinc-500 font-semibold text-right pr-6 h-14">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialProfiles.map((profile) => (
              <TableRow key={profile.id} className="border-zinc-100 hover:bg-zinc-50/50 transition-colors group/row">
                <TableCell className="pl-6 py-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-zinc-200 ring-4 ring-transparent group-hover/row:ring-zinc-100 transition-all duration-300 shadow-sm">
                      <AvatarImage src={profile.avatar_url ?? ""} />
                      <AvatarFallback className="bg-zinc-100 text-zinc-500 text-sm font-medium">
                        {profile.full_name?.charAt(0) ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 tracking-tight">{profile.full_name}</span>
                        {profile.deleted_at && (
                          <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 border-zinc-200 text-[10px] h-4.5 px-1.5 font-semibold uppercase tracking-wider">
                            Archived
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-zinc-500">@{profile.username ?? "unnamed"}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-5">
                  <code className="text-[11px] font-mono bg-zinc-100 px-2 py-1 rounded text-zinc-600 border border-zinc-200/50">
                    {profile.id.slice(0, 8)}...
                  </code>
                </TableCell>
                <TableCell className="pr-6 py-5 text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border-zinc-200 shadow-sm transition-all"
                    onClick={() => handleEdit(profile)}
                  >
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {initialProfiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-48 text-center text-zinc-400 italic">
                  No users found in the system.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="p-4 bg-zinc-50/30 border-t border-zinc-200">
          <p className="text-xs text-center text-zinc-400 font-medium">
            Showing {initialProfiles.length} user accounts
          </p>
        </div>
      </div>

      {selectedUser && (
        <EditUserModal 
          user={selectedUser} 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen} 
        />
      )}
    </>
  );
}
