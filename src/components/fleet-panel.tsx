import ShipCard from "@/components/ship-card";
import { useFleetStore } from "@/stores/fleetStore";
import { useRoleStore } from "@/stores/role";

export default function FleetPanel() {
  const ships = useFleetStore((state) => state.fleetUpdates);
  const role = useRoleStore((state) => state.role);
  const captainShipId = useRoleStore((state) => state.captainShipId);

  const displayedShips =
    role === "CAPTAIN"
      ? ships.filter((ship) => ship.shipId === captainShipId)
      : ships;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 gap-4">
        {displayedShips.map((ship) => (
          <ShipCard key={ship.shipId} data={ship} />
        ))}
        {role === "CAPTAIN" && displayedShips.length === 0 && (
          <div className="text-xs text-slate-500 text-center font-mono">
            Vessel {captainShipId} offline or not found.
          </div>
        )}
      </div>
    </div>
  );
}
