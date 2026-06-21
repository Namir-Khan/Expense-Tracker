import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login, signup } from "@/lib/api/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Tally" },
      { name: "description", content: "Sign in or create your Tally account to start tracking expenses." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link to="/" className="mb-8 flex items-center gap-2 font-semibold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Wallet className="h-4 w-4" />
        </span>
        Tally
      </Link>
      <Card className="w-full max-w-[400px] rounded-xl p-6 shadow-md">
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="mt-6">
            <SignInForm />
          </TabsContent>
          <TabsContent value="signup" className="mt-6">
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr("");
        if (!email || !password) {
          setErr("Email and password are required");
          return;
        }
        setLoading(true);
        try {
          await login(email, password);
          navigate({ to: "/dashboard" });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Could not sign in";
          setErr(message);
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="si-email">Email</Label>
        <Input 
          id="si-email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="si-pw">Password</Label>
        <Input 
          id="si-pw" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr("");
        setSuccess("");
        if (!email || !password) return setErr("All fields are required");
        if (password !== confirm) return setErr("Passwords do not match");
        if (password.length < 8) return setErr("Password must be at least 8 characters");
        
        setLoading(true);
        try {
          await signup(email, password);
          setSuccess("Account created! Please sign in with your credentials.");
          setEmail("");
          setPassword("");
          setConfirm("");
          // Reset form and show success
          setTimeout(() => {
            setSuccess("");
          }, 5000);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Could not create account";
          setErr(message);
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="su-email">Email</Label>
        <Input 
          id="su-email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-pw">Password</Label>
        <Input 
          id="su-pw" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          placeholder="Min 8 characters"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-cpw">Confirm password</Label>
        <Input 
          id="su-cpw" 
          type="password" 
          value={confirm} 
          onChange={(e) => setConfirm(e.target.value)}
          disabled={loading}
        />
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      {success && <p className="text-xs text-green-600">{success}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating…" : "Create Account"}
      </Button>
    </form>
  );
}