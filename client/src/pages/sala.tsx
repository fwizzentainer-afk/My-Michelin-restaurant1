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
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-serif text-primary border-b border-border/40 pb-2 mb-6">Mapa do Salão</h2>
        
        <div className="relative w-full aspect-[3/4] sm:aspect-square md:aspect-video max-h-[70vh] bg-card/20 rounded-xl border border-border/40 overflow-hidden mx-auto">
          {/* Helper function to render a table on the map */}
          {tables.map(table => {
            const hasActiveService = table.menu && table.pairing;
            const isPreparing = table.status === 'preparing';
            const isReady = table.status === 'ready';

            // Base styling for all tables
            let shapeClass = "rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg border-2 hover:scale-105 active:scale-95";
            let colorClass = "border-border/40 bg-card/60 text-foreground";
            let positionClass = "";

            if (isPreparing) {
              colorClass = "border-amber-500 bg-amber-500/10 text-amber-500 animate-pulse";
            } else if (isReady) {
              colorClass = "border-emerald-500 bg-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
            } else if (hasActiveService) {
              colorClass = "border-primary/50 bg-primary/10 text-primary";
            }

            // Specific positioning and shaping based on the requested floor plan
            // Note: coordinates are % based (top, left) for responsiveness
            
            // Round Tables in the center area
            if (table.number === '10') {
              positionClass = "absolute top-[40%] left-[25%] w-[15%] h-[15%] max-w-[80px] max-h-[80px]";
            } else if (table.number === '20') {
              positionClass = "absolute top-[25%] left-[50%] w-[15%] h-[15%] max-w-[80px] max-h-[80px]";
            } else if (table.number === '21') {
              positionClass = "absolute top-[45%] left-[55%] w-[15%] h-[15%] max-w-[80px] max-h-[80px]";
            } else if (table.number === '40') {
              positionClass = "absolute top-[65%] left-[30%] w-[15%] h-[15%] max-w-[80px] max-h-[80px]";
            } else if (table.number === '41') {
              positionClass = "absolute top-[70%] left-[60%] w-[15%] h-[15%] max-w-[80px] max-h-[80px]";
            }
            
            // Large Rectangular Tables at the bottom
            else if (table.number === '1') {
              shapeClass = "rounded-md flex items-center justify-center cursor-pointer transition-all shadow-lg border-2 hover:scale-105 active:scale-95";
              positionClass = "absolute bottom-[5%] left-[15%] w-[18%] h-[8%] max-w-[100px] max-h-[50px]";
            } else if (table.number === '2') {
              shapeClass = "rounded-md flex items-center justify-center cursor-pointer transition-all shadow-lg border-2 hover:scale-105 active:scale-95";
              positionClass = "absolute bottom-[5%] left-[40%] w-[18%] h-[8%] max-w-[100px] max-h-[50px]";
            } else if (table.number === '3') {
              shapeClass = "rounded-md flex items-center justify-center cursor-pointer transition-all shadow-lg border-2 hover:scale-105 active:scale-95";
              positionClass = "absolute bottom-[5%] left-[65%] w-[18%] h-[8%] max-w-[100px] max-h-[50px]";
            }
            
            // Top Right Table 51
            else if (table.number === '51') {
              shapeClass = "rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg border-2 hover:scale-105 active:scale-95";
              positionClass = "absolute top-[10%] right-[25%] w-[12%] h-[12%] max-w-[70px] max-h-[70px]";
            }
            
            // Right edge small dark tables (Diagonal column)
            else if (['t1', 't2', 't3', 't4', 't5'].includes(table.number)) { // Assuming these are the small dark ones if they existed. Let's add them to the store if they aren't there, or map existing ones. Since the prompt says "vertical diagonal column of smaller dark rectangular tables on the far right side", I'll render decorative ones if they don't map to IDs, or map some new IDs if needed. Let's assume they are just part of the visual layout for now unless they need active service.
               // Since the store only has '10', '20', '21', '40', '41', '1', '2', '3' and we added '51'. Wait, the store didn't have 51. I should update the store to include '51' and the side tables.
            }

            // Render mapped tables
            if (positionClass) {
              return (
                <div 
                  key={table.id}
                  className={`${shapeClass} ${colorClass} ${positionClass}`}
                  onClick={() => handleSelectTable(table.id)}
                  data-testid={`map-table-${table.number}`}
                >
                  <span className="font-serif text-lg sm:text-xl font-medium">{table.number}</span>
                  {/* Status Indicator Dot */}
                  {hasActiveService && !isPreparing && !isReady && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                  )}
                  {isPreparing && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
                  )}
                  {isReady && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                  )}
                </div>
              );
            }
            return null; // Don't render tables that aren't mapped on the floor plan
          })}

          {/* Render the right-side decorative dark tables (diagonal column) */}
          {[1, 2, 3, 4, 5].map((i) => (
             <div 
               key={`deco-${i}`}
               className="absolute right-[5%] w-[6%] h-[12%] max-w-[30px] max-h-[60px] bg-secondary/80 border border-border/30 rounded-sm transform -rotate-12"
               style={{ top: `${15 + (i * 15)}%` }}
             />
          ))}

          {/* Kitchen entrance marker (decorative) */}
          <div className="absolute top-0 left-0 w-[20%] h-8 bg-secondary/50 border-b border-r border-border/40 rounded-br-lg flex items-center justify-center text-[10px] uppercase tracking-widest text-muted-foreground">
            Cozinha
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-muted-foreground uppercase tracking-widest">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-card border border-border" /> Livre</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary/10 border border-primary/50" /> Em Serviço</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500" /> Preparando</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500" /> Pronto</div>
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
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setSelectedTableId(null)}>
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
              <div className="flex flex-col items-center justify-center p-8 border border-border/20 rounded-lg bg-background/50 relative overflow-hidden">
                {selectedTable.status === 'preparing' && (
                  <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
                )}
                {selectedTable.status === 'ready' && (
                  <div className="absolute inset-0 bg-emerald-500/5" />
                )}
                
                <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 relative z-10">Momento Atual</span>
                <div className="text-5xl font-serif text-foreground mb-2 relative z-10">
                  {selectedTable.currentMoment} <span className="text-muted-foreground text-3xl">/ {selectedTable.totalMoments}</span>
                </div>
                
                <div className="h-6 relative z-10">
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
              </div>
            </CardContent>
            <CardFooter className="flex gap-4 pt-2">
              <Button 
                variant="outline" 
                size="lg" 
                className={`w-16 border-border/40 transition-colors ${selectedTable.status === 'paused' ? 'bg-destructive/20 text-destructive border-destructive/50' : 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'}`}
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