import { Link, useLocation } from "wouter";
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

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-semibold tracking-tight text-primary">
              My Michelin Restaurant
            </span>
          </div>

          {role && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground uppercase tracking-wider hidden sm:inline-block">
                Role: <span className="text-foreground font-medium">{role}</span>
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container max-w-screen-2xl py-6 md:py-10 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border/40 py-4 md:py-6 relative z-10 bg-background">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 max-w-screen-2xl">
          <p className="text-xs text-muted-foreground uppercase tracking-widest text-center md:text-left">
            Sistema Interno - Rede Wi-Fi Local
          </p>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary transition-colors">
                <Info className="h-4 w-4 mr-2" />
                Sobre o Sistema
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-border/40 bg-card">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-primary">My Michelin Restaurant</DialogTitle>
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