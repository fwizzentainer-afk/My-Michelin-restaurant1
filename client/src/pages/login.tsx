import { useState } from "react";
import { useLocation } from "wouter";
import { useStore, Role } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, UtensilsCrossed, Shield, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [password, setPassword] = useState("");
  const { login } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleRoleSelect = (role: Role) => {
    if (role === "sala") {
      login("sala");
      setLocation("/sala");
    } else if (role === "cozinha") {
      login("cozinha");
      setLocation("/cozinha");
    } else {
      setSelectedRole(role);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === "senha") {
      login("admin");
      setLocation("/admin");
    } else {
      toast({
        title: "Senha incorreta",
        description: "A senha de administrador é inválida.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center -mt-10 animate-in fade-in duration-700">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background z-0" />
      
      <Card className="w-full max-w-md border-border/40 bg-card/60 backdrop-blur-xl relative z-10 shadow-2xl shadow-black/50 overflow-hidden">
        <CardHeader className="space-y-4 text-center pb-6 pt-10">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-2">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="font-serif text-3xl mb-2 text-foreground">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-muted-foreground tracking-wide uppercase text-xs">
              My Michelin Restaurant
            </CardDescription>
          </div>
        </CardHeader>
        
        {!selectedRole ? (
          <CardContent className="space-y-4 px-6 pb-10 animate-in slide-in-from-left-4 duration-300">
            <Button 
              variant="outline" 
              className="w-full h-20 text-lg justify-start px-6 border-border/40 hover:border-primary/50 hover:bg-primary/5"
              onClick={() => handleRoleSelect("sala")}
              data-testid="btn-role-sala"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <span className="font-serif text-xl block">Sala</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Máx. 5 Dispositivos</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-20 text-lg justify-start px-6 border-border/40 hover:border-primary/50 hover:bg-primary/5"
              onClick={() => handleRoleSelect("cozinha")}
              data-testid="btn-role-cozinha"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                <ChefHat className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <span className="font-serif text-xl block">Cozinha</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Máx. 2 Dispositivos</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-20 text-lg justify-start px-6 border-border/40 hover:border-primary/50 hover:bg-primary/5"
              onClick={() => handleRoleSelect("admin")}
              data-testid="btn-role-admin"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <span className="font-serif text-xl block">Admin</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Gestão do Sistema</span>
              </div>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleAdminLogin} className="animate-in slide-in-from-right-4 duration-300">
            <CardContent className="space-y-6 px-6 pb-6">
              <div className="flex items-center text-primary mb-4 cursor-pointer hover:underline" onClick={() => setSelectedRole(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="text-sm">Voltar às opções</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">Senha do Administrador</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Insira a senha"
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/50 h-14 text-lg"
                  autoFocus
                  data-testid="input-login-password"
                />
              </div>
            </CardContent>
            <CardFooter className="px-6 pb-10">
              <Button type="submit" className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-wide text-lg" data-testid="button-login-admin">
                Acessar Gestão
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}