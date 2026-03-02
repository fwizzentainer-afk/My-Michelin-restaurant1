import { useState } from "react";
import { useStore, Table } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Play, Pause, ChevronRight, CheckCircle2, Clock, ArrowLeft, Check, Settings, Volume2, VolumeX, XCircle, Utensils, UserCheck, AlertTriangle, Languages, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Sala() {
  const { tables, menus, pairings, updateTable, finishService, triggerNotification, settings, updateSettings } = useStore();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const activeMenus = menus.filter(m => m.isActive);

  const getStep = (table: Table) => {
    if (!table.menu) return "menu";
    if (table.status === 'idle' && table.currentMoment === 0 && table.momentsHistory.length === 0) return "seated";
    if (!table.pairing) return "pairing";
    return "service";
  };

  const getMomentDisplay = (moment: number, total: number) => {
    if (moment === 0) return "0";
    if (moment === 1) return "1&2";
    if (moment === total - 1) return `${total-1}&${total}`;
    return moment + 1;
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
      status: 'idle',
      momentsHistory: [],
      startTime: null,
      lastMomentTime: null,
      pax: 2, // Default
      language: 'PT' // Default
    });
  };

  const handleSeated = () => {
    if (!selectedTableId || !selectedTable) return;
    
    const now = Date.now();
    updateTable(selectedTableId, {
      momentsHistory: [{
        momentNumber: -1,
        momentName: 'Seated',
        startTime: now,
        readyTime: now,
        finishTime: now
      }]
    });
    
    triggerNotification('cozinha', `Mesa ${selectedTable.number} - Sentada`, `Mesa sentada (${selectedTable.pax} PAX, ${selectedTable.language}) com ${selectedTable.menu}.`);
    setSelectedTableId(null);
  };

  const handleSelectPairing = (pairing: string) => {
    if (!selectedTableId) return;
    updateTable(selectedTableId, { pairing });
  };

  const handleNextMoment = () => {
    if (!selectedTable) return;
    
    const now = Date.now();
    const nextMoment = selectedTable.currentMoment + 1;
    let updatedHistory = [...selectedTable.momentsHistory];
    
    if (selectedTable.currentMoment > 0) {
      const prevIdx = updatedHistory.findIndex(h => h.momentNumber === selectedTable.currentMoment);
      if (prevIdx !== -1 && !updatedHistory[prevIdx].finishTime) {
        updatedHistory[prevIdx].finishTime = now;
      }
    }

    const actualSteps = selectedTable.totalMoments - 2;
    if (selectedTable.currentMoment >= actualSteps + 1) {
      finishService(selectedTable.id);
      setSelectedTableId(null);
      return;
    }

    const menuInfo = menus.find(m => m.name === selectedTable.menu);
    const momentName = menuInfo ? menuInfo.moments[nextMoment - 1] : `Momento ${nextMoment}`;

    updatedHistory.push({
      momentNumber: nextMoment,
      momentName,
      startTime: now,
      readyTime: null,
      finishTime: null
    });

    updateTable(selectedTable.id, {
      currentMoment: nextMoment,
      status: 'preparing',
      lastMomentTime: now,
      startTime: selectedTable.currentMoment === 0 ? now : selectedTable.startTime,
      momentsHistory: updatedHistory
    });

    triggerNotification('cozinha', `Mesa ${selectedTable.number} - Próximo Momento`, `${momentName} está em preparo.`);
  };

  const handlePause = () => {
    if (!selectedTable) return;
    updateTable(selectedTable.id, {
      status: selectedTable.status === 'paused' ? 'idle' : 'paused'
    });
  };

  const handleForceFinish = () => {
    if (!selectedTable) return;
    finishService(selectedTable.id);
    setSelectedTableId(null);
  };

  const updateRestriction = (type: 'alergia' | 'intolerancia' | 'gravidez' | null, description: string) => {
    if (!selectedTableId) return;
    updateTable(selectedTableId, {
      restrictions: { type, description }
    });
  };

  const updatePax = (pax: number) => {
    if (!selectedTableId) return;
    updateTable(selectedTableId, { pax });
  };

  const updateLanguage = (lang: string) => {
    if (!selectedTableId) return;
    updateTable(selectedTableId, { language: lang });
  };

  if (!selectedTableId) {
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-serif text-primary">Mapa do Salão</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary h-8 w-8">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-serif text-primary">Configurações</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                      <div className="space-y-0.5">
                        <Label>Alerta Sonoro</Label>
                        <p className="text-xs text-muted-foreground">Toque de notificação ao receber alertas</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.soundEnabled} 
                      onCheckedChange={(val) => updateSettings({ soundEnabled: val })} 
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 text-[9px] sm:text-xs text-muted-foreground uppercase tracking-widest justify-end">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-card border border-border" /> Livre</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-500" /> Sentada</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary/10 border border-primary/50" /> Em Serviço</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500" /> Prepara</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500" /> Pronto</div>
          </div>
        </div>
        
        <div className="relative w-full aspect-[3/4] sm:aspect-square md:aspect-video lg:aspect-[16/10] max-h-[75vh] bg-[#1a1b1e] rounded-xl border border-border/20 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          <div className="absolute top-0 left-0 w-[25%] h-12 bg-secondary/80 border-b border-r border-border/40 rounded-br-2xl flex items-center justify-center text-xs uppercase tracking-widest text-muted-foreground shadow-inner backdrop-blur-sm z-10">
            Cozinha
          </div>

          {tables.map(table => {
            const hasActiveService = table.menu && table.pairing;
            const isSeated = table.menu && !table.pairing && table.momentsHistory.some(h => h.momentNumber === -1);
            const isPreparing = table.status === 'preparing';
            const isReady = table.status === 'ready';

            let shapeClass = "flex items-center justify-center cursor-pointer transition-all duration-300 shadow-xl border-2 hover:scale-105 active:scale-95 absolute z-20";
            let colorClass = "border-border/30 bg-[#25262b] text-foreground hover:border-primary/40";
            
            if (isPreparing) {
              colorClass = "border-amber-500 bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
            } else if (isReady) {
              colorClass = "border-emerald-500 bg-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
            } else if (hasActiveService) {
              colorClass = "border-primary/60 bg-primary/10 text-primary shadow-[0_0_15px_rgba(212,175,55,0.15)]";
            } else if (isSeated) {
              colorClass = "border-red-500 bg-red-600/20 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]";
            }

            const style: React.CSSProperties = {};

            if (['10', '11', '20', '21', '40', '41', '50'].includes(table.number)) {
              shapeClass += " rounded-full w-[12%] h-[12%] min-w-[50px] min-h-[50px] max-w-[80px] max-h-[80px]";
              if (table.number === '10') { style.top = '45%'; style.left = '10%'; }
              else if (table.number === '11') { style.top = '65%'; style.left = '12%'; }
              else if (table.number === '20') { style.top = '35%'; style.left = '35%'; }
              else if (table.number === '21') { style.top = '58%'; style.left = '33%'; }
              else if (table.number === '40') { style.top = '35%'; style.left = '62%'; }
              else if (table.number === '41') { style.top = '58%'; style.left = '60%'; }
              else if (table.number === '50') { style.top = '12%'; style.left = '65%'; }
            }
            else if (['1', '2', '3'].includes(table.number)) {
              shapeClass += " rounded-lg w-[16%] h-[8%] min-w-[70px] min-h-[40px] max-w-[120px] max-h-[60px]";
              style.bottom = '8%';
              if (table.number === '1') { style.left = '15%'; }
              else if (table.number === '2') { style.left = '40%'; }
              else if (table.number === '3') { style.left = '65%'; }
            }
            else if (['51', '52', '53', '54', '55', '56', '57'].includes(table.number)) {
              shapeClass += " rounded-sm w-[8%] h-[6%] min-w-[35px] min-h-[25px] max-w-[60px] max-h-[40px] transform -rotate-[15deg]";
              const idx = parseInt(table.number) - 51;
              style.right = '5%';
              style.top = `${15 + (idx * 11)}%`;
            }

            if (Object.keys(style).length > 0) {
              return (
                <div 
                  key={table.id}
                  className={`${shapeClass} ${colorClass}`}
                  style={style}
                  onClick={() => handleSelectTable(table.id)}
                  data-testid={`map-table-${table.number}`}
                >
                  <span className="font-serif text-lg sm:text-xl font-medium tracking-tighter">{table.number}</span>
                  {(hasActiveService || isSeated) && !isPreparing && !isReady && (
                    <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#1a1b1e] ${isSeated ? 'bg-red-500' : 'bg-primary'}`} />
                  )}
                  {isPreparing && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-[#1a1b1e] animate-pulse" />
                  )}
                  {isReady && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#1a1b1e] shadow-[0_0_8px_#10b981]" />
                  )}
                  {table.restrictions.type && (
                    <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-destructive rounded-full border-2 border-[#1a1b1e] flex items-center justify-center">
                      <AlertTriangle className="w-2 h-2 text-white" />
                    </span>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  }

  if (!selectedTable) return null;

  const step = getStep(selectedTable);
  const currentMomentName = selectedTable.momentsHistory.find(h => h.momentNumber === selectedTable.currentMoment)?.momentName;

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

        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className={`gap-2 h-10 border-border/40 ${selectedTable.restrictions.type ? 'bg-destructive/10 text-destructive border-destructive/20' : 'text-muted-foreground'}`}>
                <AlertTriangle className="w-4 h-4" />
                <span>Restrições</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif text-primary flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Restrições da Mesa {selectedTable.number}
                </DialogTitle>
              </DialogHeader>
              <div className="py-6 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant={selectedTable.restrictions.type === 'alergia' ? 'default' : 'outline'}
                    className={selectedTable.restrictions.type === 'alergia' ? 'bg-destructive hover:bg-destructive/90' : 'border-border'}
                    onClick={() => updateRestriction('alergia', selectedTable.restrictions.description)}
                  >Alergia</Button>
                  <Button 
                    variant={selectedTable.restrictions.type === 'intolerancia' ? 'default' : 'outline'}
                    className={selectedTable.restrictions.type === 'intolerancia' ? 'bg-amber-600 hover:bg-amber-600/90' : 'border-border'}
                    onClick={() => updateRestriction('intolerancia', selectedTable.restrictions.description)}
                  >Intolerância</Button>
                  <Button 
                    variant={selectedTable.restrictions.type === 'gravidez' ? 'default' : 'outline'}
                    className={selectedTable.restrictions.type === 'gravidez' ? 'bg-primary hover:bg-primary/90' : 'border-border'}
                    onClick={() => updateRestriction('gravidez', selectedTable.restrictions.description)}
                  >Gravidez</Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    placeholder="Descreva a restrição detalhadamente..." 
                    className="min-h-[100px] border-border bg-background/50"
                    value={selectedTable.restrictions.description}
                    onChange={(e) => updateRestriction(selectedTable.restrictions.type, e.target.value)}
                  />
                </div>
                
                {selectedTable.restrictions.type && (
                  <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => updateRestriction(null, '')}>Limpar Restrições</Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {selectedTable.menu && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-10 w-10">
                  <XCircle className="w-6 h-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-destructive">Encerrar Mesa</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-muted-foreground">Tem certeza que deseja encerrar o serviço da mesa {selectedTable.number} antecipadamente?</p>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" className="border-border">Cancelar</Button>
                  <Button variant="destructive" onClick={handleForceFinish}>Encerrar Serviço</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
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

      {step === "seated" && (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 flex flex-col py-6">
          <div className="bg-card/40 border border-border/40 rounded-xl p-6 space-y-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Users className="w-5 h-5" />
                <Label className="text-sm uppercase tracking-widest font-bold">Número de PAX</Label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <Button 
                    key={n}
                    variant={selectedTable.pax === n ? 'default' : 'outline'}
                    className={`h-12 text-lg font-serif ${selectedTable.pax === n ? 'bg-primary' : 'border-border/40 hover:border-primary/40'}`}
                    onClick={() => updatePax(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Languages className="w-5 h-5" />
                <Label className="text-sm uppercase tracking-widest font-bold">Idioma</Label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['PT', 'ES', 'ING'].map(lang => (
                  <Button 
                    key={lang}
                    variant={selectedTable.language === lang ? 'default' : 'outline'}
                    className={`h-12 text-sm font-bold tracking-widest ${selectedTable.language === lang ? 'bg-primary' : 'border-border/40 hover:border-primary/40'}`}
                    onClick={() => updateLanguage(lang)}
                  >
                    {lang}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center pt-4">
            <Button 
              className="w-full h-16 bg-primary text-primary-foreground text-xl font-serif shadow-lg group"
              onClick={handleSeated}
              data-testid="button-seated"
            >
              <UserCheck className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              Seated
            </Button>
            <p className="mt-4 text-xs text-muted-foreground uppercase tracking-widest opacity-60">
              Mesa {selectedTable.number} • {selectedTable.menu}
            </p>
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
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="font-serif text-2xl text-primary">{selectedTable.menu}</CardTitle>
                    <Badge variant="outline" className="text-[10px] h-5 border-primary/20 text-primary/80">
                      {selectedTable.pax} PAX • {selectedTable.language}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">{selectedTable.pairing}</p>
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
                <div className="text-6xl font-serif text-foreground mb-2 relative z-10 drop-shadow-md">
                  {getMomentDisplay(selectedTable.currentMoment, selectedTable.totalMoments)} 
                  <span className="text-muted-foreground/50 text-4xl"> / {selectedTable.totalMoments}</span>
                </div>

                {currentMomentName && (
                  <div className="flex items-center gap-2 text-primary/80 mb-4 relative z-10">
                    <Utensils className="w-4 h-4" />
                    <span className="text-sm font-medium tracking-tight uppercase italic">{currentMomentName}</span>
                  </div>
                )}
                
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
                  {selectedTable.currentMoment === 0 && (
                    <div className="text-muted-foreground text-sm font-medium mt-2">
                      Aguardando início
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
              
              {selectedTable.currentMoment >= (selectedTable.totalMoments - 2) ? (
                <Button 
                  className="flex-1 h-14 bg-emerald-600 text-white hover:bg-emerald-700 text-lg tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                  onClick={handleForceFinish}
                  data-testid="button-finish-service"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Finalizar Serviço
                </Button>
              ) : (
                <Button 
                  className="flex-1 h-14 bg-primary text-primary-foreground hover:bg-primary/90 text-lg tracking-wide shadow-[0_0_20px_rgba(var(--primary),0.2)] disabled:opacity-50 disabled:shadow-none transition-all"
                  disabled={selectedTable.status === 'preparing' || selectedTable.status === 'paused'}
                  onClick={handleNextMoment}
                  data-testid="button-next-moment"
                >
                  {selectedTable.currentMoment === 0 ? "Iniciar Serviço" : "Próximo Momento"}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}