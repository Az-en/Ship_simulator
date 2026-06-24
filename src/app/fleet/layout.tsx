import TopBar from "@/components/topBar";
import Sidebar from "@/components/Sidebar";
export default function FleetLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen w-full bg-gray-950 text-slate-100 overflow-hidden">
      {/* 1. Global Navigation on Top */}
      <TopBar />

      <div className="flex flex-row flex-1 w-full overflow-hidden">
        <main className="flex-1 h-full relative overflow-hidden bg-gray-900">
          {children}
        </main>

        <Sidebar />
      </div>
    </div>
  );
}
