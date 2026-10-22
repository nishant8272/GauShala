import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, AuthModal } from "@/features/auth";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  // Send lightweight HEAD keep-alive ping every 9 minutes so Render does not spin down while the client is open
  useEffect(() => {
    const PING_INTERVAL_MS = 9 * 60 * 1000;
    const interval = setInterval(() => {
      fetch("/api/health", { method: "HEAD" }).catch(() => {});
    }, PING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider defaultTheme="light" enableSystem={false} attribute="class">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster />
          <AuthModal />
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
