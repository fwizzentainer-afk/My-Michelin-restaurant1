import { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, UtensilsCrossed, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (username.toLowerCase() === "adm" && password === "senha") {
      login("admin");
      setLocation("/admin");
    } else if (username.toLowerCase() === "sala") {
      login("sala");
      setLocation("/sala");
    } else if (username.toLowerCase() === "cozinha") {
      login("cozinha");
      setLocation("/cozinha");
    } else {
      toast({
        title: "Credenciais inválidas",
        description: "Verifique o usuário e senha informados.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center -mt-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background z-0" />
      
      <Card className="w-full max-w-md border-border/40 bg-card/60 backdrop-blur-xl relative z-10 shadow-2xl shadow-black/50">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="font-serif text-3xl mb-2 text-foreground">Acesso Restrito</CardTitle>
            <CardDescription className="text-muted-foreground tracking-wide">
              Sistema Interno • LAN Mode
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-widest text-muted-foreground">Usuário</Label>
              <Input 
                id="username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: adm, sala, cozinha"
                className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/50 h-12"
                data-testid="input-login-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">Senha</Label>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Apenas para Admin"
                className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/50 h-12"
                data-testid="input-login-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-wide" data-testid="button-login">
              Entrar no Sistema
            </Button>
            <div className="grid grid-cols-2 gap-2 w-full text-xs text-muted-foreground mt-4 border-t border-border/20 pt-4">
              <div className="flex items-center gap-2 justify-center">
                <UtensilsCrossed className="w-3 h-3" />
                <span>Sala: Max 5</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <ChefHat className="w-3 h-3" />
                <span>Coz: Max 2</span>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}