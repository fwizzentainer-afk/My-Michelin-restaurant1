import { useState, useMemo } from "react";
import { useStore, Menu, Table, MomentLog, HistoricalService } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Settings2, Plus, Trash2, Lock, Clock, ArrowUpRight, CheckCircle2, Calendar as CalendarIcon, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Admin() {
  const { menus, tables, historicalLogs, createMenu, updateMenu, deleteMenu } = useStore();
  const { toast } = useToast();
  
  const [newMenuName, setNewMenuName] = useState("");
  const [newMoments, setNewMoments] = useState<string[]>([""]);
  
  // Filters for Analytics
  const [dateRange, setDateRange] = useState<string>("today"); // 'today', 'week', 'all'
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [selectedMenuFilter, setSelectedMenuFilter] = useState<string>("all");

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

  const getTotalTableTime = (table: Table | HistoricalService) => {
    if (!table.startTime) return 0;
    return ('endTime' in table ? table.endTime : (table.lastMomentTime || Date.now())) - table.startTime;
  };

  const activeTables = tables.filter(t => t.menu && t.currentMoment > 0);
  const IDEAL_PREP_TIME = 8 * 60 * 1000; 

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

  // Analytics Data Prep
  const allServices = useMemo(() => {
    // Combine historical logs and completed active tables (for realtime stats if needed, but usually history is enough for charts)
    // We'll use historical logs for the charts. If none, we generate some mock data based on the menus for demonstration of the UI.
    let data = [...historicalLogs];
    
    // Mock data injection if history is empty so charts aren't blank
    if (data.length === 0) {
      const mockMenu1 = menus.find(m => m.name.includes("9"));
      const mockMenu2 = menus.find(m => m.name.includes("11"));
      
      const createMockService = (menu: Menu, dateOffset: number, tableNum: string): HistoricalService => {
        const startTime = Date.now() - (dateOffset * 86400000) - (2 * 3600000); // offset days + 2 hours ago
        let currentT = startTime;
        const history: MomentLog[] = menu.moments.map((name, i) => {
          const cozTime = (4 + Math.random() * 6) * 60000; 
          const salaTime = (1 + Math.random() * 3) * 60000;
          const log = {
            momentNumber: i + 1,
            momentName: name,
            startTime: currentT,
            readyTime: currentT + cozTime,
            finishTime: currentT + cozTime + salaTime
          };
          currentT += cozTime + salaTime;
          return log;
        });
        
        return {
          id: `mock-${Math.random()}`,
          tableNumber: tableNum,
          menuName: menu.name,
          pairing: "Essencial",
          startTime,
          endTime: currentT,
          momentsHistory: history
        };
      };

      if (mockMenu1) {
        data.push(createMockService(mockMenu1, 0, "10")); // today
        data.push(createMockService(mockMenu1, 0, "20")); // today
        data.push(createMockService(mockMenu1, 1, "10")); // yesterday
      }
      if (mockMenu2) {
        data.push(createMockService(mockMenu2, 0, "40")); // today
        data.push(createMockService(mockMenu2, 1, "40")); // yesterday
        data.push(createMockService(mockMenu2, 1, "41")); // yesterday
      }
    }
    
    return data;
  }, [historicalLogs, menus]);

  // Filtering
  const filteredServices = useMemo(() => {
    let filtered = allServices;
    if (selectedMenuFilter !== "all") {
      filtered = filtered.filter(s => s.menuName === selectedMenuFilter);
    }
    
    const now = Date.now();
    const day = 86400000;
    
    if (dateRange === "today") {
      filtered = filtered.filter(s => (now - s.startTime) < day);
    } else if (dateRange === "week") {
      filtered = filtered.filter(s => (now - s.startTime) < 7 * day);
    }
    
    return filtered;
  }, [allServices, selectedMenuFilter, dateRange]);

  // Chart 1: Average Time per Moment (Cozinha vs Sala)
  const momentStatsData = useMemo(() => {
    const stats: Record<string, { name: string, cozinhaTotal: number, salaTotal: number, count: number }> = {};
    
    filteredServices.forEach(s => {
      s.momentsHistory.forEach(log => {
        if (!stats[log.momentName]) {
          stats[log.momentName] = { name: log.momentName.substring(0, 15) + (log.momentName.length > 15 ? '...' : ''), cozinhaTotal: 0, salaTotal: 0, count: 0 };
        }
        stats[log.momentName].cozinhaTotal += getCozinhaTime(log) / 60000; // in minutes
        stats[log.momentName].salaTotal += getSalaTime(log) / 60000;
        stats[log.momentName].count += 1;
      });
    });
    
    return Object.values(stats).map(s => ({
      name: s.name,
      Cozinha: Number((s.cozinhaTotal / s.count).toFixed(1)),
      Sala: Number((s.salaTotal / s.count).toFixed(1)),
      Total: Number(((s.cozinhaTotal + s.salaTotal) / s.count).toFixed(1))
    }));
  }, [filteredServices]);

  // Compare Mode Data
  const compareData = useMemo(() => {
    if (!compareMode) return [];
    
    const now = Date.now();
    const day = 86400000;
    
    const period1 = allServices.filter(s => (now - s.startTime) < day); // Today
    const period2 = allServices.filter(s => (now - s.startTime) >= day && (now - s.startTime) < 2 * day); // Yesterday
    
    const stats: Record<string, { name: string, today: number, yesterday: number, count1: number, count2: number }> = {};
    
    const process = (services: HistoricalService[], key: 'today' | 'yesterday', countKey: 'count1' | 'count2') => {
      services.forEach(s => {
        s.momentsHistory.forEach(log => {
          if (!stats[log.momentName]) {
            stats[log.momentName] = { name: log.momentName.substring(0, 10), today: 0, yesterday: 0, count1: 0, count2: 0 };
          }
          stats[log.momentName][key] += (getCozinhaTime(log) + getSalaTime(log)) / 60000;
          stats[log.momentName][countKey] += 1;
        });
      });
    };
    
    process(period1, 'today', 'count1');
    process(period2, 'yesterday', 'count2');
    
    return Object.values(stats).map(s => ({
      name: s.name,
      Hoje: s.count1 ? Number((s.today / s.count1).toFixed(1)) : 0,
      Ontem: s.count2 ? Number((s.yesterday / s.count2).toFixed(1)) : 0,
    }));
  }, [allServices, compareMode]);

  // Handlers for Menus
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

    createMenu({ name: newMenuName, moments: newMoments, isActive: false });
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

  // Custom Recharts theme colors based on our CSS variables
  const colors = {
    primary: "hsl(43 74% 49%)",     // Gold
    secondary: "hsl(0 0% 80%)",     // Gray
    emerald: "hsl(160 84% 39%)",    // Emerald
    destructive: "hsl(0 84% 60%)",  // Red
    background: "hsl(240 10% 4%)",  // Dark
    card: "hsl(240 10% 8%)",        // Slightly lighter dark
    border: "hsl(240 10% 15%)"
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h2 className="text-2xl font-serif text-primary flex items-center">
          <Settings2 className="w-5 h-5 mr-3" />
          Painel de Gestão & Analytics Avançado
        </h2>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-card border border-border/40 mb-6">
          <TabsTrigger value="realtime" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Clock className="w-4 h-4 mr-2" />
            Tempo Real
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <BarChart3 className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="menus" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <UtensilsIcon className="w-4 h-4 mr-2" />
            Menus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Mesas em Serviço" value={activeTables.length.toString()} trend="No momento" good={activeTables.length > 0} />
            <MetricCard title="Serviços Finalizados" value={historicalLogs.length.toString()} trend="Hoje" />
            <MetricCard title="Atrasos Detectados" value={delayedTables.length.toString()} trend="> 8 min na cozinha" bad={delayedTables.length > 0} />
            <Card className="border-border/40 bg-card/60 overflow-hidden relative">
              <div className="absolute inset-0 bg-primary/5"></div>
              <CardContent className="p-6 relative z-10">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Mesa Mais Rápida</p>
                <p className="text-3xl font-serif text-foreground mb-1">{rankedTables.length > 0 ? `Mesa ${rankedTables[0].number}` : '-'}</p>
                <p className="text-xs font-medium text-emerald-500">Excelente eficiência</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTables.map(table => {
                  const currentLog = table.momentsHistory.find(l => l.momentNumber === table.currentMoment);
                  const isDelayed = currentLog && !currentLog.readyTime && (Date.now() - currentLog.startTime!) > IDEAL_PREP_TIME;
                  
                  return (
                    <Card key={table.id} className={`border-border/40 bg-card/60 transition-colors ${isDelayed ? 'border-destructive/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : ''}`}>
                      <CardContent className="p-0">
                        <div className="flex flex-col border-b border-border/20">
                          <div className="p-4 bg-background/50 border-b border-border/20 flex justify-between items-center">
                            <div>
                              <span className="text-xs uppercase text-muted-foreground tracking-widest">Mesa {table.number}</span>
                              <span className="font-serif text-lg text-primary block">{table.menu}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs uppercase text-muted-foreground tracking-widest block">Tempo Total</span>
                              <span className="font-mono text-foreground">{formatDuration(getTotalTableTime(table))}</span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <Badge variant="outline" className="mb-2 bg-background">Momento {table.currentMoment} / {table.totalMoments}</Badge>
                                <h4 className="font-medium text-foreground text-sm">{currentLog?.momentName || "Aguardando..."}</h4>
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/40 p-4 rounded-lg border border-border/40">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Últimos 7 dias</SelectItem>
                    <SelectItem value="all">Todo Histórico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedMenuFilter} onValueChange={setSelectedMenuFilter}>
                  <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                    <SelectValue placeholder="Menu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Menus</SelectItem>
                    {menus.map(m => (
                      <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              variant={compareMode ? "default" : "outline"} 
              size="sm" 
              onClick={() => setCompareMode(!compareMode)}
              className={compareMode ? "bg-primary text-primary-foreground h-8 text-xs" : "h-8 text-xs"}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Comparar (Hoje vs Ontem)
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/40 bg-card/60 col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-serif text-lg">
                  {compareMode ? "Comparativo de Tempo Total por Momento (Minutos)" : "Tempo Médio por Momento (Cozinha vs Sala em Minutos)"}
                </CardTitle>
                <CardDescription>
                  {compareMode ? "Evolução do tempo médio de serviço: Hoje vs Ontem" : "Análise detalhada do gargalo de produção e transição"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {!compareMode ? (
                      <BarChart data={momentStatsData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke={colors.secondary} 
                          fontSize={10} 
                          tickMargin={10} 
                          angle={-45} 
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis stroke={colors.secondary} fontSize={11} tickFormatter={(value) => `${value}m`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: colors.card, borderColor: colors.border, borderRadius: '8px' }}
                          itemStyle={{ fontSize: '12px' }}
                          formatter={(value: number) => [`${value} min`, undefined]}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                        <Bar dataKey="Cozinha" stackId="a" fill={colors.primary} radius={[0, 0, 4, 4]} />
                        <Bar dataKey="Sala" stackId="a" fill={colors.emerald} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={compareData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke={colors.secondary} 
                          fontSize={10} 
                          tickMargin={10} 
                          angle={-45} 
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis stroke={colors.secondary} fontSize={11} tickFormatter={(value) => `${value}m`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: colors.card, borderColor: colors.border, borderRadius: '8px' }}
                          itemStyle={{ fontSize: '12px' }}
                          formatter={(value: number) => [`${value} min`, undefined]}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="Hoje" stroke={colors.primary} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Ontem" stroke={colors.secondary} strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/60">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Distribuição de Duração Média (Menus)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-2">
                  {menus.map(menu => {
                    const menuServices = allServices.filter(s => s.menuName === menu.name);
                    const avgTime = menuServices.reduce((acc, s) => acc + (s.endTime - s.startTime), 0) / (menuServices.length || 1);
                    const targetTime = menu.name.includes("11") ? 150 * 60000 : 120 * 60000; // Fake targets: 2h30 for 11, 2h for 9
                    
                    const progress = Math.min((avgTime / targetTime) * 100, 100);
                    
                    return (
                      <div key={menu.id} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">{menu.name}</span>
                          <span className={avgTime > targetTime ? "text-amber-500" : "text-emerald-500"}>
                            {menuServices.length ? formatDuration(avgTime) : 'Sem dados'}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${avgTime > targetTime ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${menuServices.length ? progress : 0}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-right">Target: {formatDuration(targetTime)}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/60">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Histórico Recente de Mesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-2">
                  {historicalLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum serviço finalizado ainda.</p>
                  ) : (
                    historicalLogs.slice(-5).reverse().map(log => (
                      <div key={log.id} className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/20">
                        <div>
                          <p className="font-medium text-sm">Mesa {log.tableNumber}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{log.menuName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm text-primary">{formatDuration(log.endTime - log.startTime)}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(log.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="menus" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Management (Unchanged from before) */}
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
      <span className="text-[10px] uppercase text-muted-foreground mb-1 text-center leading-tight">{label}</span>
      <span className={`font-mono text-sm ${active ? 'text-primary' : 'text-foreground'}`}>{format(ms)}</span>
    </div>
  );
}