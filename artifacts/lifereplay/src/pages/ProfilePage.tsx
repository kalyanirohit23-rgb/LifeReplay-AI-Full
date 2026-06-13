import { useState } from "react";
import { useLocation } from "wouter";
import { User, Mail, Calendar, BookOpen, Image, Video, Mic, LogOut, Sun, Moon, Shield } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useMemories } from "@/hooks/useMemories";
import { getTheme, setTheme } from "@/lib/theme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function StatRow({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
          <Icon size={15} className="text-white" />
        </div>
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { memories } = useMemories();
  const [dark, setDark] = useState(getTheme() === "dark");

  const totalPhotos = memories.reduce((a, m) => a + (m.memory_media?.filter(x => x.type === "photo").length ?? 0), 0);
  const totalVideos = memories.reduce((a, m) => a + (m.memory_media?.filter(x => x.type === "video").length ?? 0), 0);
  const totalVoice  = memories.reduce((a, m) => a + (m.memory_media?.filter(x => x.type === "voice").length ?? 0), 0);

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "You";
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user?.created_at ? format(new Date(user.created_at), "MMMM yyyy") : "—";

  const toggleTheme = () => {
    const next = dark ? "light" : "dark";
    setTheme(next);
    setDark(!dark);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setLocation("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="flex flex-col max-w-lg mx-auto w-full p-4 md:p-6 gap-5 pb-10">
      <div className="pt-2">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your account and preferences</p>
      </div>

      {/* Avatar + identity */}
      <div className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4">
        <Avatar className="w-16 h-16 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-serif font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-serif text-lg font-semibold text-foreground truncate">{displayName}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Mail size={11} /> {user?.email}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Calendar size={11} /> Member since {memberSince}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card border border-card-border rounded-2xl p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your library</h2>
        <StatRow icon={BookOpen} label="Memories" value={memories.length} color="bg-amber-500" />
        <StatRow icon={Image}    label="Photos"   value={totalPhotos}    color="bg-sky-500" />
        <StatRow icon={Video}    label="Videos"   value={totalVideos}    color="bg-violet-500" />
        <StatRow icon={Mic}      label="Voice notes" value={totalVoice}  color="bg-emerald-500" />
      </div>

      {/* Settings */}
      <div className="bg-card border border-card-border rounded-2xl p-4 space-y-1">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Preferences</h2>

        {/* Theme toggle */}
        <button
          data-testid="button-toggle-theme"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between py-2.5 px-1 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              {dark ? <Moon size={15} className="text-primary" /> : <Sun size={15} className="text-amber-500" />}
            </div>
            <span className="text-sm text-foreground">Appearance</span>
          </div>
          <span className="text-xs text-muted-foreground capitalize">{dark ? "Dark" : "Light"} mode</span>
        </button>

        {/* Privacy notice */}
        <div className="flex items-center gap-3 py-2.5 px-1">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Shield size={15} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-foreground">Private & encrypted</p>
            <p className="text-xs text-muted-foreground">Only you can see your memories</p>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-card border border-card-border rounded-2xl p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              data-testid="button-signout"
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
            >
              <LogOut size={15} />
              Sign out
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out?</AlertDialogTitle>
              <AlertDialogDescription>
                You'll be returned to the login screen. Your memories will still be here when you come back.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                data-testid="button-confirm-signout"
                onClick={handleSignOut}
                className="bg-destructive text-destructive-foreground"
              >
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
