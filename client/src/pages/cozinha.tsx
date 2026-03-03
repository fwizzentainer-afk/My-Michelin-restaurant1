import { useStore, Table } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, AlertTriangle, Utensils, Expand } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppContainer, PremiumCard, StatusBadge } from "@/components/design-system";

export default function Cozinha() {
  const { tables, menus, updateTable, triggerNotification } = useStore();
  
  const activeTables = tables.filter(t => t.menu && (t.currentMoment > 0 || t.momentsHistory.some(h => h.momentNumber === -1)));
  const preparingTables = activeTables.filter(t => t.status === 'preparing');
  const readyTables = activeTables.filter(t => t.status === 'ready');

  const handleReady = (id: string) => {
    const table = tables.find(t => t.id === id);
    if (!table) return;

    let updatedHistory = [...table.momentsHistory];
    const momentIdx = updatedHistory.findIndex(h => h.momentNumber === table.currentMoment);
    if (momentIdx !== -1) {
      updatedHistory[momentIdx].readyTime = Date.now();
    }

    updateTable(id, { 
      status: 'ready',
      momentsHistory: updatedHistory
    });

    triggerNotification('sala', `Mesa ${table.number} - Momento Pronto`, `Momento ${table.currentMoment} está pronto para ser servido.`);
  };

  return (
    <AppContainer className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-4xl font-bold text-primary">Painel da Cozinha</h2>
          <p className="text-muted-foreground text-sm uppercase tracking-[0.18em] mt-1">Gestão de Comandas em Tempo Real</p>
        </div>
        <div className="flex gap-4">
          <PremiumCard className="px-4 py-2 bg-amber-500/10 border-amber-500/20 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-amber-500/70 font-bold leading-none">Em Preparo</span>
              <span className="text-xl font-medium leading-none mt-1">{preparingTables.length}</span>
            </div>
          </PremiumCard>
          <PremiumCard className="px-4 py-2 bg-emerald-500/10 border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-emerald-500/70 font-bold leading-none">Pronto</span>
              <span className="text-xl font-medium leading-none mt-1">{readyTables.length}</span>
            </div>
          </PremiumCard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTables.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-card/20 rounded-2xl border-2 border-dashed border-border/40">
            <Utensils className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium uppercase tracking-widest">Sem comandas ativas no momento</p>
          </div>
        ) : (
          activeTables.map(table => (
            <CozinhaTableCard 
              key={table.id} 
              table={table} 
              onReady={() => handleReady(table.id)} 
              menuMoments={menus.find(m => m.name === table.menu)?.moments || []}
              displayMoments={menus.find(m => m.name === table.menu)?.displayMoments || []}
            />
          ))
        )}
      </div>
    </AppContainer>
  );
}

function CozinhaTableCard({
  table,
  onReady,
  menuMoments,
  displayMoments,
}: {
  table: Table;
  onReady: () => void;
  menuMoments: string[];
  displayMoments: number[];
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (table.status === 'preparing' && table.lastMomentTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - table.lastMomentTime!) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [table.status, table.lastMomentTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMomentDisplay = (moment: number) => {
    if (moment === 0) return "0";
    const mapped = displayMoments[moment - 1];
    return String(mapped ?? moment);
  };

  const currentMomentName = table.currentMoment > 0 ? menuMoments[table.currentMoment - 1] : null;
  const stepStatus = menuMoments.map((name, idx) => {
    const step = idx + 1;
    const history = table.momentsHistory.find((h) => h.momentNumber === step);
    return {
      step,
      real: displayMoments[idx] ?? step,
      name,
      history,
      completed: !!history?.finishTime,
      inProgress: !!history && !history.finishTime,
    };
  });

  return (
    <Card className={`overflow-hidden transition-all border-2 duration-300 flex flex-col ${
      table.status === 'ready' ? 'border-emerald-500/30 bg-emerald-500/5' : 
      table.status === 'paused' ? 'border-destructive/30 bg-destructive/5' :
      table.status === 'idle' && table.menu ? 'border-primary/30 bg-primary/5' :
      'border-amber-500/30 bg-amber-500/5'
    } ${table.currentMoment === 1 && table.status === "preparing" ? "animate-in zoom-in-95" : ""}`}>
      {table.restrictions.type && (
        <div className={`py-1 px-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-between border-b border-white/10 ${
          table.restrictions.type === 'alergia' ? 'bg-destructive text-white' : 
          table.restrictions.type === 'intolerancia' ? 'bg-amber-600 text-white' : 
          'bg-primary text-primary-foreground'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            <span>{table.restrictions.type}: {table.restrictions.description}</span>
          </div>
        </div>
      )}

      <CardHeader className="pb-4 border-b border-border/20">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-serif text-2xl border-2 ${
              table.status === 'ready' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-primary text-primary-foreground border-primary/50'
            }`}>
              {table.number}
            </div>
            <div>
              <CardTitle className="text-lg font-serif">{table.menu}</CardTitle>
              <div className="flex items-center justify-between gap-4 w-full">
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">{table.pairing || 'Aguardando Pairing'}</p>
                <div className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-2">
                  <span className="text-primary">{table.pax} PAX</span>
                  <span>-</span>
                  <span className="text-primary">{table.language}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 pb-6 space-y-4 flex-1">
        <div className="bg-background/40 p-4 rounded-xl border border-border/20 shadow-inner">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-tighter">Momento</span>
            <Badge variant="outline" className="text-xs font-mono border-primary/20 text-primary">
              {getMomentDisplay(table.currentMoment)} / {table.totalMoments}
            </Badge>
          </div>
          <div className="text-xl font-serif text-foreground uppercase tracking-tight text-center py-2">
            {currentMomentName || (table.status === 'idle' && table.menu ? "SEATED - AGUARDANDO" : "Aguardando")}
          </div>
        </div>

        {table.status === 'paused' && (
          <div className="flex items-center justify-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 animate-pulse">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Serviço Pausado pela Sala</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-6 px-6">
        <div className="w-full space-y-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-border/40">
                <Expand className="w-4 h-4 mr-2" />
                Ver passos completos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  Mesa {table.number} · {table.pax ?? "-"} Pax
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {table.menu} · Pairing {table.pairing || "Aguardando"}
                </p>
              </DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {stepStatus.map((step) => (
                  <div key={step.step} className="rounded-lg border border-border/40 p-3 bg-background/40">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {step.completed ? "✔" : step.inProgress ? "◐" : "☐"} M{step.real}/{table.totalMoments} - {step.name}
                      </p>
                      {step.inProgress && <StatusBadge tone="preparing">Em preparo</StatusBadge>}
                      {step.completed && <StatusBadge tone="ready">Concluído</StatusBadge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.history?.startTime
                        ? new Date(step.history.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Aguardando"}
                    </p>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button
            className={`w-full h-14 text-lg font-serif tracking-wide transition-all ${
            table.status === 'ready' 
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
          }`}
            disabled={table.status !== 'preparing'}
            onClick={onReady}
            data-testid={`button-ready-${table.id}`}
          >
            {table.status === 'ready' ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Servido
              </div>
            ) : "Serviço"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
