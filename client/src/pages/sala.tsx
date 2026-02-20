import { useState } from "react";
import { useStore, Table } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Play, Pause, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Sala() {
  const { tables, menus, pairings, updateTable } = useStore();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const activeMenus = menus.filter(m => m.isActive);

  // Determine current step based on table state
  const getStep = (table: Table) => {
    if (!table.menu) return "menu";
    if (!table.pairing) return "pairing";
    return "service";
  };

  const handleSelectTable = (id: string) => setSelectedTableId(id);
  
  const handleSelectMenu = (menuId: string) => {
    if (!selectedTableId) return;
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;
    
    updateTable(selectedTableId, { 
      menu: menu.name,
      totalMoments: menu.moments.length,
      currentMoment: 0,
      status: 'idle'
    });
  };

  const handleSelectPairing = (pairing: string) => {
    if (!selectedTableId) return;
    updateTable(selectedTableId, { pairing });
  };

  const handleNextMoment = () => {
    if (!selectedTable) return;
    
    const nextMoment = selectedTable.currentMoment + 1;
    updateTable(selectedTable.id, {
      currentMoment: nextMoment,
      status: 'preparing',
      lastMomentTime: Date.now(),
      startTime: selectedTable.currentMoment === 0 ? Date.now() : selectedTable.startTime
    });
  };

  const handlePause = () => {
    if (!selectedTable) return;
    updateTable(selectedTable.id, {
      status: selectedTable.status === 'paused' ? 'idle' : 'paused'
    });
  };

  if (!selectedTableId) {
    // Step 1: Select Table
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-serif text-primary border-b border-border/40 pb-2">Selecione a Mesa</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tables.map(table => {
            const hasActiveService = table.menu && table.pairing;
            const isPreparing = table.status === 'preparing';
            const isReady = table.status === 'ready';

            return (
              <Card 
                key={table.id}
                className={`cursor-pointer transition-all hover:border-primary/50 hover:bg-card/80 ${
                  isPreparing ? 'border-amber-500/50 bg-amber-500/5' : 
                  isReady ? 'border-emerald-500/50 bg-emerald-500/5' : 
                  'border-border/40 bg-card/40'
                }`}
                onClick={() => handleSelectTable(table.id)}
                data-testid={`card-table-${table.number}`}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
                  <span className="text-3xl font-serif">{table.number}</span>
                  {hasActiveService && (
                    <Badge variant={isReady ? 'default' : isPreparing ? 'outline' : 'secondary'} className="text-[10px] uppercase">
                      {isReady ? 'Pronto' : isPreparing ? 'Preparando' : 'Em Serviço'}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (!selectedTable) return null;

  const step = getStep(selectedTable);

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1">Mesa</span>
          <h2 className="text-3xl font-serif text-primary">{selectedTable.number}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedTableId(null)}>
          Voltar às Mesas
        </Button>
      </div>

      {step === "menu" && (
        <div className="space-y-4 animate-in slide-in-from-right-8 duration-500">
          <h3 className="text-lg uppercase tracking-widest text-muted-foreground text-center mb-6">Escolha o Menu</h3>
          <div className="flex flex-col gap-3">
            {activeMenus.map(menu => (
              <Button 
                key={menu.id}
                variant="outline" 
                className="h-16 justify-between px-6 border-border/40 hover:border-primary/50 hover:bg-primary/5"
                onClick={() => handleSelectMenu(menu.id)}
                data-testid={`button-menu-${menu.id}`}
              >
                <span className="font-serif text-lg">{menu.name}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
          </div>
        </div>
      )}

      {step === "pairing" && (
        <div className="space-y-4 animate-in slide-in-from-right-8 duration-500">
          <h3 className="text-lg uppercase tracking-widest text-muted-foreground text-center mb-6">Escolha a Harmonização</h3>
          <div className="flex flex-col gap-3">
            {pairings.map(pairing => (
              <Button 
                key={pairing}
                variant="outline" 
                className="h-16 justify-between px-6 border-border/40 hover:border-primary/50 hover:bg-primary/5"
                onClick={() => handleSelectPairing(pairing)}
                data-testid={`button-pairing-${pairing.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <span className="font-serif text-lg">{pairing}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
          </div>
        </div>
      )}

      {step === "service" && (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
          <Card className="border-primary/20 bg-card/60 backdrop-blur">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-serif text-2xl text-primary">{selectedTable.menu}</CardTitle>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mt-1">{selectedTable.pairing}</p>
                </div>
                <Badge variant={
                  selectedTable.status === 'ready' ? 'default' : 
                  selectedTable.status === 'preparing' ? 'outline' : 
                  selectedTable.status === 'paused' ? 'destructive' : 'secondary'
                } className="uppercase px-3 py-1">
                  {selectedTable.status === 'ready' ? 'Pronto na Cozinha' : 
                   selectedTable.status === 'preparing' ? 'Preparando' : 
                   selectedTable.status === 'paused' ? 'Pausado' : 'Aguardando'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center p-8 border border-border/20 rounded-lg bg-background/50">
                <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Momento Atual</span>
                <div className="text-5xl font-serif text-foreground mb-2">
                  {selectedTable.currentMoment} <span className="text-muted-foreground text-3xl">/ {selectedTable.totalMoments}</span>
                </div>
                {selectedTable.status === 'preparing' && (
                  <div className="flex items-center text-amber-500 text-sm animate-pulse mt-2">
                    <Clock className="w-4 h-4 mr-2" />
                    Cozinha em preparo
                  </div>
                )}
                {selectedTable.status === 'ready' && (
                  <div className="flex items-center text-emerald-500 text-sm mt-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Pode retirar
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-4 pt-2">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-16 border-border/40 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={handlePause}
                data-testid="button-pause"
              >
                {selectedTable.status === 'paused' ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>
              <Button 
                className="flex-1 h-14 bg-primary text-primary-foreground hover:bg-primary/90 text-lg tracking-wide shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-50 disabled:shadow-none transition-all"
                disabled={selectedTable.status === 'preparing' || selectedTable.status === 'paused' || selectedTable.currentMoment >= selectedTable.totalMoments}
                onClick={handleNextMoment}
                data-testid="button-next-moment"
              >
                Próximo Momento
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}