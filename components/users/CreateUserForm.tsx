"use client";

import { useActionState, useEffect, useRef } from "react";
import { adminCreateUser } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UserPlus, KeyRound, Mail, User } from "lucide-react";

export function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(adminCreateUser, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("User created successfully");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card className="border-zinc-200 bg-white shadow-sm overflow-hidden border-t-4 border-t-primary">
      <CardHeader className="space-y-1 py-6">
        <CardTitle className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <UserPlus className="h-4 w-4 text-primary" />
          </div>
          Add Teammate
        </CardTitle>
        <CardDescription className="text-zinc-500 text-xs">
          Provision a new account with platform-wide access.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
              Full Name
            </Label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <Input
                id="full_name"
                name="full_name"
                placeholder="Ex. Michael Scott"
                required
                className="pl-9 bg-white border-zinc-200 text-zinc-900 text-sm focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300 placeholder:text-zinc-300 h-10"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
              Work Email
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                className="pl-9 bg-white border-zinc-200 text-zinc-900 text-sm focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300 placeholder:text-zinc-300 h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" title="Mật khẩu" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
              Temp Password
            </Label>
            <div className="relative group">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="pl-9 bg-white border-zinc-200 text-zinc-900 text-sm focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300 placeholder:text-zinc-300 h-10"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full h-10 bg-zinc-900 text-white hover:bg-zinc-800 font-bold shadow-md transition-all duration-300 active:scale-[0.98] mt-2"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Provision Account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
