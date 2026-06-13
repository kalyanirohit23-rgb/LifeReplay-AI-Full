import { useState } from "react";
import { BookOpen, Eye, EyeOff, Chrome } from "lucide-react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const signInForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const handleSignIn = async (values: FormValues) => {
    setLoading(true);
    try {
      await signInWithEmail(values.email, values.password);
      toast.success("Welcome back!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (values: FormValues) => {
    setLoading(true);
    try {
      await signUpWithEmail(values.email, values.password);
      toast.success("Account created! Check your email to confirm.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Google sign in failed");
      setGoogleLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail) return;
    try {
      await resetPassword(forgotEmail);
      toast.success("Password reset email sent!");
      setForgotMode(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset email");
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
                className="w-full bg-primary text-primary-foreground"
              >
                Send reset link
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
                    <button
                      type="button"
                      data-testid="button-forgot-password"
                      onClick={() => setForgotMode(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                    <Button
                      data-testid="button-signin-submit"
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-primary-foreground font-semibold"
                    >
                      {loading ? "Signing in…" : "Sign in"}
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
                    <Button
                      data-testid="button-signup-submit"
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-primary-foreground font-semibold"
                    >
                      {loading ? "Creating account…" : "Create account"}
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
      </div>
    </div>
  );
}
