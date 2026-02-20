import { useState } from "react";
import { useStore, Table } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Play, Pause, ChevronRight, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
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
    // Step 1: Select Table (Floor Plan Layout)
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-6">
          <h2 className="text-2xl font-serif text-primary">Mapa do Salão</h2>
          <div className="flex gap-3 text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-card border border-border" /> Livre</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary/10 border border-primary/50" /> Em Serviço</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500" /> Prepara</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500" /> Pronto</div>
          </div>
        </div>
        
        <div className="relative w-full aspect-[3/4] sm:aspect-square md:aspect-video lg:aspect-[16/10] max-h-[75vh] bg-[#1a1b1e] rounded-xl border border-border/20 overflow-hidden shadow-2xl">
          {/* Subtle grid background for the floor plan feel */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          {/* Kitchen Entrance Area */}
          <div className="absolute top-0 left-0 w-[25%] h-12 bg-secondary/80 border-b border-r border-border/40 rounded-br-2xl flex items-center justify-center text-xs uppercase tracking-widest text-muted-foreground shadow-inner backdrop-blur-sm z-10">
            Cozinha
          </div>

          {/* Render tables on the map */}
          {tables.map(table => {
            const hasActiveService = table.menu && table.pairing;
            const isPreparing = table.status === 'preparing';
            const isReady = table.status === 'ready';

            // Base styling
            let shapeClass = "flex items-center justify-center cursor-pointer transition-all duration-300 shadow-xl border-2 hover:scale-105 active:scale-95 absolute z-20";
            let colorClass = "border-border/30 bg-[#25262b] text-foreground hover:border-primary/40";
            let positionClass = "";

            // Active states overriding base colors
            if (isPreparing) {
              colorClass = "border-amber-500 bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
            } else if (isReady) {
              colorClass = "border-emerald-500 bg-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
            } else if (hasActiveService) {
              colorClass = "border-primary/60 bg-primary/10 text-primary shadow-[0_0_15px_rgba(212,175,55,0.15)]";
            }

            // --- Positioning Logic based on the prompt ---
            // "circular tables 10, 20, 21, 40, 41 arranged across the central area"
            // "rectangular tables 1, 2, 3 aligned at the bottom"
            // "table 51 positioned upper-right"
            
            // Round Tables
            if (['10', '20', '21', '40', '41', '51'].includes(table.number)) {
              shapeClass += " rounded-full w-[12%] h-[12%] min-w-[50px] min-h-[50px] max-w-[80px] max-h-[80px]";
              
              if (table.number === '10') {
                positionClass = "top-[25%] left-[20%]";
              } else if (table.number === '20') {
                positionClass = "top-[35%] left-[45%]";
              } else if (table.number === '21') {
                positionClass = "top-[30%] left-[65%]";
              } else if (table.number === '40') {
                positionClass = "top-[55%] left-[30%]";
              } else if (table.number === '41') {
                positionClass = "top-[60%] left-[55%]";
              } else if (table.number === '51') {
                positionClass = "top-[15%] right-[25%]";
              }
            }
            
            // Rectangular Tables (Bottom aligned)
            else if (['1', '2', '3'].includes(table.number)) {
              shapeClass += " rounded-lg w-[16%] h-[8%] min-w-[70px] min-h-[40px] max-w-[120px] max-h-[60px]";
              
              if (table.number === '1') {
                positionClass = "bottom-[10%] left-[15%]";
              } else if (table.number === '2') {
                positionClass = "bottom-[10%] left-[40%]";
              } else if (table.number === '3') {
                positionClass = "bottom-[10%] left-[65%]";
              }
            }

            if (positionClass) {
              return (
                <div 
                  key={table.id}
                  className={`${shapeClass} ${colorClass} ${positionClass}`}
                  onClick={() => handleSelectTable(table.id)}
                  data-testid={`map-table-${table.number}`}
                >
                  <span className="font-serif text-lg sm:text-xl font-medium tracking-tighter">{table.number}</span>
                  
                  {/* Status Indicator Dots */}
                  {hasActiveService && !isPreparing && !isReady && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full border-2 border-[#1a1b1e]" />
                  )}
                  {isPreparing && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-[#1a1b1e] animate-pulse" />
                  )}
                  {isReady && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#1a1b1e] shadow-[0_0_8px_#10b981]" />
                  )}
                </div>
              );
            }
            return null;
          })}

          {/* "Vertical diagonal column of smaller dark rectangular tables on the far right side" */}
          {/* These act as visual context from the floor plan */}
          <div className="absolute top-[10%] right-[8%] bottom-[15%] w-[8%] flex flex-col justify-between items-center z-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
               <div 
                 key={`deco-${i}`}
                 className="w-full h-[12%] min-h-[25px] max-h-[45px] bg-[#141518] border border-white/5 rounded-sm transform -rotate-[15deg] shadow-lg flex items-center justify-center opacity-80"
               >
                 <div className="w-[80%] h-[20%] bg-white/5 rounded-full"></div>
               </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  if (!selectedTable) return null;

  const step = getStep(selectedTable);

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => setSelectedTableId(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1">Mesa</span>
            <h2 className="text-3xl font-serif text-primary">{selectedTable.number}</h2>
          </div>
        </div>
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
            <CardHeader className="pb-4 border-b border-border/20">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-serif text-2xl text-primary">{selectedTable.menu}</CardTitle>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mt-1">{selectedTable.pairing}</p>
                </div>
                <Badge variant={
                  selectedTable.status === 'ready' ? 'default' : 
                  selectedTable.status === 'preparing' ? 'outline' : 
                  selectedTable.status === 'paused' ? 'destructive' : 'secondary'
                } className="uppercase px-3 py-1 text-[10px]">
                  {selectedTable.status === 'ready' ? 'Pronto na Cozinha' : 
                   selectedTable.status === 'preparing' ? 'Preparando' : 
                   selectedTable.status === 'paused' ? 'Pausado' : 'Aguardando'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-col items-center justify-center p-10 border border-border/10 rounded-xl bg-background/30 relative overflow-hidden shadow-inner">
                {selectedTable.status === 'preparing' && (
                  <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
                )}
                {selectedTable.status === 'ready' && (
                  <div className="absolute inset-0 bg-emerald-500/5" />
                )}
                
                <span className="text-xs uppercase tracking-widest text-muted-foreground mb-3 relative z-10">Momento Atual</span>
                <div className="text-6xl font-serif text-foreground mb-4 relative z-10 drop-shadow-md">
                  {selectedTable.currentMoment} <span className="text-muted-foreground/50 text-4xl">/ {selectedTable.totalMoments}</span>
                </div>
                
                <div className="h-6 relative z-10">
                  {selectedTable.status === 'preparing' && (
                    <div className="flex items-center text-amber-500 text-sm font-medium animate-pulse mt-2 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
                      <Clock className="w-4 h-4 mr-2" />
                      Cozinha em preparo
                    </div>
                  )}
                  {selectedTable.status === 'ready' && (
                    <div className="flex items-center text-emerald-500 text-sm font-medium mt-2 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Pronto para retirar
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-4 pt-2 pb-6 px-6">
              <Button 
                variant="outline" 
                size="lg" 
                className={`w-16 h-14 border-border/40 transition-colors ${selectedTable.status === 'paused' ? 'bg-destructive/20 text-destructive border-destructive/50' : 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'}`}
                onClick={handlePause}
                data-testid="button-pause"
              >
                {selectedTable.status === 'paused' ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
              </Button>
              <Button 
                className="flex-1 h-14 bg-primary text-primary-foreground hover:bg-primary/90 text-lg tracking-wide shadow-[0_0_20px_rgba(var(--primary),0.2)] disabled:opacity-50 disabled:shadow-none transition-all"
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