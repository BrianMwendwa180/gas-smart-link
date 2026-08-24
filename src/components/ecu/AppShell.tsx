import { Link } from "@tanstack/react-router";
import {
  Activity,
  Fuel,
  Gauge as GaugeIcon,
  Grid3x3,
  Plug,
  ScrollText,
  Sliders,
  Unplug,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEcu } from "@/lib/ecu/store";

const NAV = [
  { to: "/", label: "Dashboard", icon: GaugeIcon },
  { to: "/configuration", label: "Configuration", icon: Sliders },
  { to: "/maps", label: "Map editor", icon: Grid3x3 },
  { to: "/diagnostics", label: "Diagnostics", icon: Activity },
  { to: "/logging", label: "Data logging", icon: ScrollText },
] as const;

function StatusPill() {
  const { status, config } = useEcu();
  const map = {
    connected: { text: "Link active", dot: "bg-gas", ring: "text-gas" },
    connecting: { text: "Handshaking", dot: "bg-warn animate-pulse", ring: "text-warn" },
    disconnected: { text: "No link", dot: "bg-muted-foreground", ring: "text-muted-foreground" },
    error: { text: "Link error", dot: "bg-destructive", ring: "text-destructive" },
  }[status];

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-panel-raised px-3 py-1.5">
      <span className={cn("size-2 rounded-full", map.dot)} />
      <span className={cn("readout text-xs", map.ring)}>{map.text}</span>
      <span className="readout text-[10px] text-muted-foreground">
        {config.port} · {config.baudRate}
      </span>
    </div>
  );
}

function FuelSwitch() {
  const { mode, requestMode, status } = useEcu();
  const disabled = status !== "connected";
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-panel-raised p-1">
      <Button
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => requestMode("petrol")}
        className={cn(
          "h-7 rounded-full px-3 text-xs",
          mode === "petrol" && "bg-petrol text-petrol-foreground hover:bg-petrol",
        )}
      >
        Petrol
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => requestMode("gas")}
        className={cn(
          "h-7 rounded-full px-3 text-xs",
          mode === "gas" && "bg-gas text-gas-foreground hover:bg-gas",
        )}
      >
        Gas
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { status, connect, disconnect, dirty } = useEcu();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-panel md:flex">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <div className="grid size-8 place-items-center rounded-md bg-gas text-gas-foreground">
            <Fuel className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">GoFast Suite</p>
            <p className="readout text-[10px] text-muted-foreground">STAG-class LPG / CNG</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{
                className: "bg-panel-raised text-foreground border-l-gas",
              }}
              inactiveProps={{ className: "text-muted-foreground border-l-transparent" }}
              className="flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm transition-colors hover:bg-panel-raised hover:text-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <p className="label-caps mb-2">Interface</p>
          <Button
            variant={status === "connected" ? "outline" : "default"}
            className="w-full"
            onClick={status === "connected" ? disconnect : connect}
            disabled={status === "connecting"}
          >
            {status === "connected" ? (
              <>
                <Unplug className="size-4" /> Disconnect
              </>
            ) : (
              <>
                <Plug className="size-4" /> Connect ECU
              </>
            )}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-background/85 px-5 py-3 backdrop-blur">
          <div className="mr-auto flex items-center gap-3">
            <span className="readout text-xs text-muted-foreground">
              FW 0.275.12607 · Easy 200
            </span>
            {dirty && (
              <span className="rounded-sm bg-warn/15 px-2 py-0.5 readout text-[10px] text-warn">
                UNSAVED CHANGES
              </span>
            )}
          </div>
          <FuelSwitch />
          <StatusPill />
        </header>
        <main className="flex-1 px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
