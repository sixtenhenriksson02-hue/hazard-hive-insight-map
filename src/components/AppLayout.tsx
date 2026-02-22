import { Shield, Bell, Menu, X } from "lucide-react";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  userRole: "admin" | "worker";
}

export default function AppLayout({ children, userRole }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-accent" />
            <div>
              <h1 className="text-lg font-bold leading-tight">RiskRadar</h1>
              <p className="text-xs text-primary-foreground/70">Riskhantering & Förebyggande</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <span className="text-primary-foreground/70">
              Roll: <span className="font-semibold text-accent">{userRole === "admin" ? "Admin" : "Arbetare"}</span>
            </span>
            <button className="relative">
              <Bell className="h-5 w-5 text-primary-foreground/80 hover:text-accent transition-colors" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent" />
            </button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary-foreground/10 p-4">
            <p className="text-sm text-primary-foreground/70">
              Roll: <span className="font-semibold text-accent">{userRole === "admin" ? "Admin" : "Arbetare"}</span>
            </p>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="container py-6 md:py-8">{children}</main>
    </div>
  );
}
