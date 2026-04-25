"use client";

import { motion } from "framer-motion";
import { 
  ArrowUpRight, 
  Target, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  Award,
  Users,
  Building2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-8 md:py-12">
        <div className="flex flex-col items-center text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8 flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f3b9c]/10 text-[#0f3b9c] text-xs font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-[#0f3b9c] animate-pulse" />
              Empowering Careers Since 1984
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight max-w-4xl">
              Bridging Ambition <br />
              <span className="text-[#0f3b9c]">With Opportunity</span>
            </h1>
            
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
              Unlock your career potential with PSNA's AI-Powered Placement Portal. Smart matching, live tracking, and advanced skill analytics designed for the Class of 2026.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth/login" className="px-10 py-4 rounded-xl bg-[#0f3b9c] text-white font-bold text-sm shadow-lg shadow-[#0f3b9c]/20 hover:bg-[#0c2a70] transition-all flex items-center justify-center gap-2 group">
                Student Access
                <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              </Link>
              <Link href="#features" className="px-10 py-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all text-center">
                Explore Platform
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Background glow elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0f3b9c]/5 rounded-full blur-[120px] -z-0" />
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatItem value="150+" label="Hiring Partners" icon={<Building2 />} />
        <StatItem value="8.5 LPA" label="Avg Package" icon={<Award />} />
        <StatItem value="94%" label="Placement Rate" icon={<Target />} />
        <StatItem value="5,000+" label="Students Tracked" icon={<Users />} />
      </section>

      {/* Features Grid */}
      <section id="features" className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-slate-900">Advanced Placement Ecosystem</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Everything you need to navigate the recruitment season with data-driven insights and professional tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Smart Matching" 
            desc="Our proprietary algorithm matches your skill quotient with company requirements in real-time."
            icon={<Zap className="text-amber-500" />}
          />
          <FeatureCard 
            title="PRS Tracking" 
            desc="Monitor your Placement Readiness Score and get actionable insights to improve your profile."
            icon={<BarChart3 className="text-blue-500" />}
          />
          <FeatureCard 
            title="Career Portfolio" 
            desc="Showcase your Github projects, certifications, and academic excellence in one unified view."
            icon={<ShieldCheck className="text-emerald-500" />}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative rounded-3xl bg-[#0f3b9c] p-12 overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Ready to secure your future?
          </h2>
          <p className="text-[#e0e7ff] max-w-xl">
            Join thousands of PSNA students already using our portal to kickstart their professional careers.
          </p>
          <div className="flex gap-4">
            <Link href="/auth/login" className="px-10 py-4 bg-white text-[#0f3b9c] font-extrabold rounded-xl hover:bg-slate-50 transition-colors shadow-xl">
              Log In Now
            </Link>
          </div>
        </div>
        
        {/* Decorative circle */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 border border-white/10 rounded-full" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </section>
    </div>
  );
}

function StatItem({ value, label, icon }: { value: string, label: string, icon: React.ReactNode }) {
  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-100 flex flex-col items-center text-center group hover:border-[#0f3b9c]/30 transition-colors">
      <div className="p-3 rounded-full bg-slate-50 text-[#0f3b9c] mb-4 group-hover:bg-[#0f3b9c]/10 transition-colors">
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="p-10 bg-white rounded-[2rem] border border-slate-200 hover:shadow-xl transition-all group">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm">
        {desc}
      </p>
      <button className="mt-8 flex items-center gap-2 text-xs font-bold text-[#0f3b9c] uppercase tracking-widest hover:gap-3 transition-all">
        Learn More <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
