import ShipCard from "@/components/ship-card";
import { useFleetStore } from "@/stores/fleetStore";
export default function FleetPanel() {
  // Extract data from fleet store
  const ships = useFleetStore((state) => state.fleetUpdates);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold">Fleet Status ({ships.length})</h2>
      <div className="grid grid-cols-1   gap-4">
        {ships.map((ship) => (
          <ShipCard key={ship.shipId} data={ship} />
        ))}
      </div>
    </div>
  );
}
