import { useStore, Menu, Table } from "@/lib/store";
import { CheckCircle2, Clock, AlertCircle, AlertTriangle, Utensils } from "lucide-react";
import { useEffect, useState } from "react";

type KitchenStatus = "preparing" | "ready" | "paused" | "idle" | "finished";

const statusConfig: Record<KitchenStatus, { label: string; dotColor: string; textColor: string }> = {
  preparing: { label: "Em Preparo", dotColor: "#d4a843", textColor: "rgba(212,168,67,0.85)" },
  ready: { label: "Pronto", dotColor: "#52c78d", textColor: "rgba(82,199,141,0.85)" },
  paused: { label: "Pausado", dotColor: "#c75252", textColor: "rgba(199,82,82,0.85)" },
  finished: { label: "Finalizado", dotColor: "#7a1f2f", textColor: "rgba(237,205,221,0.95)" },
  idle: { label: "Aguardando", dotColor: "#555555", textColor: "rgba(255,255,255,0.25)" },
};

export default function Cozinha() {
  const { tables, menus, updateTable, triggerNotification } = useStore();

  const activeTables = tables.filter(
    (t) => t.status !== "finished" && t.menu && (t.currentMoment > 0 || t.momentsHistory.some((h) => h.momentNumber === -1)),
  );
  const finishedTables = tables.filter((t) => t.status === "finished" && t.menu);
  const visibleTables = [...activeTables, ...finishedTables];
  const preparingTables = activeTables.filter((t) => t.status === "preparing");
  const readyTables = activeTables.filter((t) => t.status === "ready");
  const seatedTables = tables.filter(
    (t) => t.menu && !t.pairing && t.momentsHistory.some((h) => h.momentNumber === -1),
  ).length;

  const handleReady = (id: string) => {
    const table = tables.find((t) => t.id === id);
    if (!table) return;

    const updatedHistory = [...table.momentsHistory];
    const momentIdx = updatedHistory.findIndex((h) => h.momentNumber === table.currentMoment);
    if (momentIdx !== -1) updatedHistory[momentIdx].readyTime = Date.now();

    updateTable(id, {
      status: "ready",
      momentsHistory: updatedHistory,
    });

    triggerNotification("sala", `Mesa ${table.number} - Momento Pronto`, `Momento ${table.currentMoment} está pronto para ser servido.`);
  };

  return (
    <div
      className="animate-in fade-in duration-500"
      style={{
        width: "100%",
        minHeight: "100%",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, #18151f 0%, #0e0e0e 50%, #080808 100%)",
      }}
    >
      <div
        style={{ maxWidth: 1100, margin: "0 auto" }}
        className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14"
      >
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 32,
            paddingBottom: 48,
            marginBottom: 56,
            borderBottom: "1px solid rgba(255,255,255,0.055)",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "9px",
                letterSpacing: "5px",
                color: "rgba(255,255,255,0.22)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Gestão de Comandas · Tempo Real
            </p>
            <h1
              style={{
                fontSize: "30px",
                fontWeight: 200,
                letterSpacing: "7px",
                color: "rgba(255,255,255,0.92)",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              Painel da Cozinha
            </h1>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }} className="w-full md:w-auto">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 24px",
                borderRadius: 16,
                background: "rgba(212,168,67,0.05)",
                border: "1px solid rgba(212,168,67,0.12)",
              }}
              className="flex-1 min-w-[150px]"
            >
              <Clock style={{ width: 16, height: 16, color: "rgba(212,168,67,0.5)" }} />
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "8px",
                    letterSpacing: "2.5px",
                    color: "rgba(255,255,255,0.25)",
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  Em Preparo
                </span>
                <span style={{ fontSize: "26px", fontWeight: 200, color: "rgba(212,168,67,0.85)", lineHeight: 1 }}>{preparingTables.length}</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 24px",
                borderRadius: 16,
                background: "rgba(139,92,246,0.05)",
                border: "1px solid rgba(139,92,246,0.15)",
              }}
              className="flex-1 min-w-[150px]"
            >
              <Utensils style={{ width: 16, height: 16, color: "rgba(139,92,246,0.6)" }} />
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "8px",
                    letterSpacing: "2.5px",
                    color: "rgba(255,255,255,0.25)",
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  Mesa sentada
                </span>
                <span style={{ fontSize: "26px", fontWeight: 200, color: "rgba(167,139,250,0.85)", lineHeight: 1 }}>{seatedTables}</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 24px",
                borderRadius: 16,
                background: "rgba(82,199,141,0.05)",
                border: "1px solid rgba(82,199,141,0.12)",
              }}
              className="flex-1 min-w-[150px]"
            >
              <CheckCircle2 style={{ width: 16, height: 16, color: "rgba(82,199,141,0.5)" }} />
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "8px",
                    letterSpacing: "2.5px",
                    color: "rgba(255,255,255,0.25)",
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  Prontos
                </span>
                <span style={{ fontSize: "26px", fontWeight: 200, color: "rgba(82,199,141,0.85)", lineHeight: 1 }}>{readyTables.length}</span>
              </div>
            </div>
          </div>
        </header>

        {visibleTables.length === 0 ? (
          <div
            style={{
              border: "1px dashed rgba(255,255,255,0.06)",
              borderRadius: 24,
              padding: "120px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <Utensils style={{ width: 32, height: 32, color: "rgba(255,255,255,0.08)" }} />
            <p style={{ fontSize: "10px", letterSpacing: "5px", color: "rgba(255,255,255,0.15)", textTransform: "uppercase" }}>
              Sem Comandas Ativas
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              gap: 20,
            }}
          >
            {visibleTables.map((table) => {
              const menuConfig = menus.find((m) => m.name === table.menu);
              return (
                <CozinhaTableCard
                  key={table.id}
                  table={table}
                  onReady={() => handleReady(table.id)}
                  menuMoments={menuConfig?.moments || []}
                  displayTotalMoments={menuConfig?.displayTotalMoments ?? table.totalMoments}
                  menuConfig={menuConfig}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MomentProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1 mt-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: "2px",
            borderRadius: "1px",
            background: i < current ? "linear-gradient(90deg, rgba(212,168,67,1), rgba(212,168,67,0.5))" : "rgba(255,255,255,0.1)",
            transition: "background 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}

function CozinhaTableCard({
  table,
  onReady,
  menuMoments,
  displayTotalMoments,
  menuConfig,
}: {
  table: Table;
  onReady: () => void;
  menuMoments: string[];
  displayTotalMoments: number;
  menuConfig?: Menu;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [ticketOpen, setTicketOpen] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (table.status === "preparing" && table.lastMomentTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - table.lastMomentTime!) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [table.status, table.lastMomentTime]);

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const buildRangeLabel = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i).join("&");
  };

  const getRangeStartingAt = (step: number) => {
    if (!menuConfig?.customGroupingEnabled || !Array.isArray(menuConfig.customGroupingRanges)) return null;
    return menuConfig.customGroupingRanges.find((r) => r.start === step) ?? null;
  };

  const getRangeForStep = (step: number) => {
    if (!menuConfig?.customGroupingEnabled || !Array.isArray(menuConfig.customGroupingRanges)) return null;
    return menuConfig.customGroupingRanges.find((r) => step >= r.start && step <= r.end) ?? null;
  };

  const getMomentDisplay = (moment: number, total: number, displayTotal: number) => {
    if (moment === 0) return "0";
    const customRange = getRangeForStep(moment);
    if (customRange) return buildRangeLabel(customRange.start, customRange.end).replace(/&/g, " & ");
    if (moment > displayTotal) return String(displayTotal);
    return String(moment);
  };

  const currentMomentName = table.currentMoment > 0 ? menuMoments[table.currentMoment - 1] : null;
  const cfg = statusConfig[(table.status as KitchenStatus) ?? "idle"];
  const isUrgent = table.status === "preparing" && elapsed > 900;
  const isFinished = table.status === "finished";
  const restrictionType = table.restrictions.type ? table.restrictions.type.charAt(0).toUpperCase() + table.restrictions.type.slice(1) : "";
  const totalSteps = Math.max(table.totalMoments || 0, menuMoments.length || 0);

  const formatMomentLabel = (moment: number, total: number, displayTotal: number) => {
    const customRange = getRangeForStep(moment);
    if (customRange) return `M${buildRangeLabel(customRange.start, customRange.end)}`;
    if (moment > displayTotal) return `M${displayTotal}`;
    return `M${moment}`;
  };

  const formatLocalHour = (ts: number | null) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div
        style={{
          position: "relative",
        background: isFinished
          ? "linear-gradient(175deg, rgba(122,31,47,0.32) 0%, rgba(79,28,45,0.38) 100%)"
          : "linear-gradient(175deg, #1e1e1e 0%, #181818 100%)",
        border: isFinished
          ? "1px solid rgba(122,31,47,0.68)"
          : isUrgent
          ? "1px solid rgba(212,168,67,0.5)"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: isFinished
          ? "0 24px 56px rgba(0,0,0,0.5), 0 0 0 1px rgba(122,31,47,0.35) inset"
          : isUrgent
          ? "0 24px 56px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,168,67,0.2) inset"
          : "0 24px 56px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset",
        borderRadius: "20px",
        overflow: "hidden",
      }}
        className="flex flex-col transition-all duration-500"
      >
      <button
        type="button"
        onClick={() => setTicketOpen(true)}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 5,
          width: 30,
          height: 30,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(18,18,18,0.75)",
          color: "rgba(255,255,255,0.78)",
          fontSize: 14,
          lineHeight: 1,
          cursor: "pointer",
        }}
        aria-label={`Abrir ticket da mesa ${table.number}`}
        title="Abrir ticket detalhado"
      >
        ⛶
      </button>
      {table.restrictions.type && (
        <div
          style={{
            background: table.restrictions.type === "alergia" ? "rgba(199,50,50,0.10)" : "rgba(212,168,67,0.07)",
            borderBottom: table.restrictions.type === "alergia" ? "1px solid rgba(199,50,50,0.22)" : "1px solid rgba(212,168,67,0.12)",
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 36,
          }}
        >
          <AlertTriangle
            style={{
              width: 11,
              height: 11,
              color: table.restrictions.type === "alergia" ? "rgba(220,70,70,0.9)" : "rgba(212,168,67,0.8)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "9px",
              letterSpacing: "2px",
              lineHeight: 1.4,
              color: table.restrictions.type === "alergia" ? "rgba(220,70,70,0.9)" : "rgba(212,168,67,0.8)",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span style={{ opacity: 0.6, marginRight: 6 }}>{restrictionType}</span>
            {table.restrictions.description}
          </span>
        </div>
      )}

      <div style={{ padding: "28px 28px 22px", borderBottom: isFinished ? "1px solid rgba(122,31,47,0.45)" : "1px solid rgba(255,255,255,0.09)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                border: "1px solid rgba(212,168,67,0.18)",
                background: "rgba(212,168,67,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 200, color: "rgba(212,168,67,1)", letterSpacing: 0 }}>{table.number}</span>
            </div>
            <div className="flex flex-col">
              <span style={{ fontSize: "12px", fontWeight: 400, letterSpacing: "2.5px", color: "rgba(255,255,255,0.95)", textTransform: "uppercase", marginBottom: 4 }}>
                {table.menu}
              </span>
              <span style={{ fontSize: "10px", letterSpacing: "1.5px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
                {table.pairing || "Sem Pairing"} · {table.pax} pax · {table.language}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: cfg.dotColor,
                boxShadow: `0 0 8px ${cfg.dotColor}`,
                display: "inline-block",
                animation: table.status === "preparing" ? "pulse 2s infinite" : "none",
              }}
            />
            <span style={{ fontSize: "9px", letterSpacing: "2px", color: cfg.textColor, textTransform: "uppercase" }}>{cfg.label}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px", flex: 1 }}>
        <div style={{ marginBottom: 20 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <span style={{ fontSize: "9px", letterSpacing: "3px", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>
              Momento atual
            </span>
            <span
              style={{
                fontSize: "9px",
                letterSpacing: "2px",
                color: "rgba(212,168,67,0.9)",
                textTransform: "uppercase",
                background: "rgba(212,168,67,0.1)",
                border: "1px solid rgba(212,168,67,0.22)",
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              {getMomentDisplay(table.currentMoment, table.totalMoments, displayTotalMoments)} / {displayTotalMoments}
            </span>
          </div>

          <p
            style={{
              fontSize: "18px",
              fontWeight: 300,
              letterSpacing: "1px",
              color: isFinished ? "rgba(247,226,238,1)" : "rgba(255,255,255,1)",
              textAlign: "center",
              padding: "12px 0",
            }}
          >
            {isFinished ? "Mesa finalizada" : currentMomentName || (table.status === "idle" && table.menu ? "Aguardando Início" : "—")}
          </p>

          <MomentProgress current={table.currentMoment} total={table.totalMoments} />
        </div>

        {table.status === "preparing" && (
          <div className="flex items-center justify-center gap-2" style={{ marginTop: 8 }}>
            <Clock style={{ width: 12, height: 12, color: isUrgent ? "#d4a843" : "rgba(255,255,255,0.35)" }} />
            <span
              style={{
                fontSize: "12px",
                letterSpacing: "3px",
                color: isUrgent ? "rgba(212,168,67,1)" : "rgba(255,255,255,0.35)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatElapsed(elapsed)}
            </span>
          </div>
        )}

        {table.status === "paused" && (
          <div
            style={{
              background: "rgba(199,82,82,0.06)",
              border: "1px solid rgba(199,82,82,0.12)",
              borderRadius: 12,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <AlertCircle style={{ width: 13, height: 13, color: "rgba(199,82,82,0.7)" }} />
            <span style={{ fontSize: "9px", letterSpacing: "2px", color: "rgba(199,82,82,0.7)", textTransform: "uppercase" }}>
              Serviço Pausado pela Sala
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: "0 28px 28px" }}>
        <button
          disabled={table.status !== "preparing"}
          onClick={onReady}
          data-testid={`button-ready-${table.id}`}
          style={
            table.status === "preparing"
              ? {
                  width: "100%",
                  height: 52,
                  borderRadius: 12,
                  background: "rgba(212,168,67,0.08)",
                  border: "1px solid rgba(212,168,67,0.25)",
                  color: "rgba(212,168,67,0.9)",
                  fontSize: "10px",
                  letterSpacing: "3.5px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }
              : table.status === "finished"
              ? {
                  width: "100%",
                  height: 52,
                  borderRadius: 12,
                  background: "rgba(122,31,47,0.24)",
                  border: "1px solid rgba(122,31,47,0.6)",
                  color: "rgba(247,226,238,1)",
                  fontSize: "10px",
                  letterSpacing: "3.5px",
                  textTransform: "uppercase",
                  cursor: "default",
                }
              : table.status === "ready"
              ? {
                  width: "100%",
                  height: 52,
                  borderRadius: 12,
                  background: "rgba(82,199,141,0.06)",
                  border: "1px solid rgba(82,199,141,0.15)",
                  color: "rgba(82,199,141,0.7)",
                  fontSize: "10px",
                  letterSpacing: "3.5px",
                  textTransform: "uppercase",
                  cursor: "default",
                }
              : {
                  width: "100%",
                  height: 52,
                  borderRadius: 12,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.18)",
                  fontSize: "10px",
                  letterSpacing: "3.5px",
                  textTransform: "uppercase",
                  cursor: "not-allowed",
                }
          }
        >
          {table.status === "finished" ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <CheckCircle2 style={{ width: 14, height: 14 }} />
              Finalizado
            </span>
          ) : table.status === "ready" ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <CheckCircle2 style={{ width: 14, height: 14 }} />
              Pronto para Servir
            </span>
          ) : table.status === "preparing" ? (
            "Confirmar Serviço"
          ) : (
            "Aguardando"
          )}
        </button>
      </div>
      </div>

      {ticketOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setTicketOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "92vh",
              overflowY: "auto",
              background: "linear-gradient(180deg, #111215 0%, #0d0e10 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 18,
              boxShadow: "0 28px 64px rgba(0,0,0,0.65)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(table.restrictions.type || table.restrictions.description) && (
              <div
                style={{
                  background: table.restrictions.type === "alergia" ? "#8f0000" : "#3b2a00",
                  color: "rgba(255,255,255,0.95)",
                  borderTopLeftRadius: 18,
                  borderTopRightRadius: 18,
                  padding: "12px 18px",
                  fontSize: 12,
                  letterSpacing: "1.8px",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  ⚠ {table.restrictions.type === "alergia" ? "Alergia" : "Restrição"} {table.restrictions.description ? `· ${table.restrictions.description}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setTicketOpen(false)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.28)",
                    background: "transparent",
                    color: "inherit",
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  aria-label="Fechar ticket"
                >
                  ×
                </button>
              </div>
            )}

            {!table.restrictions.type && !table.restrictions.description && (
              <div style={{ display: "flex", justifyContent: "flex-end", padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <button
                  type="button"
                  onClick={() => setTicketOpen(false)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.22)",
                    background: "transparent",
                    color: "rgba(255,255,255,0.8)",
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  aria-label="Fechar ticket"
                >
                  ×
                </button>
              </div>
            )}

            <div style={{ padding: "22px 20px 24px" }}>
              <h3 style={{ margin: 0, fontSize: 42, fontWeight: 700, letterSpacing: "1px", color: "rgba(255,255,255,0.95)" }}>
                Mesa {table.number} · {table.pax ?? "-"} Pax
              </h3>
              <p style={{ margin: "6px 0 20px", fontSize: 17, color: "rgba(255,255,255,0.72)" }}>
                {table.menu} · Pairing {table.pairing || "Sem Pairing"}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(() => {
                  const rows: JSX.Element[] = [];
                  let momentNumber = 1;
                  while (momentNumber <= totalSteps) {
                    const range = getRangeStartingAt(momentNumber);
                    const rangeStart = range?.start ?? momentNumber;
                    const rangeEnd = Math.min(range?.end ?? momentNumber, totalSteps);
                    const numbers = Array.from({ length: rangeEnd - rangeStart + 1 }, (_, i) => rangeStart + i);
                    const logsInRange = numbers
                      .map((n) => table.momentsHistory.find((h) => h.momentNumber === n))
                      .filter(Boolean);
                    const done = numbers.every((n) => {
                      const log = table.momentsHistory.find((h) => h.momentNumber === n);
                      return Boolean(log?.readyTime);
                    });
                    const currentInRange = numbers.includes(table.currentMoment) && table.status === "preparing";
                    const latestReadyTime = logsInRange
                      .map((l) => l?.readyTime ?? 0)
                      .reduce((max, value) => (value > max ? value : max), 0);
                    const momentName = range
                      ? numbers.map((n) => menuMoments[n - 1] || `Momento ${n}`).join(" · ")
                      : menuMoments[momentNumber - 1] || `Momento ${momentNumber}`;
                    rows.push(
                      <div key={`${table.id}-ticket-step-${rangeStart}-${rangeEnd}`} style={{ padding: "8px 0 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              color: done ? "rgba(185,255,217,0.95)" : "rgba(255,255,255,0.9)",
                              fontSize: 15,
                              textDecoration: done ? "line-through" : "none",
                              opacity: done ? 0.8 : 1,
                            }}
                          >
                            <span style={{ width: 18, textAlign: "center" }}>{done ? "✓" : "☐"}</span>
                            <span>
                              {range ? `M${buildRangeLabel(rangeStart, rangeEnd)}` : formatMomentLabel(momentNumber, totalSteps, displayTotalMoments)} - {momentName}
                            </span>
                          </div>
                          <span style={{ fontSize: 14, color: done ? "rgba(82,199,141,0.95)" : "rgba(255,255,255,0.45)", minWidth: 50, textAlign: "right" }}>
                            {done
                              ? formatLocalHour(latestReadyTime || null)
                              : currentInRange
                              ? "Em preparo"
                              : "Aguardando"}
                          </span>
                        </div>
                      </div>,
                    );
                    momentNumber = range ? rangeEnd + 1 : momentNumber + 1;
                  }
                  return rows;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
