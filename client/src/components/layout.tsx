import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Info, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { role, logout } = useStore();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Falha ao encerrar sessão no servidor:", err);
    }
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-light text-lg uppercase tracking-[3px] text-foreground">
              My Michelin Restaurant
            </span>
          </div>

          {role && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground uppercase tracking-[2px] hidden sm:inline-block">
                Role: <span className="text-foreground font-medium">{role}</span>
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair" className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container max-w-screen-2xl py-6 md:py-8 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border/70 py-4 md:py-5 relative z-10 bg-background/90">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 max-w-screen-2xl">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[3px] text-center md:text-left">
            Sistema Interno - Rede Wi-Fi Local
          </p>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[2px] text-[11px]">
                <Info className="h-4 w-4 mr-2" />
                Sobre o Sistema
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-xl font-light tracking-[2px] uppercase text-foreground">My Michelin Restaurant</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4 text-sm text-muted-foreground">
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="font-medium text-foreground col-span-1">Creator:</span>
                  <span className="col-span-2">Felipe Wizzentainer</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="font-medium text-foreground col-span-1">System Type:</span>
                  <span className="col-span-2">Sistema Interno de Coordenação Gastronômica</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="font-medium text-foreground col-span-1">Mode:</span>
                  <span className="col-span-2">Rede Wi-Fi Local</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium text-foreground col-span-1">Version:</span>
                  <span className="col-span-2">1.0</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </footer>
    </div>
  );
}
