import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { lazy, Suspense } from "react";

import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import JoinProject from "./pages/JoinProject";
import CompleteAccount from "./components/CompleteAccount";
import { normalizeInviteCode, projectInvitePath } from "@/lib/projectInvite";

// Lazy load heavy pages
const Index = lazy(() => import("./pages/Index"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Profile = lazy(() => import("./pages/Profile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min – avoid refetching on every mount
      gcTime: 1000 * 60 * 10,   // 10 min garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-accent/15 flex items-center justify-center animate-pulse">
          <div className="h-5 w-5 rounded bg-accent/30" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Laddar...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, displayName } = useAuth();
  if (isLoading) return <LoadingFallback />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!displayName.trim() || displayName === "Anonym") return <CompleteAccount />;
  return <>{children}</>;
}

function AuthRoute() {
  const { user, isLoading } = useAuth();
  const [params] = useSearchParams();
  const invite = normalizeInviteCode(params.get("invite"));
  if (isLoading) return <LoadingFallback />;
  if (user) return <Navigate to={invite ? projectInvitePath(invite) : "/"} replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/auth" element={<AuthRoute />} />
                <Route path="/join/:code" element={<JoinProject />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
