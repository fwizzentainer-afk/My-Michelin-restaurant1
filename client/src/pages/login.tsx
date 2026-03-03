import { useState } from "react";
import { useLocation } from "wouter";
import { useStore, Role } from "@/lib/store";
import RestaurantAccessSelection from "@/components/restaurant-access-selection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleRoleSelect = (role: Exclude<Role, null>) => {
    setSelectedRole(role);
    setUsername("");
    setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !selectedRole) {
      toast({ title: "Preencha usuário e senha" });
      return;
    }
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Não foi possível entrar");
      }
      const data = await res.json();
      const role = (data.role ?? selectedRole) as Role;
      login(role);
      setLocation(`/${role}`);
    } catch (err) {
      toast({
        title: "Login falhou",
        description: err instanceof Error ? err.message : "Tente novamente",
        variant: "destructive",
      });
    }
  };

  if (!selectedRole) {
    return <RestaurantAccessSelection onSelectRole={handleRoleSelect} />;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0e0e0e] px-4">
      <Card className="w-full max-w-md border-[#272727] bg-[#121212] text-[#ececec]">
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6 p-6">
            <button
              type="button"
              className="flex items-center text-xs uppercase tracking-[2px] text-[#9a9a9a] hover:text-[#d0d0d0]"
              onClick={() => setSelectedRole(null)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao acesso
            </button>

            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[3px] text-[#7a7a7a]">Entrar como</p>
              <p className="text-base uppercase tracking-[4px]">{selectedRole}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-[11px] uppercase tracking-[3px] text-[#7a7a7a]">
                Usuário
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: sala01"
                className="h-11 border-[#2a2a2a] bg-[#0f0f0f] text-[#ececec] placeholder:text-[#5a5a5a]"
                autoFocus
                data-testid="input-login-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] uppercase tracking-[3px] text-[#7a7a7a]">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira a senha"
                className="h-11 border-[#2a2a2a] bg-[#0f0f0f] text-[#ececec] placeholder:text-[#5a5a5a]"
                data-testid="input-login-password"
              />
            </div>
          </CardContent>

          <CardFooter className="px-6 pb-6 pt-0">
            <Button
              type="submit"
              className="h-12 w-full border border-[#2f2f2f] bg-transparent text-[11px] uppercase tracking-[4px] text-[#c8c8c8] hover:bg-[#181818]"
              data-testid="button-login-admin"
            >
              Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
