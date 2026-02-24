import socket from "./socket";
import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider, useStore } from "@/lib/store";
import Layout from "@/components/layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Sala from "@/pages/sala";
import Cozinha from "@/pages/cozinha";
import Admin from "@/pages/admin";

// Protected route wrapper
function ProtectedRoute({ component: Component, allowedRole }: { component: any, allowedRole?: string }) {
  const { role } = useStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!role) {
      setLocation("/");
    } else if (allowedRole && role !== allowedRole) {
      // Basic redirect if they try to access wrong role page
      setLocation(`/${role}`);
    }
  }, [role, allowedRole, setLocation]);

  if (!role) return null;
  if (allowedRole && role !== allowedRole) return null;

  return <Component />;
}

function Router() {
  useEffect(() => {
  socket.on("connect", () => {
    console.log("Conectado ao servidor:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Desconectado do servidor");
  });

  return () => {
    socket.disconnect();
  };
}, []);
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/sala">
          {() => <ProtectedRoute component={Sala} allowedRole="sala" />}
        </Route>
        <Route path="/cozinha">
          {() => <ProtectedRoute component={Cozinha} allowedRole="cozinha" />}
        </Route>
        <Route path="/admin">
          {() => <ProtectedRoute component={Admin} allowedRole="admin" />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;