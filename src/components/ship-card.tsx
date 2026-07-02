import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Gauge, Compass, MoveRight, Navigation } from "lucide-react";
import { ShipConfig, Status } from "@/types/ship";
import { useFleetStore } from "@/stores/fleetStore";
interface ShipCardProps {
  data: ShipConfig;
}

// 1. Separate bg and text into an object structure to completely avoid .split()
const STATUS_STYLES: Record<
  Status,
  { bg: string; text: string; animate?: string }
> = {
  [Status.NORMAL]: { bg: "bg-green-500", text: "text-green-400" },
  [Status.REROUTING]: { bg: "bg-blue-500", text: "text-blue-400" },
  [Status.DISTRESSED]: {
    bg: "bg-red-500",
    text: "text-red-400",
    animate: "animate-pulse",
  },
  [Status.STOPPED]: { bg: "bg-amber-500", text: "text-amber-400" },
  [Status.ARRIVED]: { bg: "bg-purple-500", text: "text-purple-400" },
};

export default function ShipCard({ data }: ShipCardProps) {
  const selectedShipId = useFleetStore((state) => state.selectedShipId);
  const setSelectedShipId = useFleetStore((state) => state.setSelectedShipId);

  // 2. Check if THIS specific card is the selected one
  const isSelected = selectedShipId === data.shipId;
  const currentStatus = data.status ?? Status.NORMAL;
  const rawStatus = (data.status ?? "NORMAL").toUpperCase();

  const styles = STATUS_STYLES[currentStatus] || STATUS_STYLES[Status.NORMAL];
  const isDistressed = currentStatus === Status.DISTRESSED;

  return (
    <Card
      onClick={() => setSelectedShipId(data.shipId)}
      className={`cursor-pointer transition-all border shadow-sm hover:shadow-md active:scale-[0.99] 
        ${
          isSelected
            ? "bg-gray-800/90 border-blue-500 ring-1 ring-blue-500"
            : "bg-gray-900/70 border-transparent"
        }
      `}
    >
      <CardContent className="p-2 space-y-3">
        {/* Row 1: Name and Status */}
        <div className="flex justify-between items-start">
          <div className="text-lg font-semibold text-white tracking-tight">
            {data.name}
          </div>
          <div
            className={`flex items-center gap-1.5 text-xs font-medium tracking-wider ${styles.text}`}
          >
            <Navigation
              className={`w-3 h-3 rotate-45 fill-current ${isDistressed ? "animate-bounce" : ""}`}
            />
            <span className="text-sm font-bold uppercase tracking-wide">
              {currentStatus}
            </span>
          </div>
        </div>

        {/* Row 2: Stats */}
        <div className="flex justify-between items-center text-sm text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Gauge className="w-4 h-4 text-slate-500" />
              {data.speed} kn
            </span>
            <span className="flex items-center gap-1">
              <Compass className="w-4 h-4 text-slate-500" />
              {data.heading}°
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <MoveRight className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-300">
              {data.destination}
            </span>
          </div>
        </div>

        {/* Row 3: Fuel/Progress */}
        <div className="space-y-1 pt-1">
          <Progress
            value={data.fuel}
            className={`h-1 bg-slate-100/10 [&>div]:bg-white`}
          />
          <div className="text-right text-xs font-semibold text-slate-500">
            {data.fuel}% Fuel
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
