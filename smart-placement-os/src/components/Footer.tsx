"use client";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          <div className="flex items-center gap-4">
            <img 
              src="/psna-logo.png" 
              alt="PSNA Logo" 
              className="h-10 w-auto object-contain transition-all opacity-90" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }} 
            />
            <div className="flex flex-col">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mb-1">
                Official Placement Portal © {new Date().getFullYear()}
              </p>
              <p className="text-sm text-[#0f3b9c] font-black uppercase tracking-[0.05em]">
                PSNA COLLEGE OF ENGINEERING AND TECHNOLOGY
              </p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
