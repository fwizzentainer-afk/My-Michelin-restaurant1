import { useState } from "react";
import { useStore, Menu } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Settings2, Plus, Trash2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { menus, createMenu, updateMenu, deleteMenu } = useStore();
  const { toast } = useToast();
  
  // New Menu State
  const [newMenuName, setNewMenuName] = useState("");
  const [newMoments, setNewMoments] = useState<string[]>([""]);

  const handleAddMoment = () => {
    setNewMoments([...newMoments, ""]);
  };

  const handleUpdateMoment = (index: number, value: string) => {
    const updated = [...newMoments];
    updated[index] = value;
    setNewMoments(updated);
  };

  const handleRemoveMoment = (index: number) => {
    if (newMoments.length <= 1) return;
    const updated = newMoments.filter((_, i) => i !== index);
    setNewMoments(updated);
  };

  const handleCreateMenu = () => {
    if (!newMenuName.trim()) {
      toast({ title: "Erro", description: "Nome do menu é obrigatório", variant: "destructive" });
      return;
    }
    if (newMoments.some(m => !m.trim())) {
      toast({ title: "Erro", description: "Todos os momentos devem ter um nome", variant: "destructive" });
      return;
    }

    createMenu({
      name: newMenuName,
      moments: newMoments,
      isActive: false
    });

    setNewMenuName("");
    setNewMoments([""]);
    toast({ title: "Sucesso", description: "Menu criado com sucesso" });
  };

  const handleDeleteMenu = (menu: Menu) => {
    if (menu.isActive) {
      toast({ title: "Ação Negada", description: "Não é possível excluir um menu ativo.", variant: "destructive" });
      return;
    }
    deleteMenu(menu.id);
    toast({ title: "Sucesso", description: "Menu excluído." });
  };

  const toggleMenuStatus = (menu: Menu) => {
    updateMenu(menu.id, { isActive: !menu.isActive });
    toast({ title: "Status Atualizado", description: `Menu ${!menu.isActive ? 'ativado' : 'desativado'}.` });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h2 className="text-2xl font-serif text-primary flex items-center">
          <Settings2 className="w-5 h-5 mr-3" />
          Painel de Gestão
        </h2>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-card border border-border/40">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="menus" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <UtensilsIcon className="w-4 h-4 mr-2" />
            Menus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Tempo Médio Preparo" value="8m 42s" trend="-12% vs Ontem" good />
            <MetricCard title="Duração Total Mesa" value="2h 15m" trend="+5% vs Ontem" />
            <MetricCard title="Atrasos Detectados" value="3" trend="Mesa 10, Mesa 41" bad />
            <MetricCard title="Menu Mais Pedido" value="Inverno" trend="68% das mesas" />
          </div>

          <Card className="border-border/40 bg-card/60">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Comparativo de Desempenho (Mock)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border border-dashed border-border/40 rounded-lg text-muted-foreground uppercase tracking-widest text-xs">
                [ Gráfico de Barras Aqui ]
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menus" className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-serif text-foreground">Menus Cadastrados</h3>
            {menus.map((menu) => (
              <Card key={menu.id} className={`border-border/40 transition-colors ${menu.isActive ? 'border-primary/50 bg-primary/5' : 'bg-card/40'}`}>
                <CardContent className="p-6 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-serif text-foreground">{menu.name}</h4>
                      {menu.isActive && <span className="bg-primary/20 text-primary text-[10px] uppercase px-2 py-0.5 rounded border border-primary/30">Ativo</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {menu.moments.length} Momentos: {menu.moments.join(" → ")}
                    </p>
                  </div>
                  <div className="flex sm:flex-col justify-end gap-2 shrink-0">
                    <Button 
                      variant={menu.isActive ? "outline" : "default"} 
                      size="sm"
                      className={!menu.isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                      onClick={() => toggleMenuStatus(menu)}
                    >
                      {menu.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="bg-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/30"
                      onClick={() => handleDeleteMenu(menu)}
                      disabled={menu.isActive}
                    >
                      {menu.isActive ? <Lock className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-serif text-foreground">Criar Novo Menu</h3>
            <Card className="border-border/40 bg-card/60">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Nome do Menu</Label>
                  <Input 
                    value={newMenuName}
                    onChange={(e) => setNewMenuName(e.target.value)}
                    placeholder="Ex: Menu Primavera"
                    className="bg-background/50 border-border/50"
                  />
                </div>
                
                <div className="space-y-3 pt-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Momentos do Serviço</Label>
                  {newMoments.map((moment, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <div className="w-6 text-center text-xs text-muted-foreground">{idx + 1}.</div>
                      <Input 
                        value={moment}
                        onChange={(e) => handleUpdateMoment(idx, e.target.value)}
                        placeholder="Ex: Snacks"
                        className="bg-background/50 border-border/50 h-9"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemoveMoment(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full border-dashed border-border/60 mt-2" onClick={handleAddMoment}>
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Momento
                  </Button>
                </div>

                <div className="pt-4">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleCreateMenu}>
                    Salvar Menu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </TabsContent>
      </Tabs>
    </div>
  );
}

function UtensilsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}

function MetricCard({ title, value, trend, good, bad }: any) {
  return (
    <Card className="border-border/40 bg-card/60">
      <CardContent className="p-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
        <p className="text-3xl font-serif text-foreground mb-2">{value}</p>
        <p className={`text-xs font-medium ${good ? 'text-emerald-500' : bad ? 'text-destructive' : 'text-muted-foreground'}`}>
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}