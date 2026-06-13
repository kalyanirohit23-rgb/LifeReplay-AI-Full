import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import TimelinePage from "@/pages/TimelinePage";
import CreateMemoryPage from "@/pages/CreateMemoryPage";
import MemoryDetailPage from "@/pages/MemoryDetailPage";
import EditMemoryPage from "@/pages/EditMemoryPage";
import SearchPage from "@/pages/SearchPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/AppLayout";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your memories…</p>
        </div>
      </div>
    );
  }

  if (!user && location !== "/") {
    return <Redirect to="/" />;
  }

  if (user && location === "/") {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <AuthGuard>
      <Switch>
        <Route path="/" component={LoginPage} />
        <Route path="/dashboard">
          <AppLayout><DashboardPage /></AppLayout>
        </Route>
        <Route path="/timeline">
          <AppLayout><TimelinePage /></AppLayout>
        </Route>
        <Route path="/memories/new">
          <AppLayout><CreateMemoryPage /></AppLayout>
        </Route>
        <Route path="/memories/:id/edit">
          {(params) => <AppLayout><EditMemoryPage id={params.id} /></AppLayout>}
        </Route>
        <Route path="/memories/:id">
          {(params) => <AppLayout><MemoryDetailPage id={params.id} /></AppLayout>}
        </Route>
        <Route path="/search">
          <AppLayout><SearchPage /></AppLayout>
        </Route>
        <Route path="/profile">
          <AppLayout><ProfilePage /></AppLayout>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AuthGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster
        position="top-center"
        richColors
        theme="dark"
        toastOptions={{ className: "font-sans" }}
      />
    </QueryClientProvider>
  );
}

export default App;
