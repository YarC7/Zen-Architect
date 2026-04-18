"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Camera, User, AtSign } from "lucide-react";
import { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileEditDialogProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProfileEditDialog({
  profile,
  open,
  onOpenChange,
  onSuccess,
}: ProfileEditDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload image to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success("Avatar uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error uploading avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username: username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-zinc-200 bg-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">Edit Profile</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative group">
              <Avatar className="h-28 w-28 border-2 border-zinc-100 shadow-sm ring-offset-background transition-all group-hover:ring-2 group-hover:ring-primary/20">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback className="bg-zinc-100 text-zinc-500 text-2xl font-semibold">
                  {fullName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-white rounded-full border border-zinc-200 shadow-sm text-zinc-600 hover:text-primary hover:border-primary transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
              />
            </div>
            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Profile Picture</p>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-bold text-zinc-700 uppercase tracking-wider pl-1">
                Full Name
              </Label>
              <div className="relative">
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="pl-9 h-11 border-zinc-200 focus:ring-primary/20"
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-bold text-zinc-700 uppercase tracking-wider pl-1">
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="pl-9 h-11 border-zinc-200 focus:ring-primary/20"
                  required
                />
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || uploading}
              className="h-11 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-100 min-w-[100px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
