import { useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, Eye, EyeOff, Chrome, AlertCircle } from "lucide-react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "wouter";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      data-testid="auth-error"
      className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-3 py-2.5 text-sm"
    >
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const signInForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const handleSignIn = async (values: FormValues) => {
    setSignInError(null);
    setSignInLoading(true);
    try {
      await signInWithEmail(values.email, values.password);
      // Navigate immediately — don't wait for onAuthStateChange to propagate
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed. Please try again.";
      console.error("[Auth] signInWithPassword error:", msg);
      setSignInError(msg);
      toast.error(msg);
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (values: FormValues) => {
    setSignUpError(null);
    setSignUpLoading(true);
    try {
      const result = await signUpWithEmail(values.email, values.password);
      // Supabase returns a session immediately if email confirmation is disabled
      if (result.session) {
        navigate("/dashboard");
      } else {
        toast.success("Check your email to confirm your account, then sign in.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed. Please try again.";
      console.error("[Auth] signUp error:", msg);
      setSignUpError(msg);
      toast.error(msg);
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Page will redirect to OAuth provider — no further action needed
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign in failed";
      console.error("[Auth] signInWithGoogle error:", msg);
      toast.error(msg);
      setGoogleLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      toast.success("Password reset email sent! Check your inbox.");
      setForgotMode(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email";
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 mb-4">
            <BookOpen className="text-primary" size={26} />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">LifeReplay</h1>
          <p className="text-muted-foreground text-sm mt-1">Your memories, preserved forever</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-xl">
          {forgotMode ? (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-foreground">Reset password</h2>
                <p className="text-xs text-muted-foreground mt-1">We'll email you a reset link</p>
              </div>
              <Input
                data-testid="input-forgot-email"
                type="email"
                placeholder="your@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="bg-background"
              />
              <Button
                data-testid="button-send-reset"
                onClick={handleForgot}
                disabled={forgotLoading}
                className="w-full bg-primary text-primary-foreground"
              >
                {forgotLoading ? "Sending…" : "Send reset link"}
              </Button>
              <button
                data-testid="button-back-to-login"
                onClick={() => setForgotMode(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <Tabs defaultValue="signin">
              <TabsList className="w-full mb-5 bg-muted">
                <TabsTrigger data-testid="tab-signin" value="signin" className="flex-1">Sign in</TabsTrigger>
                <TabsTrigger data-testid="tab-signup" value="signup" className="flex-1">Sign up</TabsTrigger>
              </TabsList>

              {/* Sign In */}
              <TabsContent value="signin" className="space-y-4 mt-0">
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-3">
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-signin-email"
                              type="email"
                              autoComplete="email"
                              placeholder="your@email.com"
                              className="bg-background"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                data-testid="input-signin-password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="bg-background pr-10"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <InlineError message={signInError} />

                    <button
                      type="button"
                      data-testid="button-forgot-password"
                      onClick={() => { setSignInError(null); setForgotMode(true); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>

                    <Button
                      data-testid="button-signin-submit"
                      type="submit"
                      disabled={signInLoading}
                      className="w-full bg-primary text-primary-foreground font-semibold"
                    >
                      {signInLoading ? "Signing in…" : "Sign in"}
                    </Button>
                  </form>
                </Form>

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Button
                  data-testid="button-google-signin"
                  variant="outline"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full gap-2"
                >
                  <Chrome size={16} />
                  {googleLoading ? "Redirecting…" : "Continue with Google"}
                </Button>
              </TabsContent>

              {/* Sign Up */}
              <TabsContent value="signup" className="space-y-4 mt-0">
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-3">
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-signup-email"
                              type="email"
                              autoComplete="email"
                              placeholder="your@email.com"
                              className="bg-background"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                data-testid="input-signup-password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className="bg-background pr-10"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <InlineError message={signUpError} />

                    <Button
                      data-testid="button-signup-submit"
                      type="submit"
                      disabled={signUpLoading}
                      className="w-full bg-primary text-primary-foreground font-semibold"
                    >
                      {signUpLoading ? "Creating account…" : "Create account"}
                    </Button>
                  </form>
                </Form>

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Button
                  data-testid="button-google-signup"
                  variant="outline"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full gap-2"
                >
                  <Chrome size={16} />
                  {googleLoading ? "Redirecting…" : "Continue with Google"}
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Your memories are private and encrypted.
        </p>
        <p className="text-center text-xs mt-2">
          <Link href="/landing" className="text-primary hover:underline">View product preview</Link>
        </p>
      </div>
    </div>
  );
}
