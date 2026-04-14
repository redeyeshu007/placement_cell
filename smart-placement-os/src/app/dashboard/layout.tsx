import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
