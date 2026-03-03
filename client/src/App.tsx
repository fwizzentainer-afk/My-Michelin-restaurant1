import socket from "./socket";
import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Role, StoreProvider, useStore } from "@/lib/store";
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

function AppShell() {
  const { login } = useStore();
  const [, setLocation] = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const role = data?.role as Role;
          if (role === "admin" || role === "sala" || role === "cozinha") {
            login(role);
            if (window.location.pathname === "/") {
              setLocation(`/${role}`);
            }
          }
        }
      } catch (err) {
        console.warn("Falha ao restaurar sessão:", err);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    };

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    console.log("Socket iniciado:", socket);

    const onConnect = () => {
      console.log("Conectado ao servidor:", socket.id);
    };

    const onDisconnect = () => {
      console.log("Desconectado do servidor");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  if (!authChecked) return null;

  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

function App() {
  
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </QueryClientProvider> 
   );
}

export default App;
