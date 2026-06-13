import { useLocation, Link } from "wouter";
import { LayoutDashboard, Clock, Plus, Search, User, Sun, Moon, LogOut, BookOpen } from "lucide-react";
import { useAuth, signOut } from "@/hooks/useAuth";
import { getTheme, setTheme } from "@/lib/theme";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/timeline", icon: Clock, label: "Timeline" },
  { href: "/memories/new", icon: Plus, label: "New", highlight: true },
  { href: "/search", icon: Search, label: "Search" },
];

function ThemeToggle() {
  const [dark, setDark] = useState(getTheme() === "dark");
  const toggle = () => {
    const next = dark ? "light" : "dark";
    setTheme(next);
    setDark(!dark);
  };
  return (
    <button
      data-testid="button-theme-toggle"
      onClick={toggle}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "ME";

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // handled by redirect
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border fixed inset-y-0 z-40">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <BookOpen className="text-primary" size={22} />
            <span className="font-serif text-lg font-semibold text-sidebar-foreground">LifeReplay</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, icon: Icon, label, highlight }) => {
            const active = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                data-testid={`link-nav-${label.toLowerCase()}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  highlight
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="button-user-menu"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent transition-colors flex-1 min-w-0"
              >
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-sidebar-foreground truncate">{user?.email}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="button-sign-out"
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut size={14} className="mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-60 flex flex-col min-h-screen pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        data-testid="nav-bottom"
        className="md:hidden fixed bottom-0 inset-x-0 bg-card/95 glass border-t border-border z-40 safe-area-bottom"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ href, icon: Icon, label, highlight }) => {
            const active = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                data-testid={`link-mobile-nav-${label.toLowerCase()}`}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  highlight
                    ? "bg-primary text-primary-foreground"
                    : active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={22} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="button-mobile-user-menu"
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  location === "/profile" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User size={22} />
                <span className="text-[10px] font-medium">Profile</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end">
              <div className="px-2 py-1.5 text-xs text-muted-foreground truncate max-w-[200px]">
                {user?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <ThemeToggle />
                <span className="ml-1">Toggle theme</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="button-mobile-sign-out"
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut size={14} className="mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );
}
