"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export function SkillTagEditor({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (updated: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (!skills.some((s) => s.toLowerCase() === v.toLowerCase())) {
      onChange([...skills, v]);
    }
    setInput("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Add a skill…"
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0f3b9c]/30 focus:border-[#0f3b9c]"
        />
        <button
          onClick={add}
          className="px-3 py-2 rounded-lg bg-[#0f3b9c] text-white hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {skills.map((skill) => (
          <span
            key={skill}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0f3b9c]/10 text-[#0f3b9c] text-xs font-semibold border border-[#0f3b9c]/20"
          >
            {skill}
            <button
              onClick={() => onChange(skills.filter((s) => s !== skill))}
              className="text-[#0f3b9c]/50 hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {skills.length === 0 && (
          <span className="text-xs text-slate-400 italic">No skills added yet</span>
        )}
      </div>
    </div>
  );
}
