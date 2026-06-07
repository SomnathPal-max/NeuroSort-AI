import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Colors & Theme Layer
code = code
  .replace(/bg-\[#0A0C10\]/g, 'bg-slate-950')
  .replace(/bg-\[#111827\]/g, 'bg-slate-900')
  .replace(/border-\[#1F2937\]/g, 'border-slate-800/80')
  .replace(/border-\[#374151\]/g, 'border-slate-700')
  .replace(/bg-\[#1F2937\]/g, 'bg-slate-800')
  .replace(/hover:bg-\[#374151\]/g, 'hover:bg-slate-700')
  .replace(/text-\[#9CA3AF\]/g, 'text-slate-400')
  .replace(/text-\[#E0E6ED\]/g, 'text-slate-200')
  .replace(/text-\[#6B7280\]/g, 'text-slate-500')
  .replace(/text-\[#E5E7EB\]/g, 'text-slate-200')
  .replace(/bg-\[#10B981\]/g, 'bg-indigo-500')
  .replace(/text-\[#10B981\]/g, 'text-indigo-400')
  .replace(/border-\[#10B981\]/g, 'border-indigo-500')
  .replace(/accent-\[#10B981\]/g, 'accent-indigo-500')
  .replace(/ring-\[#10B981\]/g, 'ring-indigo-500')
  .replace(/#10B981/g, '#6366f1')

// Adjusting sizes and making it look "big and creative"
code = code
  .replace(/font-mono/g, 'font-sans')
  
  // Enlarge all tiny texts
  .replace(/text-\[10px\]/g, 'text-sm')
  .replace(/text-\[11px\]/g, 'text-base')
  .replace(/text-\[9px\]/g, 'text-xs uppercase tracking-wider font-semibold')
  .replace(/text-xs font-bold/g, 'text-sm font-semibold tracking-wide')
  
  // Softer roundings
  .replace(/rounded-lg/g, 'rounded-2xl')
  .replace(/rounded /g, 'rounded-xl ')

  // Spacing bumps
  .replace(/p-3/g, 'p-6')
  .replace(/gap-2/g, 'gap-4')
  .replace(/mb-2/g, 'mb-4')

// Taller UI buttons and elements
  .replace(/py-1.5/g, 'py-2.5')
  .replace(/px-1.5/g, 'px-3')
  .replace(/px-2/g, 'px-4')
  
fs.writeFileSync('src/App.tsx', code);
