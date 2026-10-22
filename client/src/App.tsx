import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, AuthModal } from "@/features/auth";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
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
