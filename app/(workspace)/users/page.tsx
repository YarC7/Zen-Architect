import { createClient } from "@/utils/supabase/server";
import { CreateUserForm } from "@/components/users/CreateUserForm";
import { UserNav } from "@/components/auth/UserNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users as UsersIcon, Shield, ExternalLink } from "lucide-react";
import Link from "next/link";
import { UserList } from "@/components/users/UserList";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });
  
  const profiles = data || [];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-primary/10">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-5 w-px bg-zinc-200" />
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">User Management</h1>
          </div>
        </div>
        <UserNav />
      </header>

      <main className="container mx-auto max-w-7xl p-6 lg:p-10 space-y-10">
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Main User List */}
          <div className="lg:col-span-8 ">
            <UserList initialProfiles={profiles} />
          </div>

          {/* Right Column: Actions & Forms */}
          <div className="lg:col-span-4 space-y-8">
            <CreateUserForm />
          </div>
        </div>
      </main>
    </div>
  );
}
