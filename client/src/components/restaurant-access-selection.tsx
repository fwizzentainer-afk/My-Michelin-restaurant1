import { ChefHat, Settings2, UtensilsCrossed } from "lucide-react";

const logoUrl = "https://www.figma.com/api/mcp/asset/1d545679-47b3-4fb1-97ca-c24b16b31109";

type AccessRole = "sala" | "cozinha" | "admin";

interface RestaurantAccessSelectionProps {
  onSelectRole?: (role: AccessRole) => void;
}

export default function RestaurantAccessSelection({
  onSelectRole,
}: RestaurantAccessSelectionProps) {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#0e0e0e]">
      <div className="mx-auto flex min-h-screen w-full max-w-[411.64px] flex-col items-center justify-between px-0 py-0">
        <div className="mt-0 flex h-[84px] w-1 flex-col items-center gap-2">
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-[#3a3a3a] to-transparent" />
          <div className="h-1 w-1 rounded-full bg-[#3a3a3a]" />
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-[#3a3a3a] to-transparent" />
        </div>

        <div className="mt-0 flex w-full flex-col items-center gap-3">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-16 w-16 object-contain opacity-90"
          />
          <p className="text-center text-[11px] font-normal uppercase tracking-[5px] text-[#5a5a5a]">
            Bem-vindo
          </p>
          <h1 className="text-center text-[28px] font-light uppercase tracking-[3px] text-[#ececec]">
            My Michelin Restaurant
          </h1>
          <div className="h-px w-10 bg-gradient-to-b from-transparent via-[#4a4a4a] to-transparent" />
          <p className="text-center text-xs font-normal uppercase tracking-[2px] text-[#4a4a4a]">
            Selecione o acesso
          </p>
        </div>

        <div className="mt-4 flex w-[300px] flex-col gap-4">
          <button
            type="button"
            onClick={() => onSelectRole?.("sala")}
            className="h-[58.5px] rounded-md border border-[#272727] text-[#c8c8c8] transition hover:border-[#3a3a3a]"
          >
            <span className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[4px]">
              <UtensilsCrossed className="h-[14px] w-[14px]" />
              Sala
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectRole?.("cozinha")}
            className="h-[58.5px] rounded-md border border-[#272727] text-[#c8c8c8] transition hover:border-[#3a3a3a]"
          >
            <span className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[4px]">
              <ChefHat className="h-[14px] w-[14px]" />
              Cozinha
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectRole?.("admin")}
            className="h-[57px] rounded-md border border-[#1e1e1e] text-[#686868] transition hover:border-[#343434]"
          >
            <span className="flex items-center justify-center gap-3 text-[10px] font-medium uppercase tracking-[3px]">
              <Settings2 className="h-3 w-3" />
              Admin
            </span>
          </button>
        </div>

        <p className="mb-8 mt-8 text-center text-[9px] uppercase tracking-[3px] text-[#2e2e2e]">
          Created by <span className="text-[#3a3a3a]">Felipe Wizzentainer</span>
        </p>

        <div className="mb-0 flex h-[84px] w-1 flex-col items-center gap-2">
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-[#3a3a3a] to-transparent" />
          <div className="h-1 w-1 rounded-full bg-[#3a3a3a]" />
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-[#3a3a3a] to-transparent" />
        </div>
      </div>
    </section>
  );
}
