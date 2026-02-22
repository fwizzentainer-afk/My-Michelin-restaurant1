import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle2, Utensils, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Cozinha() {
  const { tables, menus, updateTable, triggerNotification } = useStore();

  const activeTables = tables.filter(t => t.menu !== null && t.currentMoment > 0);

  const handleReady = (id: string) => {
    const table = tables.find(t => t.id === id);
    if (!table) return;

    // Update readyTime for current moment
    const updatedHistory = [...table.momentsHistory];
    const currentIdx = updatedHistory.findIndex(h => h.momentNumber === table.currentMoment);
    if (currentIdx !== -1) {
      updatedHistory[currentIdx].readyTime = Date.now();
    }

    updateTable(id, { status: 'ready', momentsHistory: updatedHistory });
    
    // Notify Sala
    triggerNotification('sala', `Mesa ${table.number} - Pronto`, `O momento ${table.currentMoment} está pronto para ser servido.`);
  };

  if (activeTables.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
        <Utensils className="w-16 h-16 opacity-20" />
        <p className="text-xl font-serif tracking-widest uppercase">Nenhuma comanda em andamento</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h2 className="text-2xl font-serif text-primary flex items-center">
          <Utensils className="w-5 h-5 mr-3" />
          Modo Cozinha
        </h2>
        <Badge variant="outline" className="text-xs uppercase tracking-widest bg-background/50">
          Alto Contraste
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeTables.map(table => {
          const isPreparing = table.status === 'preparing';
          const isReady = table.status === 'ready';
          const isPaused = table.status === 'paused';
          
          const menuInfo = menus.find(m => m.name === table.menu);
          const momentName = table.currentMoment > 0 && menuInfo 
            ? menuInfo.moments[table.currentMoment - 1] 
            : "Aguardando Início";

          return (
            <Card 
              key={table.id}
              className={`border-2 transition-all shadow-lg overflow-hidden ${
                isPreparing ? 'border-amber-500 bg-amber-500/5' : 
                isReady ? 'border-emerald-500/30 bg-emerald-500/5 opacity-70' : 
                'border-border/40 bg-card/60'
              }`}
              data-testid={`card-kitchen-table-${table.number}`}
            >
              {isPreparing && (
                <div className="bg-amber-500 text-amber-950 text-xs uppercase tracking-widest font-bold py-1.5 px-4 flex justify-between items-center">
                  <span>Em Preparo</span>
                  <Timer className="w-3 h-3 animate-pulse" />
                </div>
              )}
              {isReady && (
                <div className="bg-emerald-500/20 text-emerald-500 text-xs uppercase tracking-widest font-bold py-1.5 px-4 flex justify-between items-center">
                  <span>Pronto para Retirada</span>
                </div>
              )}
              {isPaused && (
                <div className="bg-destructive/20 text-destructive text-xs uppercase tracking-widest font-bold py-1.5 px-4 flex justify-between items-center">
                  <span>Pausado pela Sala</span>
                </div>
              )}

              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-4xl font-serif text-foreground">
                    Mesa {table.number}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mt-2">
                    {table.menu}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-background border border-border/40 flex items-center justify-center text-2xl font-serif text-primary">
                  {table.currentMoment}<span className="text-sm text-muted-foreground ml-1">/{table.totalMoments}</span>
                </div>
              </CardHeader>
              
              <CardContent className="py-4 border-y border-border/20 bg-background/30">
                <div className="text-lg font-medium text-foreground">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1">Prato Atual</span>
                  {momentName}
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                <Button 
                  className={`w-full h-16 text-lg tracking-wide ${
                    isPreparing 
                      ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold' 
                      : 'bg-secondary text-secondary-foreground opacity-50'
                  }`}
                  disabled={!isPreparing}
                  onClick={() => handleReady(table.id)}
                  data-testid={`button-ready-${table.number}`}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Serviço
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}