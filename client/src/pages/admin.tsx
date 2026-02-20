import { useState } from "react";
import { useStore, Menu, Table, MomentLog } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Settings2, Plus, Trash2, Lock, Clock, AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Admin() {
  const { menus, tables, historicalLogs, createMenu, updateMenu, deleteMenu } = useStore();
  const { toast } = useToast();
  
  // New Menu State
  const [newMenuName, setNewMenuName] = useState("");
  const [newMoments, setNewMoments] = useState<string[]>([""]);

  const formatDuration = (ms: number) => {
    if (!ms || ms < 0) return "0s";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getCozinhaTime = (log: MomentLog) => {
    if (!log.startTime) return 0;
    const end = log.readyTime || Date.now();
    return end - log.startTime;
  };

  const getSalaTime = (log: MomentLog) => {
    if (!log.readyTime) return 0;
    const end = log.finishTime || Date.now();
    return end - log.readyTime;
  };

  const getTotalTableTime = (table: Table) => {
    if (!table.startTime) return 0;
    return (table.lastMomentTime || Date.now()) - table.startTime;
  };

  // Pre-calculate active metrics
  const activeTables = tables.filter(t => t.menu && t.currentMoment > 0);
  
  // Fake thresholds for simulation
  const IDEAL_PREP_TIME = 8 * 60 * 1000; // 8 mins

  // Rank tables by efficiency (average prep time per moment)
  const rankedTables = [...activeTables].sort((a, b) => {
    const avgA = a.momentsHistory.reduce((sum, log) => sum + getCozinhaTime(log), 0) / (a.momentsHistory.length || 1);
    const avgB = b.momentsHistory.reduce((sum, log) => sum + getCozinhaTime(log), 0) / (b.momentsHistory.length || 1);
    return avgA - avgB;
  });

  const delayedTables = activeTables.filter(t => {
    const currentLog = t.momentsHistory.find(l => l.momentNumber === t.currentMoment);
    if (!currentLog || currentLog.readyTime) return false;
    return (Date.now() - currentLog.startTime!) > IDEAL_PREP_TIME;
  });

  const handleAddMoment = () => setNewMoments([...newMoments, ""]);
  const handleUpdateMoment = (index: number, value: string) => {
    const updated = [...newMoments];
    updated[index] = value;
    setNewMoments(updated);
  };
  const handleRemoveMoment = (index: number) => {
    if (newMoments.length <= 1) return;
    setNewMoments(newMoments.filter((_, i) => i !== index));
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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h2 className="text-2xl font-serif text-primary flex items-center">
          <Settings2 className="w-5 h-5 mr-3" />
          Painel de Gestão & Analytics
        </h2>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-card border border-border/40 mb-6">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics de Serviço
          </TabsTrigger>
          <TabsTrigger value="menus" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <UtensilsIcon className="w-4 h-4 mr-2" />
            Gestão de Menus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Main KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Mesas em Serviço" 
              value={activeTables.length.toString()} 
              trend="No momento" 
              good={activeTables.length > 0} 
            />
            <MetricCard 
              title="Serviços Finalizados" 
              value={historicalLogs.length.toString()} 
              trend="Hoje" 
            />
            <MetricCard 
              title="Atrasos Detectados" 
              value={delayedTables.length.toString()} 
              trend="> 8 min na cozinha" 
              bad={delayedTables.length > 0} 
            />
            <Card className="border-border/40 bg-card/60 overflow-hidden relative">
              <div className="absolute inset-0 bg-primary/5"></div>
              <CardContent className="p-6 relative z-10">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Mesa Mais Rápida</p>
                <p className="text-3xl font-serif text-foreground mb-1">{rankedTables.length > 0 ? `Mesa ${rankedTables[0].number}` : '-'}</p>
                <p className="text-xs font-medium text-emerald-500">Excelente eficiência</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monitor Real-Time */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-serif text-foreground flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                Monitor de Serviço (Tempo Real)
              </h3>
              
              {activeTables.length === 0 ? (
                <Card className="border-dashed border-border/40 bg-card/30">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Nenhuma mesa em atendimento no momento.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {activeTables.map(table => {
                    const currentLog = table.momentsHistory.find(l => l.momentNumber === table.currentMoment);
                    const isDelayed = currentLog && !currentLog.readyTime && (Date.now() - currentLog.startTime!) > IDEAL_PREP_TIME;
                    
                    return (
                      <Card key={table.id} className={`border-border/40 bg-card/60 transition-colors ${isDelayed ? 'border-destructive/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : ''}`}>
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row border-b border-border/20">
                            <div className="p-4 md:w-48 bg-background/50 border-r border-border/20 flex flex-col justify-center">
                              <span className="text-xs uppercase text-muted-foreground tracking-widest">Mesa {table.number}</span>
                              <span className="font-serif text-lg text-primary">{table.menu}</span>
                              <span className="text-xs text-muted-foreground mt-1">Total: {formatDuration(getTotalTableTime(table))}</span>
                            </div>
                            <div className="p-4 flex-1">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <Badge variant="outline" className="mb-2">Momento {table.currentMoment} / {table.totalMoments}</Badge>
                                  <h4 className="font-medium text-foreground">{currentLog?.momentName || "Aguardando..."}</h4>
                                </div>
                                {table.status === 'preparing' && (
                                  <Badge variant={isDelayed ? "destructive" : "secondary"} className="animate-pulse">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {isDelayed ? "Atrasado" : "Em Preparo"}
                                  </Badge>
                                )}
                                {table.status === 'ready' && (
                                  <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Pronto p/ Servir
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2">
                                <TimeMetric label="T. Cozinha" ms={currentLog ? getCozinhaTime(currentLog) : 0} active={table.status === 'preparing'} />
                                <TimeMetric label="T. Sala (Trans.)" ms={currentLog ? getSalaTime(currentLog) : 0} active={table.status === 'ready'} />
                                <TimeMetric label="Total Momento" ms={currentLog ? getCozinhaTime(currentLog) + getSalaTime(currentLog) : 0} />
                              </div>
                            </div>
                          </div>
                          
                          {/* Mini History Accordion could go here, keeping it flat for now */}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Evaluation Summary / Reports */}
            <div className="space-y-4">
              <h3 className="text-lg font-serif text-foreground flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                Desempenho por Menu
              </h3>
              
              {menus.filter(m => m.isActive).map(menu => {
                // Calc stats for this menu across all historical and active tables
                const relevantTables = [...activeTables, ...historicalLogs].filter(t => t.menuName === menu.name || t.menu === menu.name);
                const avgTotal = relevantTables.reduce((acc, t) => acc + ('endTime' in t ? t.endTime - t.startTime : getTotalTableTime(t as Table)), 0) / (relevantTables.length || 1);
                
                return (
                  <Card key={menu.id} className="border-border/40 bg-card/60">
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-base font-serif">{menu.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Mesas Atendidas:</span>
                        <span className="font-medium text-foreground">{relevantTables.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Duração Média:</span>
                        <span className="font-medium text-primary">{relevantTables.length ? formatDuration(avgTotal) : '-'}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Button variant="outline" className="w-full mt-4 border-dashed border-border/40">
                <ArrowUpRight className="w-4 h-4 mr-2" /> Exportar Relatório Diário
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="menus" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      {menu.moments.length} Momentos cadastrados
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {menu.moments.map((m, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] font-normal">{i+1}. {m}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex sm:flex-col justify-start gap-2 shrink-0 border-l border-border/20 pl-4 sm:border-l-0 sm:pl-0">
                    <Button 
                      variant={menu.isActive ? "outline" : "default"} 
                      size="sm"
                      className={!menu.isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "w-full"}
                      onClick={() => toggleMenuStatus(menu)}
                    >
                      {menu.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="bg-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/30 w-full"
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
                
                <div className="space-y-3 pt-2 max-h-[40vh] overflow-y-auto pr-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground sticky top-0 bg-card py-2 z-10 block">Momentos do Serviço</Label>
                  {newMoments.map((moment, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <div className="w-6 text-center text-xs text-muted-foreground shrink-0">{idx + 1}.</div>
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

                <div className="pt-4 border-t border-border/20">
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
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function TimeMetric({ label, ms, active }: { label: string, ms: number, active?: boolean }) {
  const format = (timeMs: number) => {
    if (!timeMs || timeMs <= 0) return "--:--";
    const m = Math.floor(timeMs / 60000);
    const s = Math.floor((timeMs % 60000) / 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-2 rounded bg-background/50 border border-border/20 flex flex-col items-center justify-center ${active ? 'ring-1 ring-primary/50' : ''}`}>
      <span className="text-[10px] uppercase text-muted-foreground mb-1">{label}</span>
      <span className={`font-mono text-sm ${active ? 'text-primary' : 'text-foreground'}`}>{format(ms)}</span>
    </div>
  );
}