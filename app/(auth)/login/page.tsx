"use client";

import { useState, useActionState, useEffect } from "react";
import { signInAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, KanbanSquare, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInAction, null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 font-sans selection:bg-primary/10">
      {/* Subtle background ornamentation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8 relative">
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="p-3 rounded-2xl bg-white shadow-sm border border-zinc-200 mb-2">
            <KanbanSquare className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">ZenArc</h2>
        </div>

        <Card className="border-zinc-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm overflow-hidden border-t-4 border-t-primary">
          <CardHeader className="space-y-1 pt-8">
            <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-zinc-500 text-center">
              Enter your credentials to access your workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form action={formAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700 text-xs font-semibold uppercase tracking-wider pl-1">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-primary/20 focus-visible:border-primary h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                  <Label htmlFor="password" title="Mật khẩu" className="text-zinc-700 text-xs font-semibold uppercase tracking-wider">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="border-zinc-200 bg-white text-zinc-900 focus-visible:ring-primary/20 focus-visible:border-primary h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 h-11 mt-2 shadow-lg shadow-zinc-200 transition-all active:scale-[0.98]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>


            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-500">Demo Account</span>
              </div>
            </div>
            <div className="">
              <Button
                type="button"
                disabled={isPending}
                onClick={() => {
                  document.getElementById("email")?.setAttribute("value", "admin@zenarc.com");
                  document.getElementById("password")?.setAttribute("value", "admin@123");
                }}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 h-11 mt-2 shadow-lg shadow-zinc-200 transition-all active:scale-[0.98]"
              >
                Email: admin@zenarc.com / Password: admin@123
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
