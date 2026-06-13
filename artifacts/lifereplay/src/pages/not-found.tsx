import { Link } from "wouter";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-6xl font-serif font-bold text-primary">404</h1>
      <p className="text-lg text-muted-foreground">This memory doesn't exist.</p>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Home size={16} />
        Back to Dashboard
      </Link>
    </div>
  );
}
