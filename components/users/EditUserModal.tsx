"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminUpdateUser, adminArchiveUser, adminRestoreUser, adminGetUser } from "@/app/actions/admin";
import { toast } from "sonner";
import { Database } from "@/types/supabase";
import { Loader2, Archive, RotateCcw } from "lucide-react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserDetails = Profile & { email?: string };

interface EditUserModalProps {
  user: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserModal({ user: initialUser, open, onOpenChange }: EditUserModalProps) {
  const [user, setUser] = useState<UserDetails>(initialUser);
  const [fullName, setFullName] = useState(initialUser.full_name ?? "");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch full user details (including email) when modal opens
  useEffect(() => {
    if (open) {
      const fetchDetails = async () => {
        setIsFetching(true);
        try {
          const result = await adminGetUser(initialUser.id);
          if (result.success && result.user) {
            setEmail(result.user.email ?? "");
            setFullName(result.user.full_name ?? "");
            setUser(result.user as UserDetails);
          }
        } catch (err) {
          console.error("Failed to fetch user details", err);
        } finally {
          setIsFetching(false);
        }
      };
      fetchDetails();
    }
  }, [open, initialUser.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await adminUpdateUser(user.id, { 
        full_name: fullName,
        email: email || undefined 
      });
      
      if (result.success) {
        toast.success("User updated successfully");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Failed to update user");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleArchive = async () => {
    setIsLoading(true);
    try {
      const isArchived = !!user.deleted_at;
      const result = isArchived 
        ? await adminRestoreUser(user.id)
        : await adminArchiveUser(user.id);

      if (result.success) {
        toast.success(isArchived ? "User restored" : "User archived");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Operation failed");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details or manage their account status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
              required
              disabled={isFetching}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={isFetching}
            />
            {isFetching && <p className="text-[10px] text-zinc-400 animate-pulse italic">Fetching account data...</p>}
          </div>
          
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-medium text-zinc-900">Account Management</h4>
            <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-zinc-50/50">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-zinc-900">
                  {user.deleted_at ? "Restore User" : "Archive User"}
                </p>
                <p className="text-xs text-zinc-500">
                  {user.deleted_at 
                    ? "Allow this user to access the platform again." 
                    : "Archived users cannot log in or access workspaces."}
                </p>
              </div>
              <Button
                type="button"
                variant={user.deleted_at ? "outline" : "destructive"}
                size="sm"
                onClick={handleToggleArchive}
                disabled={isLoading}
              >
                {user.deleted_at ? (
                  <><RotateCcw className="h-4 w-4 mr-2" /> Restore</>
                ) : (
                  <><Archive className="h-4 w-4 mr-2" /> Archive</>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
