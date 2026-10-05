// layout.tsx
import TopBar from "@/components/topBar";
import Sidebar from "@/components/Sidebar";
import AlertsPanel from "@/components/alerts-panel";

export default function FleetLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen w-full bg-gray-950 text-slate-100 overflow-hidden">
      <TopBar />

      <div className="flex flex-row flex-1 w-full overflow-hidden">
        {/* Main section now uses flex-col */}
        <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-gray-900">
          {/* Map canvas flexes to fill available space */}
          <div className="flex-1 w-full relative overflow-hidden">
            {children}
          </div>

          {/* Bottom Alerts Panel */}
          <div className="shrink-0 z-10 border-t border-slate-800 bg-gray-950">
            <AlertsPanel />
          </div>
        </main>

        <Sidebar />
      </div>
    </div>
  );
}