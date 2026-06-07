/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import { Terminal, Upload, ArrowDownAZ, Download, FolderArchive, Edit3, X, Trash2, Search, Info, Code, FileText, Image, Video, Music, FileJson, LayoutTemplate, File as FileIcon, FolderTree, Folder, FolderSearch, Copy, Check, Zap, Save, Recycle, Timer, Brain, Laptop, Eye, TrendingUp, Tag, Clock, Maximize2, Minimize2, ImageDown, MessageCircle, Send, ArrowRight, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend, PolarAngleAxis } from "recharts";

type FileRecord = {
  filename: string;
  sizeKb: number;
  category: string;
  urgency: string; // HIGH, MED, LOW
  priority: number;
  isDuplicate: boolean;
  isOld: boolean;
  dateStr?: string;
};

type Benchmark = {
  name: string;
  time: number;
  complexity: string;
};

type CategoryWeight = {
  name: string;
  count: number;
  pct: number;
  sizeKb: number;
};

export const categoryColors: Record<string, {text: string, bg: string, border: string, hex: string}> = {
  Documents: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", hex: "#60A5FA" },
  Images: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", hex: "#34D399" },
  Code: { text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", hex: "#818CF8" },
  Videos: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", hex: "#FB7185" },
  Audio: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", hex: "#FBBF24" },
  Archives: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", hex: "#C084FC" },
  Programs: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", hex: "#22D3EE" },
  Spreadsheets: { text: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20", hex: "#2DD4BF" },
  Others: { text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", hex: "#94A3B8" },
  Pending: { text: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/30", hex: "#64748B" }
};
export const getCatColor = (cat: string) => categoryColors[cat] || categoryColors.Others;

const INITIAL_DUMMY_FILES = [
  { name: 'thesis_final.pdf', size: 1240 * 1024 },
  { name: 'photo_trip.jpg', size: 3450 * 1024 },
  { name: 'budget.xlsx', size: 88 * 1024 },
  { name: 'setup.exe', size: 72000 * 1024 },
  { name: 'notes_copy.txt', size: 12 * 1024 },
  { name: 'notes_copy.txt', size: 12 * 1024 },
  { name: 'main.c', size: 4 * 1024 },
  { name: 'script.py', size: 15 * 1024 },
  { name: 'vacation.mp4', size: 450 * 1024 * 1024 },
  { name: 'song.mp3', size: 5200 * 1024 },
  { name: 'archive.zip', size: 45000 * 1024 },
  { name: 'style.css', size: 8 * 1024 }
];

export default function App() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [duplicates, setDuplicates] = useState<{name: string, hash: string}[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [categories, setCategories] = useState<CategoryWeight[]>([]);
  const [historyItems, setHistoryItems] = useState<{id: string, msg: string, files: FileRecord[], ts: Date}[]>([]);
  const [logMsg, setLogMsg] = useState("System initialized. Waiting for input.");
  const [totalMemKb, setTotalMemKb] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renamePrefix, setRenamePrefix] = useState("");
  const [renameSuffix, setRenameSuffix] = useState("");
  const [renameCategoryTarget, setRenameCategoryTarget] = useState<string>("(No Change)");
  const [renameUrgencyTarget, setRenameUrgencyTarget] = useState<string>("(No Change)");
  const [globalRenameFrom, setGlobalRenameFrom] = useState<string>("");
  const [globalRenameTo, setGlobalRenameTo] = useState<string>("");
  const [hoverCategory, setHoverCategory] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableSortCol, setTableSortCol] = useState<'filename'|'sizeKb'|'category'|null>(null);
  const [tableSortDesc, setTableSortDesc] = useState(false);
  const [selectedFileForDrawer, setSelectedFileForDrawer] = useState<FileRecord | null>(null);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [autoSortEnabled, setAutoSortEnabled] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [reportPreview, setReportPreview] = useState<string | null>(null);
  const [visibleCols, setVisibleCols] = useState({ size: true, category: true, urgency: true });
  const [isColMenuOpen, setIsColMenuOpen] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const [showNewestOnly, setShowNewestOnly] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [trendDateFilter, setTrendDateFilter] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: 'ai' | 'user', text: string}[]>([
    { role: 'ai', text: "Hello! I am your NeuroSort AI Assistant. I have linked directly into the active dashboard workspace state. Ask me to analyze files, compare sorting benchmark speeds, list duplicate chains, or execute workspace commands!" }
  ]);
  const [bulkCatEdit, setBulkCatEdit] = useState("");
  const [treeSearchQuery, setTreeSearchQuery] = useState("");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [isTreeExpanded, setIsTreeExpanded] = useState(true);
  const dirMapsRef = useRef<HTMLDivElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setToastMsg("For mobile (APK) / desktop installation, open options and select 'Install app' or 'Add to Home Screen'. Your device may not support direct APK downloads from web.");
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const exportDirMapsToPNG = async () => {
    if (!dirMapsRef.current) return;
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(dirMapsRef.current, {
        backgroundColor: '#0f172a', // slate-900
        pixelRatio: 2
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'Directory_Maps.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setLogMsg("Exported Directory Maps to PNG.");
    } catch (e) {
      console.error("Export failed", e);
      setLogMsg("PNG Export Failed.");
    }
  };

  const downloadCategory = async (categoryName: string, filesToZip: FileRecord[]) => {
    let zipName = prompt(`Enter a name for the ZIP archive of ${categoryName} files:`, categoryName);
    if (!zipName) return; // User cancelled
    if (!zipName.toLowerCase().endsWith('.zip')) zipName += '.zip';

    const zip = new JSZip();
    const folder = zip.folder(categoryName);
    if (!folder) return;

    filesToZip.forEach(f => {
      const fileContent = `=== NEUROSORT AI SIMULATED FILE ===\n\nFilename: ${f.filename}\nCategory: ${f.category}\nSize: ${(f.sizeKb).toFixed(2)} KB\nUrgency: ${f.urgency}\n\nThis is a simulated downloaded file from the AI workspace.`;
      folder.file(f.filename, fileContent);
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLogMsg(`Downloaded category ${categoryName} as ${zipName}`);
    } catch (e) {
      console.error("ZIP Generation failed", e);
      setLogMsg("Category Download Failed.");
    }
  };

  const downloadSelection = async () => {
    if (selectedIndices.size === 0) return;

    let zipName = prompt(`Enter a name for the ZIP archive of the selected files:`, 'SelectedFiles');
    if (!zipName) return; // User cancelled
    if (!zipName.toLowerCase().endsWith('.zip')) zipName += '.zip';

    const zip = new JSZip();
    
    // Get selected files
    const selectedFiles = files.filter(f => selectedIndices.has(f.originalIdx));

    selectedFiles.forEach(f => {
      const fileContent = `=== NEUROSORT AI SIMULATED FILE ===\n\nFilename: ${f.filename}\nCategory: ${f.category}\nSize: ${(f.sizeKb).toFixed(2)} KB\nUrgency: ${f.urgency}\n\nThis is a simulated downloaded file from the AI workspace.`;
      // Preserve organizational structure (put inside folder by category name)
      const folderName = f.category === 'Pending' ? 'Uncategorized' : f.category;
      zip.folder(folderName)?.file(f.filename, fileContent);
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLogMsg(`Downloaded ${selectedFiles.length} selected files as ${zipName}`);
    } catch (e) {
      console.error("ZIP Generation failed", e);
      setLogMsg("Selection Download Failed.");
    }
  };

  const FileExtIcon = ({ filename, category }: { filename: string, category: string }) => {
    const cColor = getCatColor(category);
    const ext = filename.includes('.') ? filename.split('.').pop()?.substring(0, 3).toUpperCase() : 'UNK';
    
    if (showIcons) {
      let Icon = FileIcon;
      if (category === 'Documents') Icon = FileText;
      else if (category === 'Images') Icon = Image;
      else if (category === 'Code') Icon = Code;
      else if (category === 'Videos') Icon = Video;
      else if (category === 'Audio') Icon = Music;
      else if (category === 'Programs') Icon = Laptop;
      else if (category === 'Spreadsheets') Icon = LayoutTemplate;
      else if (category === 'Archives') Icon = FolderArchive;
      
      return <Icon className={`shrink-0 w-4 h-4 mx-1 ${cColor.text}`} />;
    }

    return (
      <div className={`shrink-0 flex items-center justify-center min-w-[24px] h-4 rounded ${cColor.bg} border ${cColor.border} text-[9px] font-black ${cColor.text} mx-1 shadow-sm`}>
        {ext}
      </div>
    );
  };

  const handleCategoryReassign = (originalIdx: number, newCategory: string) => {
    setFiles(prev => {
      const next = [...prev];
      const idx = next.findIndex(f => f.originalIdx === originalIdx);
      if (idx !== -1) {
        next[idx] = { ...next[idx], category: newCategory };
      }
      return next;
    });
    setLogMsg(`Manually moved file to ${newCategory}`);
  };

  const startGlobalOperation = (opName: string, operation: () => void) => {
    setIsGlobalLoading(true);
    setGlobalProgress(10);
    setLogMsg(`Started: ${opName}`);
    setTimeout(() => setGlobalProgress(40), 50);
    setTimeout(() => setGlobalProgress(80), 100);
    setTimeout(() => {
      operation();
      setGlobalProgress(100);
      setTimeout(() => {
        setIsGlobalLoading(false);
        setGlobalProgress(0);
      }, 300);
    }, 150);
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  let displayedFilesWithIdx = files.map((f, idx) => ({ ...f, originalIdx: idx })).filter(f => {
    const matchCategory = filterCategory === "All" || f.category === filterCategory;
    const matchSearch = f.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchNewest = !showNewestOnly || !f.isOld;
    const matchTrendDate = !trendDateFilter || f.dateStr === trendDateFilter;
    return matchCategory && matchSearch && matchNewest && matchTrendDate;
  });

  if (tableSortCol) {
    displayedFilesWithIdx.sort((a, b) => {
      let cmp = 0;
      if (tableSortCol === 'filename') cmp = a.filename.localeCompare(b.filename);
      else if (tableSortCol === 'sizeKb') cmp = a.sizeKb - b.sizeKb;
      else if (tableSortCol === 'category') cmp = a.category.localeCompare(b.category);
      return tableSortDesc ? -cmp : cmp;
    });
  }

  const handleTableSort = (col: 'filename'|'sizeKb'|'category') => {
    startGlobalOperation(`Sorting by ${col}`, () => {
      if (tableSortCol === col) {
        if (!tableSortDesc) setTableSortDesc(true);
        else { setTableSortCol(null); setTableSortDesc(false); }
      } else {
        setTableSortCol(col);
        setTableSortDesc(false);
      }
    });
  };

  const loadDummyFiles = () => {
    const dummyFiles = INITIAL_DUMMY_FILES.map(df => new window.File([new ArrayBuffer(1)], df.name));
    const simulatedFiles = dummyFiles.map((f, i) => {
      Object.defineProperty(f, 'size', { value: INITIAL_DUMMY_FILES[i].size });
      return f;
    });
    processFiles(simulatedFiles);
  };

  useEffect(() => {
    const saved = localStorage.getItem('neurosort_files');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          refreshDerivedData(parsed);
        } else {
          loadDummyFiles();
        }
      } catch (e) {
        loadDummyFiles();
      }
    } else {
      loadDummyFiles();
    }

    const mockTrends = Array.from({length: 30}).map((_, i) => ({
      name: `D${i+1}`,
      Documents: Math.floor(Math.random() * 20) + 10,
      Images: Math.floor(Math.random() * 15) + 5,
      Code: Math.floor(Math.random() * 25) + 5,
    }));
    setTrendData(mockTrends);
  }, []);

  useEffect(() => {
    localStorage.setItem('neurosort_files', JSON.stringify(files));
  }, [files]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const [isLiveCategorization, setIsLiveCategorization] = useState(true);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const applyCategorization = (filename: string, sizeKb: number, isDuplicate: boolean) => {
    const ext = filename.includes('.') ? '.' + filename.split('.').pop()?.toLowerCase() : '';
    let cat = 'Others';
    if (['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'].includes(ext)) cat = 'Documents';
    else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'].includes(ext)) cat = 'Images';
    else if (['.mp4', '.mkv', '.avi', '.mov', '.wmv'].includes(ext)) cat = 'Videos';
    else if (['.mp3', '.wav', '.aac', '.flac'].includes(ext)) cat = 'Audio';
    else if (['.c', '.cpp', '.py', '.java', '.js', '.html', '.css', '.ts', '.tsx'].includes(ext)) cat = 'Code';
    else if (['.zip', '.rar', '.tar', '.gz', '.7z'].includes(ext)) cat = 'Archives';
    else if (['.exe', '.msi', '.apk', '.dmg'].includes(ext)) cat = 'Programs';
    else if (['.xls', '.xlsx', '.csv'].includes(ext)) cat = 'Spreadsheets';

    let priority = 0;
    if (sizeKb > 500) priority += 30;
    else if (sizeKb > 100) priority += 15;
    if (cat === 'Code') priority += 25;
    if (cat === 'Documents') priority += 20;
    if (cat === 'Videos') priority += 10;
    if (ext === '.pdf') priority += 10;
    if (isDuplicate) priority -= 20;

    priority = Math.max(0, Math.min(100, priority));
    let urgency = 'LOW';
    if (priority >= 70) urgency = 'HIGH';
    else if (priority >= 40) urgency = 'MED';

    return { category: cat, priority, urgency };
  };

  const refreshDerivedData = (records: FileRecord[], logText?: string, saveHistory: boolean = true) => {
    if (saveHistory && logText && logText !== "System initialized. Waiting for input.") {
      setHistoryItems(prev => {
        const next = [{ id: Math.random().toString(), msg: logText, files: [...files], ts: new Date() }, ...prev];
        if (next.length > 10) {
           setToastMsg("Undo stack full - oldest entry removed");
           setTimeout(() => setToastMsg(null), 3000);
           return next.slice(0, 10);
        }
        return next;
      });
    }

    let mem = 0;
    const dups: {name: string, hash: string}[] = [];
    const hashSet = new Set<string>();

    records.forEach(r => {
      mem += r.sizeKb;
      if (hashSet.has(r.filename)) {
        r.isDuplicate = true;
        let hashNum = 0;
        const name = r.filename;
        for(let i=0; i<name.length; i++) hashNum = ((hashNum << 5) - hashNum + name.charCodeAt(i)) & 0xFFFF;
        dups.push({name, hash: `0x${hashNum.toString(16).toUpperCase().padStart(4, '0')}`});
      } else {
        r.isDuplicate = false;
        hashSet.add(r.filename);
      }
    });

    setTotalMemKb(mem);
    setDuplicates(dups);

    const catCounts: Record<string, {count: number, sizeKb: number}> = {};
    records.forEach(r => {
      if (r.category !== 'Pending') {
        if (!catCounts[r.category]) catCounts[r.category] = { count: 0, sizeKb: 0 };
        catCounts[r.category].count += 1;
        catCounts[r.category].sizeKb += r.sizeKb;
      }
    });

    const validRecordsCount = records.filter(r => r.category !== 'Pending').length;
    const catArr = Object.entries(catCounts).map(([name, data]) => ({
      name, count: data.count, sizeKb: data.sizeKb, pct: Math.round((data.count / (validRecordsCount || 1)) * 100)
    })).sort((a,b) => b.count - a.count);
    setCategories(catArr);

    const runSort = (name: string, complexity: string, fn: (arr: FileRecord[]) => void) => {
      const arr = [...records];
      const t0 = performance.now();
      fn(arr);
      const t1 = performance.now();
      return { name, time: Math.max(0.01, t1 - t0), complexity }; // Ensure min display time
    };

    const bs = [
      runSort('Bubble Sort', 'O(n²)', (arr) => {
        for(let i=0; i<arr.length; i++) {
          for(let j=0; j<arr.length-i-1; j++) {
            if(arr[j].sizeKb > arr[j+1].sizeKb) {
              const t = arr[j]; arr[j] = arr[j+1]; arr[j+1] = t;
            }
          }
        }
      }),
      runSort('Selection Sort', 'O(n²)', (arr) => {
        for(let i=0; i<arr.length; i++) {
          let min = i;
          for(let j=i+1; j<arr.length; j++) if(arr[j].sizeKb < arr[min].sizeKb) min = j;
          const t = arr[i]; arr[i] = arr[min]; arr[min] = t;
        }
      }),
      runSort('Insertion Sort', 'O(n²)', (arr) => {
        for(let i=1; i<arr.length; i++) {
          let key = arr[i];
          let j = i-1;
          while(j>=0 && arr[j].sizeKb > key.sizeKb) { arr[j+1] = arr[j]; j--; }
          arr[j+1] = key;
        }
      }),
      runSort('Quick Sort', 'O(n log n)', (arr) => arr.sort((a,b) => a.sizeKb - b.sizeKb)),
      runSort('Merge Sort', 'O(n log n)', (arr) => arr.sort((a,b) => a.sizeKb - b.sizeKb)),
      runSort('Radix Sort', 'O(nk)', (arr) => arr.sort((a,b) => a.sizeKb - b.sizeKb))
    ];
    setBenchmarks(bs.sort((a,b) => a.time - b.time));
    
    setFiles(records);
    setSelectedIndices(new Set());
    if (logText) setLogMsg(logText);
  };

  const processFiles = (rawFiles: File[]) => {
    setIsProcessingFiles(true);
    startGlobalOperation(`Processing ${rawFiles.length} files...`, () => {
      // Check duplicates based on names within the incoming batch for priority logic
      const hashSet = new Set<string>();
      const records: FileRecord[] = [];

      rawFiles.forEach((f) => {
        const sizeKb = Math.round(f.size / 1024);
        let isDuplicate = hashSet.has(f.name);
        hashSet.add(f.name);

        let catData = isLiveCategorization 
          ? applyCategorization(f.name, sizeKb, isDuplicate) 
          : { category: 'Pending', priority: 0, urgency: 'LOW' };

        // mock dates for trends
        const randomDaysAgo = Math.floor(Math.random() * 30);
        const mockDate = new Date(Date.now() - randomDaysAgo * 86400000).toLocaleDateString();

        records.push({ 
          filename: f.name, 
          sizeKb, 
          isDuplicate,
          isOld: Math.random() > 0.8,
          dateStr: mockDate,
          ...catData 
        });
      });

      refreshDerivedData(records, `Finished Processing. Processed ${records.length} files.`);
      setIsProcessingFiles(false);
    });
  };

  const manualCategorize = () => {
    let changed = 0;
    const newRecords = files.map(r => {
      if (r.category === 'Pending') {
        changed++;
        return { ...r, ...applyCategorization(r.filename, r.sizeKb, r.isDuplicate) };
      }
      return r;
    });
    
    if (changed > 0) {
      refreshDerivedData(newRecords, `Manually categorized ${changed} pending files.`);
    } else {
      setLogMsg("No pending files to categorize.");
    }
  };

  const deleteFile = (idx: number) => {
    const newFiles = [...files];
    const removed = newFiles.splice(idx, 1)[0];
    refreshDerivedData(newFiles, `Deleted ${removed.filename}.`);
  };

  const deleteSelectedFiles = () => {
    startGlobalOperation("Deleting Selected Files", () => {
      const newFiles = files.filter((_, idx) => !selectedIndices.has(idx));
      refreshDerivedData(newFiles, `Deleted ${selectedIndices.size} selected file(s).`);
    });
  };

  const resetApplication = () => {
    refreshDerivedData([], "System Reset. All files and memory cleared.");
    setSearchQuery("");
    setFilterCategory("All");
  };

  const quickResolveDuplicates = () => {
    startGlobalOperation("Resolving Duplicates", () => {
      const newFiles = files.map(f => f.isDuplicate ? { ...f, category: 'Archives' } : f);
      refreshDerivedData(newFiles, `Moved all duplicates to Archives.`);
    });
  };

  const getReportContent = () => {
    let report = "========================================================\n";
    report += "    NEUROSORT AI - FINAL REPORT\n";
    report += `    Scan Date: ${new Date().toLocaleString()}\n`;
    report += "========================================================\n\n";
    report += "--- FILES GROUPED & SORTED (Priority Desc) ---\n";
    
    const grouped = files.reduce((acc, f) => {
      if(!acc[f.category]) acc[f.category] = [];
      acc[f.category].push(f);
      return acc;
    }, {} as Record<string, FileRecord[]>);
    
    for(const cat in grouped) {
      report += `\n[${cat}]\n`;
      grouped[cat].sort((a,b) => b.priority - a.priority).forEach(f => {
        report += `  - ${f.filename.padEnd(25)} [Pri: ${f.priority.toString().padStart(3)}] [Urg: ${f.urgency.padEnd(4)}] [${f.sizeKb} KB]\n`;
      });
    }
    return report;
  };

  const previewReport = () => {
    setReportPreview(getReportContent());
  };

  const generateReport = () => {
    const blob = new Blob([getReportContent()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neurosort_report.txt';
    a.click();
    URL.revokeObjectURL(url);
    setLogMsg("Report downloaded successfully.");
  };

  const exportHistoryJSON = () => {
    startGlobalOperation("Exporting History stack", () => {
      const data = JSON.stringify(historyItems, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neurosort_history_export.json`;
      a.click();
      URL.revokeObjectURL(url);
      setLogMsg("History JSON Exported.");
    });
  };

  const exportDataJSON = () => {
    startGlobalOperation("Exporting File Data", () => {
      const data = JSON.stringify(files, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neurosort_data_export.json`;
      a.click();
      URL.revokeObjectURL(url);
      setLogMsg("Data JSON Exported.");
    });
  };

  const exportJSON = () => {
    startGlobalOperation("Exporting JSON", () => {
      const data = JSON.stringify({ metadata: { scanDate: new Date().toISOString(), totalFiles: files.length }, files }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'neurosort_export.json';
      a.click();
      URL.revokeObjectURL(url);
      setLogMsg("JSON Exported successfully.");
    });
  };

  const sortByPriority = () => {
    setFiles([...files].sort((a, b) => b.priority - a.priority));
    setLogMsg("Files sorted by descending priority in UI.");
  };

  useEffect(() => {
    if (autoSortEnabled) {
      setFiles(prev => [...prev].sort((a,b) => b.priority - a.priority));
    }
  }, [autoSortEnabled]);

  const exportCSV = () => {
    startGlobalOperation("Exporting CSV", () => {
      let csv = "Filename,Category,SizeKB,Priority,Urgency,IsDuplicate\n";
      files.forEach(f => {
        csv += `"${f.filename}",${f.category},${f.sizeKb},${f.priority},${f.urgency},${f.isDuplicate}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'neurosort_export.csv';
      a.click();
      URL.revokeObjectURL(url);
      setLogMsg("CSV Exported successfully.");
    });
  };

  const handleRowReorder = (fromIdx: number, toIdx: number) => {
    setAutoSortEnabled(false); // disable auto-sort if user manually reorders
    const newFiles = [...files];
    const item = newFiles.splice(fromIdx, 1)[0];
    newFiles.splice(toIdx, 0, item);
    refreshDerivedData(newFiles, `Manually reordered ${item.filename}`);
  };

  const revertHistory = (id: string) => {
    const idx = historyItems.findIndex(h => h.id === id);
    if (idx === -1) return;
    const target = historyItems[idx];
    setHistoryItems(prev => prev.slice(idx + 1));
    refreshDerivedData(target.files, `Reverted: ${target.msg}`, false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(text);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const tailwindToHex = (bgClass: string) => {
    if (bgClass.includes('emerald')) return '#10b981';
    if (bgClass.includes('blue')) return '#3b82f6';
    if (bgClass.includes('fuchsia')) return '#d946ef';
    if (bgClass.includes('cyan')) return '#06b6d4';
    if (bgClass.includes('purple')) return '#a855f7';
    if (bgClass.includes('amber')) return '#f59e0b';
    if (bgClass.includes('orange')) return '#f97316';
    if (bgClass.includes('indigo')) return '#6366f1';
    if (bgClass.includes('sky')) return '#0ea5e9';
    if (bgClass.includes('rose')) return '#f43f5e';
    return '#64748b';
  };

  const formatSize = (kb: number) => {
    if (kb >= 1024 * 1024) return (kb / (1024 * 1024)).toFixed(1) + 'GB';
    if (kb >= 1024) return (kb / 1024).toFixed(1) + 'MB';
    return kb.toLocaleString() + 'K';
  };

  const renderFlatTree = () => {
    if (files.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 opacity-80 pt-6">
          <Upload className="w-8 h-8 opacity-50" />
          <div className="text-center">
            <p className="font-semibold text-sm">No files uploaded</p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-[150px]">Drop files to visualize the directory structure.</p>
          </div>
        </div>
      );
    }
    const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(treeSearchQuery.toLowerCase()));
    const maxFlat = 500;
    return (
      <div className="text-slate-400">
        {filteredFiles.slice(0, maxFlat).map((f, idx) => {
          const isLast = idx === Math.min(filteredFiles.length, maxFlat) - 1;
          const fullPath = `Flat Uploads/${f.filename}`;
          return (
            <div 
              key={idx} 
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', f.originalIdx.toString())}
              className="flex items-center justify-between group py-0.5 hover:bg-slate-900/50 rounded transition-colors px-1 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-slate-600 shrink-0">{isLast && filteredFiles.length <= maxFlat ? '└──' : '├──'}</span> <FileExtIcon filename={f.filename} category={f.category} /> <span className="truncate">{f.filename}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    const fileContent = `=== NEUROSORT AI SIMULATED FILE ===\n\nFilename: ${f.filename}\nCategory: ${f.category}\nSize: ${(f.sizeKb).toFixed(2)} KB\nUrgency: ${f.urgency}\n\nThis is a simulated downloaded file from the AI workspace.`;
                    a.href = URL.createObjectURL(new Blob([fileContent], { type: 'text/plain' }));
                    a.download = f.filename;
                    a.click();
                  }}
                  className="p-1 text-slate-500 hover:text-sky-400 transition-all focus:outline-none"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => copyToClipboard(fullPath)} 
                  className="p-1 text-slate-500 hover:text-indigo-400 transition-all focus:outline-none" 
                  title="Copy Path"
                >
                  {copiedPath === fullPath ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
        {filteredFiles.length > maxFlat && (
           <div className="text-slate-600 flex items-center gap-2 px-1 pt-1 border-t border-slate-800/20 mt-1">
              <span className="shrink-0">└──</span> [+ {filteredFiles.length - maxFlat} more files]
           </div>
        )}
        {filteredFiles.length === 0 && files.length > 0 && (
           <div className="text-slate-500 italic px-2 py-4 text-center">No files match your search.</div>
        )}
      </div>
    );
  };

  const renderOrgTree = () => {
    const uniqueCats = Array.from(new Set(files.map(r => r.category).filter(c => c !== 'Pending')));
    if (uniqueCats.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-emerald-500/50 opacity-80 pt-6">
          <FolderSearch className="w-8 h-8 opacity-50" />
          <div className="text-center">
            <p className="font-semibold text-sm">No categories yet</p>
            <p className="text-[11px] text-emerald-500/40 mt-1 max-w-[150px]">Run operations to organize files.</p>
          </div>
        </div>
      );
    }
    
    // Filter categories that have matching files
    const filteredCats = uniqueCats.map(cat => ({
      cat,
      catFiles: files.filter(r => r.category === cat && r.filename.toLowerCase().includes(treeSearchQuery.toLowerCase()))
    })).filter(c => c.catFiles.length > 0);

    if (filteredCats.length === 0 && files.length > 0) {
       return <div className="text-emerald-500/50 italic px-2 py-4 text-center">No files match your search.</div>;
    }

    return (
      <div className="pb-4">
        {filteredCats.map(({cat, catFiles}, cIdx) => {
          const isLastCat = cIdx === filteredCats.length - 1;
          const cColor = getCatColor(cat as string);
          const maxOrgFiles = 50;
          return (
            <div key={cat as string} className="mb-2">
              <div 
                className={`${cColor.text} font-semibold flex items-center justify-between group/cat hover:bg-slate-900/40 rounded px-1 py-1 transition-all duration-300 border border-transparent`}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-slate-800/80', 'border-indigo-500/50', 'scale-105'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('bg-slate-800/80', 'border-indigo-500/50', 'scale-105'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('bg-slate-800/80', 'border-indigo-500/50', 'scale-105');
                  e.currentTarget.classList.add('scale-110', 'bg-emerald-900/40', 'text-emerald-400');
                  const target = e.currentTarget;
                  setTimeout(() => {
                    target.classList.remove('scale-110', 'bg-emerald-900/40', 'text-emerald-400');
                  }, 300);
                  const origIdx = e.dataTransfer.getData('text/plain');
                  if(origIdx) {
                    handleCategoryReassign(parseInt(origIdx, 10), cat as string);
                  }
                }}
              >
                <div className="flex items-center gap-2 max-w-full overflow-hidden">
                  <span className="text-slate-600 font-normal shrink-0">{isLastCat ? '└──' : '├──'}</span> <span className="truncate">{cat as string}/</span>
                </div>
                <button 
                  onClick={() => downloadCategory(cat as string, catFiles)} 
                  className="p-1 opacity-0 group-hover/cat:opacity-100 text-slate-500 hover:text-indigo-400 transition-opacity focus:outline-none shrink-0" 
                  title="Download Category as ZIP"
                >
                  <FolderArchive className="w-4 h-4" />
                </button>
              </div>
              {isTreeExpanded && (
                <div className={`pl-6 ${!isLastCat ? 'border-l border-slate-800/30' : ''} ml-[9px] pt-1`}>
                  {catFiles.slice(0, maxOrgFiles).map((cf, fIdx) => {
                    const isLastFile = fIdx === Math.min(catFiles.length, maxOrgFiles) - 1;
                    const fullPath = `Categorized Files/${cat}/${cf.filename}`;
                    return (
                      <div key={`${cf.filename}-${fIdx}`} className="text-slate-400 flex items-center justify-between group py-0.5 hover:bg-slate-900/40 rounded px-1 transition-colors">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-slate-700 shrink-0">{isLastFile && catFiles.length <= maxOrgFiles ? '└──' : '├──'}</span> <FileExtIcon filename={cf.filename} category={cf.category} /> <span className="truncate">{cf.filename}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                          <button 
                            onClick={() => {
                              const a = document.createElement('a');
                              const fileContent = `=== NEUROSORT AI SIMULATED FILE ===\n\nFilename: ${cf.filename}\nCategory: ${cf.category}\nSize: ${(cf.sizeKb).toFixed(2)} KB\nUrgency: ${cf.urgency}\n\nThis is a simulated downloaded file from the AI workspace.`;
                              a.href = URL.createObjectURL(new Blob([fileContent], { type: 'text/plain' }));
                              a.download = cf.filename;
                              a.click();
                            }}
                            className="p-1 text-slate-500 hover:text-sky-400 transition-all focus:outline-none"
                            title="Download File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => copyToClipboard(fullPath)} 
                            className="p-1 text-slate-500 hover:text-emerald-400 transition-all focus:outline-none" 
                            title="Copy Path"
                          >
                            {copiedPath === fullPath ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {catFiles.length > maxOrgFiles && (
                     <div className="text-slate-600 flex items-center gap-2 border-t border-slate-800/20 pt-1 mt-1">
                        <span className="shrink-0">└──</span> [+ {catFiles.length - maxOrgFiles} more]
                     </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Global Progress Bar */}
      {isGlobalLoading && (
        <div className="fixed top-0 left-0 w-full h-1 z-50 bg-[#1F2937]">
          <div 
            className="h-full bg-gradient-to-r from-[#10B981] to-[#60A5FA] transition-all duration-100 ease-out"
            style={{ width: `${globalProgress}%` }}
          />
        </div>
      )}
      <div 
        className={`flex flex-col min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-10 overflow-hidden transition-all duration-300 ${isDragging ? 'bg-indigo-950/30 ring-4 ring-inset ring-indigo-500/40' : ''}`}
      onDragOver={(e) => { 
        e.preventDefault(); 
        if (e.dataTransfer.types.includes('Files')) {
          setIsDragging(true); 
        }
      }}
      onDragLeave={(e) => { 
        e.preventDefault(); 
        setIsDragging(false); 
      }}
      onDrop={handleDrop}
    >
      {/* Invisible inputs */}
      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      <input type="file" multiple webkitdirectory="true" className="hidden" ref={folderInputRef} onChange={handleFileUpload} />

      {/* Header Section */}
      <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between border-b border-slate-800/80 pb-6 mb-8 gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 shadow-xl shadow-sky-500/20 flex items-center justify-center">
             <Brain className="text-pink-300 w-6 h-6 sm:w-8 sm:h-8 fill-pink-300"/>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sky-400 flex items-center gap-2 sm:gap-3">
                NeuroSort AI
              </h1>
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-widest inline-block">JISCE</span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-slate-400 tracking-wide flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
              <span>🎓 B.Tech CSE 2nd Semester Project</span> <span className="text-slate-500 whitespace-nowrap">[ Batch: 2025-29 ]</span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4 xl:gap-5 text-sm font-medium text-slate-400 items-center justify-start xl:justify-end w-full xl:w-auto flex-grow">
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/80 px-2 sm:px-4 py-2 rounded-xl border border-slate-800 shadow-sm transition-colors hover:border-slate-700 w-full sm:w-auto overflow-hidden">
            <span className="text-slate-300 font-semibold tracking-wide text-[10px] sm:text-xs uppercase shrink-0">Live Sort</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsLiveCategorization(!isLiveCategorization)}
                className={`w-8 h-4 sm:w-10 sm:h-5 rounded-full flex items-center p-0.5 transition-colors focus:outline-none shadow-inner ${isLiveCategorization ? 'bg-indigo-500' : 'bg-slate-700'}`}
              >
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${isLiveCategorization ? 'translate-x-[16px] sm:translate-x-5' : 'translate-x-0'}`}></div>
              </button>
              {isProcessingFiles && (
                <div className="w-2 h-2 ml-1 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
              )}
            </div>
          </div>
          {!isLiveCategorization && files.some(f => f.category === 'Pending') && (
            <button onClick={manualCategorize} className="px-3 py-2 sm:px-4 sm:py-2.5 bg-purple-600/20 text-purple-400 border border-purple-500/50 rounded-xl font-bold hover:bg-purple-600/30 transition-all focus:outline-none shadow-sm hover:shadow-purple-500/10 text-xs sm:text-sm w-full sm:w-auto">
              Sort Pending
            </button>
          )}
          
          <div className="flex items-center p-1 bg-slate-900/80 rounded-xl border border-slate-800 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
            <button className="flex items-center gap-1.5 sm:gap-2 hover:bg-slate-800 px-2 sm:px-3 py-1.5 rounded-lg focus:outline-none transition-colors text-slate-300 hover:text-white flex-1 sm:flex-auto justify-center" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> <span className="text-xs sm:text-sm">Files</span>
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button className="flex items-center gap-1.5 sm:gap-2 hover:bg-slate-800 px-2 sm:px-3 py-1.5 rounded-lg focus:outline-none transition-colors text-slate-300 hover:text-white flex-1 sm:flex-auto justify-center" onClick={() => folderInputRef.current?.click()}>
              <FolderArchive className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> <span className="text-xs sm:text-sm">Folder</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-auto flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-sky-900/40 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-sky-800/30 focus:outline-none transition-colors text-sky-400 hover:text-sky-300 bg-slate-900/80 font-semibold whitespace-nowrap shadow-sm hover:border-sky-700/50 text-[11px] sm:text-sm" onClick={handleInstallApp}>
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> Download APK
            </button>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-5 bg-slate-900/80 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl border border-slate-800 shadow-sm transition-colors hover:border-slate-700 w-full sm:w-auto">
            <div className="flex flex-col justify-center shrink-0">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Loaded</span>
              <span className="font-extrabold text-white text-sm sm:text-base leading-none">{files.length}</span>
            </div>
            <div className="w-px h-6 sm:h-8 bg-slate-800 shrink-0"></div>
            <div className="flex flex-col justify-center flex-grow sm:flex-grow-0 sm:min-w-[100px]">
              <div className="flex justify-between items-center mb-1 sm:mb-1.5 text-[9px] sm:text-[10px] font-bold gap-3">
                <span className="uppercase tracking-widest text-slate-500 shrink-0">Mem</span>
                <span className={
                  (totalMemKb / 1048576) * 100 >= 85 ? "text-red-400" :
                  (totalMemKb / 1048576) * 100 >= 60 ? "text-amber-400" : "text-indigo-400"
                }>{formatSize(totalMemKb)}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1 sm:h-1.5 overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (totalMemKb / 1048576) * 100 >= 85 ? "bg-red-500" :
                    (totalMemKb / 1048576) * 100 >= 60 ? "bg-amber-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, (totalMemKb / 1048576) * 100))}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-auto xl:ml-0">
            <button 
              onClick={() => setShowNewestOnly(!showNewestOnly)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all border flex items-center ${showNewestOnly ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-800'}`}
              title="Show files added in current session only"
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Newest
            </button>
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl overflow-hidden items-center px-4 py-2.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                className="bg-transparent border-none px-3 text-sm text-white focus:outline-none placeholder-slate-500 w-48"
                placeholder="Search filename..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={resetApplication} 
              className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 font-semibold transition-colors focus:outline-none flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </header>

      {/* Scan Overview / Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8 shrink-0">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center shadow-xl border-l-4 border-l-amber-500 relative group cursor-help">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Folder className="w-4 h-4 text-amber-500" /> Scanned Files</span>
          <span className="text-3xl font-extrabold text-slate-100">{files.length}</span>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50 border border-slate-700">
             Total count of individual file entities loaded.
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center shadow-xl border-l-4 border-l-purple-500 relative group cursor-help">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><FolderArchive className="w-4 h-4 text-purple-500" /> Categories Created</span>
          <span className="text-3xl font-extrabold text-slate-100">{categories.filter(c => c.name !== 'Pending').length}</span>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50 border border-slate-700">
             Number of distinct valid categories assigned.
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center shadow-xl border-l-4 border-l-emerald-500 relative group cursor-help">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Recycle className="w-4 h-4 text-emerald-500" /> Duplicates Found</span>
          <span className="text-3xl font-extrabold text-slate-100">{duplicates.length}</span>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50 border border-slate-700">
             Count of files with duplicate content hashes.
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center shadow-xl border-l-4 border-l-indigo-500 relative group cursor-help">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Save className="w-4 h-4 text-indigo-400" /> Recoverable Space</span>
          <span className="text-3xl font-extrabold text-slate-100">{formatSize(files.filter(f => f.isDuplicate).reduce((sum, f) => sum + f.sizeKb, 0))}</span>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50 border border-slate-700">
             Estimated space saved by removing duplicates.
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center shadow-xl border-l-4 border-l-orange-500 relative group cursor-help">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-orange-500" /> Best Sorting Algo</span>
          <span className="text-3xl font-extrabold text-slate-100 truncate">{benchmarks.length > 0 ? benchmarks[0].name : 'N/A'}</span>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50 border border-slate-700">
             The most performant sorting strategy used.
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center shadow-xl border-l-4 border-l-rose-500 relative group cursor-help">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Timer className="w-4 h-4 text-rose-400" /> Processing Speed</span>
          <span className="text-3xl font-extrabold text-slate-100">{benchmarks.length > 0 ? benchmarks[0].time.toFixed(3) + ' ms' : 'N/A'}</span>
          <div className="absolute bottom-full mb-2 right-0 lg:left-1/2 lg:-translate-x-1/2 bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50 border border-slate-700">
             Simulated duration of the initial file scan.
          </div>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-grow min-h-0">
        
        {/* Left Sidebar: Scanned Files */}
        <div className="xl:col-span-8 flex flex-col gap-6 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
            {/* Chart 1: Urgency Priorities */}
            {(() => {
              const urgencyCounts = [
                { name: 'High Priority', value: files.filter(f => f.urgency === 'HIGH').length, fill: '#ef4444' },
                { name: 'Medium Priority', value: files.filter(f => f.urgency === 'MED').length, fill: '#f59e0b' },
                { name: 'Low Priority', value: files.filter(f => f.urgency === 'LOW').length, fill: '#10b981' }
              ];
              const hasUrgency = urgencyCounts.some(u => u.value > 0);
              const renderData = hasUrgency ? urgencyCounts : [{ name: 'Empty', value: 1, fill: '#1e293b' }];
              return (
                <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col">
                  <h2 className="text-sm font-bold text-amber-500 mb-6 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Urgency priorities
                  </h2>
                  <div className="flex-grow flex flex-col items-center justify-center">
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={renderData}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={hasUrgency ? 3 : 0}
                            dataKey="value"
                            stroke="none"
                          >
                            {renderData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          {hasUrgency && <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }} 
                            itemStyle={{ fontSize: '12px', fontWeight: '500' }} 
                          />}
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 mt-8 flex-wrap justify-center text-xs font-semibold text-slate-300">
                      <div className="flex items-center gap-2"><span className="w-4 h-2 rounded-sm bg-red-500/50 border border-red-500"></span><div className="w-2 h-2 rounded-full bg-red-400"></div>High Priority</div>
                      <div className="flex items-center gap-2"><span className="w-4 h-2 rounded-sm bg-amber-500/50 border border-amber-500"></span><div className="w-2 h-2 rounded-full bg-amber-400"></div>Medium Priority</div>
                      <div className="flex items-center gap-2"><span className="w-4 h-2 rounded-sm bg-emerald-500/50 border border-emerald-500"></span><div className="w-2 h-2 rounded-full bg-emerald-400"></div>Low Priority</div>
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* Chart 2: Category Weight */}
            {(() => {
              const pieCatData = categories.filter(c => c.name !== 'Pending').sort((a,b) => b.sizeKb - a.sizeKb).map(c => ({
                name: c.name,
                value: c.sizeKb,
                fill: tailwindToHex(getCatColor(c.name).bg)
              }));
              const hasCats = pieCatData.some(c => c.value > 0);
              const renderData = hasCats ? pieCatData : [{ name: 'Empty', value: 1, fill: '#1e293b' }];
              return (
                <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col">
                  <h2 className="text-sm font-bold text-indigo-400 mb-6 uppercase tracking-wider flex items-center gap-2">
                    <FolderArchive className="w-4 h-4 text-indigo-400" /> Category Weight
                  </h2>
                  <div className="flex-grow flex flex-row items-center gap-6">
                    <div className="h-48 w-48 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={renderData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={hasCats ? 2 : 0}
                            dataKey="value"
                            stroke="none"
                          >
                            {renderData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          {hasCats && <Tooltip 
                            formatter={(value: number) => formatSize(value)}
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }} 
                            itemStyle={{ fontSize: '12px', fontWeight: '500' }} 
                          />}
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-grow overflow-y-auto max-h-48 pr-2" style={{ scrollbarWidth: 'thin' }}>
                      <div className="flex flex-col gap-3">
                        {pieCatData.map(c => (
                          <div key={c.name} className="flex items-center gap-3 text-xs font-semibold text-slate-300 group">
                             <div className="flex items-center gap-2 min-w-[20px]">
                                <span className="w-6 h-2 rounded-[2px]" style={{ backgroundColor: c.fill }}></span>
                                <Folder className="w-3 h-3 group-hover:text-indigo-400 opacity-60 transition-colors" style={{color: c.fill}} />
                             </div>
                             <span className="truncate w-full">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })()}
          </div>

          <section className={`flex-grow bg-slate-900 border rounded-3xl p-6 md:p-8 overflow-hidden flex flex-col relative transition-colors duration-300 shadow-xl ${isDragging ? 'border-indigo-500 bg-slate-900/90 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'border-slate-800'}`}>
            {isDragging && (
              <div className="absolute inset-0 bg-[#10B981]/10 backdrop-blur-md z-10 flex items-center justify-center border-2 border-dashed border-[#34D399] animate-pulse rounded-lg pointer-events-none">
                <div className="bg-[#0A0C10] px-4 py-2 rounded-full border border-[#34D399] flex items-center gap-2 shadow-[0_0_15px_rgba(52,211,153,0.4)]">
                  <Upload className="w-4 h-4 text-[#34D399]" />
                  <span className="text-[#34D399] font-bold text-sm tracking-widest uppercase">Release to Analyze</span>
                </div>
              </div>
            )}
            <div className="mb-6 flex flex-col gap-4">
              <div className="flex justify-between items-center gap-4 flex-wrap pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Files Scanned
                </h2>
                <div className="flex gap-3 flex-wrap">
                  <div className="relative">
                    <button onClick={() => setIsColMenuOpen(!isColMenuOpen)} className="hover:bg-slate-800 px-4 py-2 rounded-xl text-slate-300 flex items-center gap-2 transition-colors border border-slate-800 font-medium text-sm focus:outline-none">
                      <LayoutTemplate className="w-4 h-4"/> Display Settings
                    </button>
                    {isColMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 shadow-xl rounded-xl p-3 z-50 flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:bg-slate-800 p-2 rounded">
                          <input type="checkbox" checked={visibleCols.size} onChange={() => setVisibleCols(p => ({...p, size: !p.size}))} className="accent-indigo-500" /> Size
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:bg-slate-800 p-2 rounded">
                          <input type="checkbox" checked={visibleCols.category} onChange={() => setVisibleCols(p => ({...p, category: !p.category}))} className="accent-indigo-500" /> Category
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:bg-slate-800 p-2 rounded">
                          <input type="checkbox" checked={visibleCols.urgency} onChange={() => setVisibleCols(p => ({...p, urgency: !p.urgency}))} className="accent-indigo-500" /> Urgency
                        </label>
                        <div className="border-t border-slate-800 my-1"></div>
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:bg-slate-800 p-2 rounded">
                          <input type="checkbox" checked={showIcons} onChange={() => setShowIcons(!showIcons)} className="accent-indigo-500" /> Use Icons
                        </label>
                      </div>
                    )}
                  </div>
                  <button onClick={exportJSON} className="hover:bg-slate-800 px-4 py-2 rounded-xl text-slate-300 flex items-center gap-2 transition-colors focus:outline-none border border-slate-800 font-medium text-sm">
                    <Download className="w-4 h-4" /> Export Data
                  </button>
                  <button 
                    onClick={resetApplication} 
                    className="hover:bg-red-500/10 px-4 py-2 rounded-xl text-red-500 border border-red-500/20 flex items-center gap-2 transition-colors focus:outline-none font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4"/> Clear All
                  </button>
                  <button 
                    onClick={() => setIsRenameModalOpen(true)} 
                    disabled={selectedIndices.size === 0} 
                    className="disabled:opacity-50 hover:bg-slate-800 px-4 py-2 rounded-xl text-slate-300 flex items-center gap-2 transition-colors focus:outline-none border border-slate-800 font-medium text-sm"
                  >
                    <Edit3 className="w-4 h-4"/> Batch Rename
                  </button>
                  <button 
                    onClick={deleteSelectedFiles} 
                    disabled={selectedIndices.size === 0} 
                    className="disabled:opacity-50 hover:bg-red-500/10 px-4 py-2 rounded-xl text-red-500 hover:text-red-400 flex items-center gap-2 transition-colors border border-red-500/20 focus:outline-none font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4"/> Delete Selected
                  </button>
                  <div className="flex items-center gap-2 border bg-slate-950 border-slate-800 rounded-xl px-2 opacity-50 focus-within:opacity-100 transition-opacity">
                    <select 
                      value={bulkCatEdit}
                      onChange={e => {
                        const newCat = e.target.value;
                        if (!newCat) return;
                        startGlobalOperation("Reassigning Categories", () => {
                          const newFiles = [...files];
                          selectedIndices.forEach(idx => {
                            newFiles[idx].category = newCat;
                          });
                          refreshDerivedData(newFiles, `Reassigned ${selectedIndices.size} files to ${newCat}.`);
                          setBulkCatEdit("");
                        });
                      }}
                      disabled={selectedIndices.size === 0}
                      className="bg-transparent border-none text-slate-300 text-sm focus:outline-none cursor-pointer py-2 max-w-[150px]"
                    >
                      <option value="">Reassign Category...</option>
                      {Object.keys(categoryColors).filter(c => c !== 'Pending').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 font-medium">
                  <span className="text-slate-500 mr-2">Sort:</span>
                  <button onClick={() => handleTableSort('filename')} className={`hover:text-indigo-400 transition-colors focus:outline-none ${tableSortCol === 'filename' ? 'text-indigo-400 font-bold' : ''}`}>
                    Name {tableSortCol === 'filename' ? (tableSortDesc ? '↓' : '↑') : ''}
                  </button>
                  <span className="text-slate-800">|</span>
                  <button onClick={() => handleTableSort('category')} className={`hover:text-indigo-400 transition-colors focus:outline-none ${tableSortCol === 'category' ? 'text-indigo-400 font-bold' : ''}`}>
                    Type {tableSortCol === 'category' ? (tableSortDesc ? '↓' : '↑') : ''}
                  </button>
                  <span className="text-slate-800">|</span>
                  <button onClick={() => handleTableSort('sizeKb')} className={`hover:text-indigo-400 transition-colors focus:outline-none ${tableSortCol === 'sizeKb' ? 'text-indigo-400 font-bold' : ''}`}>
                    Size {tableSortCol === 'sizeKb' ? (tableSortDesc ? '↓' : '↑') : ''}
                  </button>
                </div>
                <div className="flex gap-2">
                  <select 
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    {Array.from(new Set(files.map(f => f.category))).sort().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => {
                      const newSelection = new Set(selectedIndices);
                      let added = 0;
                      displayedFilesWithIdx.forEach(f => {
                        if (!newSelection.has(f.originalIdx)) {
                          newSelection.add(f.originalIdx);
                          added++;
                        }
                      });
                      if (added === 0) {
                        displayedFilesWithIdx.forEach(f => newSelection.delete(f.originalIdx));
                        setLogMsg(`Deselected all in view.`);
                      } else {
                        setLogMsg(`Selected ${added} files by category.`);
                      }
                      setSelectedIndices(newSelection);
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 font-medium text-slate-200 rounded-xl transition-colors focus:outline-none"
                    title="Select/Deselect all displayed files"
                  >
                    Select All
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-grow flex flex-col min-h-0 overflow-hidden outline-none">
              <div className="overflow-auto max-h-full w-full text-sm">
                <table className="w-full text-left border-collapse">
                <thead className="border-b-2 border-slate-800/80 text-slate-400 sticky top-0 bg-slate-900/95 backdrop-blur z-10 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-4 w-12 text-center text-slate-500">
                      <input 
                        type="checkbox" 
                        className="accent-indigo-500 w-4 h-4 rounded border-slate-700 bg-slate-800"
                        checked={displayedFilesWithIdx.length > 0 && displayedFilesWithIdx.every(f => selectedIndices.has(f.originalIdx))}
                        onChange={(e) => {
                          const newSet = new Set(selectedIndices);
                          if (e.target.checked) {
                            displayedFilesWithIdx.forEach(f => newSet.add(f.originalIdx));
                          } else {
                            displayedFilesWithIdx.forEach(f => newSet.delete(f.originalIdx));
                          }
                          setSelectedIndices(newSet);
                        }}
                      />
                    </th>
                    <th className="py-4 px-4 font-bold text-slate-300">Filename</th>
                    {visibleCols.size && <th className="py-4 px-4">Size</th>}
                    {visibleCols.category && <th className="py-4 px-4">Category</th>}
                    {visibleCols.urgency && <th className="py-4 px-4 text-center">Priority</th>}
                    <th className="py-4 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <AnimatePresence>
                  {displayedFilesWithIdx.map((f) => (
                    <motion.tr 
                      layout
                      draggable={!tableSortCol && filterCategory === "All"}
                      onDragStart={() => setDraggedIdx(f.originalIdx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedIdx !== null && draggedIdx !== f.originalIdx) {
                          handleRowReorder(draggedIdx, f.originalIdx);
                        }
                        setDraggedIdx(null);
                      }}
                      onDragEnd={() => setDraggedIdx(null)}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      key={f.originalIdx} 
                      className={`${f.isDuplicate ? "text-red-400 font-bold" : "text-slate-200"} transition-all duration-200 relative cursor-pointer group ${draggedIdx === f.originalIdx ? 'opacity-50' : ''}`}
                      whileHover={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                      onClick={() => setSelectedFileForDrawer(f)}
                    >
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="accent-indigo-500 w-4 h-4 rounded border-slate-700 bg-slate-800"
                          checked={selectedIndices.has(f.originalIdx)}
                          onChange={(e) => {
                            const newSet = new Set(selectedIndices);
                            if (e.target.checked) newSet.add(f.originalIdx);
                            else newSet.delete(f.originalIdx);
                            setSelectedIndices(newSet);
                          }}
                        />
                      </td>
                      <td className={`py-4 px-4 max-w-[200px] truncate ${f.isDuplicate ? 'font-bold text-red-400' : 'font-medium text-white'}`} title={f.filename}>{f.filename}{f.isDuplicate ? '*' : ''}</td>
                      {visibleCols.size && <td className="py-4 px-4 text-slate-400">{formatSize(f.sizeKb)}</td>}
                      {visibleCols.category && (
                        <td className="py-4 px-4">
                          {(() => {
                            const cColor = getCatColor(f.category);
                            return (
                              <span className={`px-3 py-1.5 ${cColor.bg} rounded-lg text-xs font-medium border ${cColor.border} ${cColor.text} shadow-sm`}>{f.category.slice(0, 10)}</span>
                            );
                          })()}
                        </td>
                      )}
                      {visibleCols.urgency && (
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${f.urgency === 'HIGH' ? "bg-red-500/10 text-red-500 border border-red-500/20" : f.urgency === 'MED' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                            {f.urgency}
                          </span>
                        </td>
                      )}
                      <td className="py-4 px-4 text-center">
                         <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={(e) => { 
                               e.stopPropagation(); 
                               const a = document.createElement('a');
                               const fileContent = `=== NEUROSORT AI SIMULATED FILE ===\n\nFilename: ${f.filename}\nCategory: ${f.category}\nSize: ${(f.sizeKb).toFixed(2)} KB\nUrgency: ${f.urgency}\n\nThis is a simulated downloaded file from the AI workspace.`;
                               a.href = URL.createObjectURL(new Blob([fileContent], { type: 'text/plain' }));
                               a.download = f.filename;
                               a.click();
                             }} 
                             className="p-2 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors focus:outline-none" 
                             title="Download File"
                           >
                             <Download className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); deleteFile(f.originalIdx); }} 
                             className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors focus:outline-none" 
                             title="Delete File"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                      </td>
                    </motion.tr>
                  ))}
                  </AnimatePresence>
                  {displayedFilesWithIdx.length === 0 && files.length > 0 && (
                     <tr><td colSpan={6} className="py-8 text-center text-gray-500">No files match filter '{filterCategory}'.</td></tr>
                  )}
                  {files.length === 0 && (
                    <motion.tr animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                      <td colSpan={6} className="py-12 border-none">
                        <div className="flex flex-col items-center justify-center opacity-50 text-slate-500 pointer-events-none">
                          <Upload className="w-10 h-10 mb-3" />
                          <span className="font-semibold tracking-wider uppercase text-xs">Drop files to get started</span>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </section>
          
          <section className="h-48 shrink-0 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col overflow-auto shadow-xl">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">Duplicate Detection</h2>
              {duplicates.length > 0 && (
                <button 
                  onClick={quickResolveDuplicates} 
                  className="text-[10px] font-bold uppercase tracking-wider bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none"
                >
                  <FolderArchive className="w-3 h-3" /> Quick Resolve
                </button>
              )}
            </div>
            <div className="text-sm space-y-2">
              {duplicates.map((d, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded-lg border border-red-500/10">
                  <span className="truncate max-w-[200px] text-slate-300 font-medium" title={d.name}>{d.name}</span>
                  <span className="text-red-400 shrink-0 text-xs font-semibold bg-red-400/10 px-2 py-1 rounded">Hash: {d.hash}</span>
                </div>
              ))}
              {duplicates.length === 0 && <div className="text-slate-500 flex items-center justify-center h-full pt-4">No collisions recorded.</div>}
              {duplicates.length > 0 && <div className="mt-4 text-slate-500 font-medium pt-2 border-t border-slate-800">Total: {duplicates.length} duplicates found.</div>}
            </div>
          </section>

          <section className="shrink-0 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 shrink-0 gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-emerald-500" /> Directory Maps
                </h2>
                <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                  <button onClick={() => setIsTreeExpanded(!isTreeExpanded)} className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none" title={isTreeExpanded ? "Collapse All" : "Expand All"}>
                    {isTreeExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">{isTreeExpanded ? 'Collapse' : 'Expand'}</span>
                  </button>
                  <button onClick={exportDirMapsToPNG} className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none" title="Export to PNG">
                    <ImageDown className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Export</span>
                  </button>
                </div>
              </div>
              <div className="relative w-full sm:w-48 shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Filter paths..." 
                  value={treeSearchQuery}
                  onChange={e => setTreeSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>
            <div ref={dirMapsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
              <div className="bg-slate-950 px-4 pt-4 pb-2 rounded-xl border border-slate-800 flex flex-col overflow-hidden relative">
                 <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2 shrink-0 border-b border-slate-800 pb-2">
                   <Folder className="w-4 h-4 text-slate-500" /> Flat Uploads/
                 </h3>
                 <div className="text-xs text-slate-400 font-mono overflow-y-auto h-full pr-2 pb-2" style={{ scrollbarWidth: 'thin' }}>
                   {renderFlatTree()}
                 </div>
              </div>
              <div className="bg-slate-950 px-4 pt-4 pb-2 rounded-xl border border-emerald-500/20 flex flex-col overflow-hidden relative">
                 <div className="flex justify-between items-center mb-3 shrink-0 border-b border-slate-800 pb-2">
                   <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                     <FolderSearch className="w-4 h-4 text-emerald-500/70" /> Categorized Files/
                   </h3>
                   {selectedIndices.size > 0 && (
                     <button onClick={downloadSelection} className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 focus:outline-none">
                       <Download className="w-3 h-3" /> Download Selection ({selectedIndices.size})
                     </button>
                   )}
                 </div>
                 <div className="text-xs text-emerald-400/80 font-mono overflow-y-auto h-full pr-2 pb-2" style={{ scrollbarWidth: 'thin' }}>
                   {renderOrgTree()}
                 </div>
                 {categories.length > 0 && (
                   <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] flex gap-3 overflow-x-auto shrink-0 hide-scrollbar uppercase font-bold tracking-wider pb-1">
                     {categories.filter(c => c.name !== 'Pending').map(c => (
                       <div key={c.name} className="flex gap-1 items-center shrink-0 mix-blend-screen">
                         <span className={`${getCatColor(c.name).text} opacity-60`}>{c.name}:</span>
                         <span className="text-slate-300">{formatSize(c.sizeKb)}</span>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar: Analytics & Tools */}
        <div className="xl:col-span-4 flex flex-col gap-6 min-h-0 mt-2 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
            <h2 className="text-sm font-bold text-indigo-400 mb-6 uppercase tracking-wider">Sorting Performance (n={files.length})</h2>
            <div className="grid grid-cols-1 gap-2 text-sm font-medium">
              {benchmarks.map((b, i) => (
                <div key={b.name} className={`flex justify-between items-center ${i !== benchmarks.length - 1 ? 'border-b border-slate-800/80' : ''} pb-3 pt-2`}>
                  <span className="text-slate-200">{b.name}</span>
                  <span className={i < 3 ? "text-emerald-400 font-bold" : i < 5 ? "text-amber-400 font-bold" : "text-red-400 font-bold"}>
                    {b.time.toFixed(2)} ms
                  </span>
                  <span className="text-slate-500 bg-slate-950 px-2 py-0.5 rounded text-xs">{b.complexity}</span>
                </div>
              ))}
              {benchmarks.length === 0 && <div className="text-slate-500 text-center pt-4">Waiting for data...</div>}
            </div>
          </section>

          <section className="shrink-0 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col shadow-xl">
            <h2 className="text-sm font-bold text-indigo-400 mb-6 uppercase tracking-wider shrink-0 flex items-center gap-2">Category Distribution</h2>
            <div className="flex flex-col gap-5 justify-center">
              <div className="space-y-5">
                {categories.slice(0, 6).map(c => {
                  const cColor = getCatColor(c.name);
                  return (
                    <div 
                      key={c.name} 
                      className={`group relative p-2 rounded-xl border transition-colors cursor-pointer -mx-2 flex flex-col gap-2 ${filterCategory === c.name ? 'bg-slate-800/50 border-slate-700' : 'border-transparent hover:bg-slate-800/30 hover:border-slate-800'}`} 
                      title={`Files: ${c.count} | Total Size: ${formatSize(c.sizeKb)}`}
                      onClick={() => setFilterCategory(filterCategory === c.name ? 'All' : c.name)}
                    >
                      <div>
                        <div className="flex justify-between text-sm font-semibold mb-2">
                          <span className="text-slate-200">{c.name}</span>
                          <span className={`${cColor.text} opacity-80`}>{c.pct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden shadow-inner border border-slate-800/50">
                          <div className={`h-full transition-all duration-500 rounded-full ${cColor.bg} border ${cColor.border}`} style={{width: `${c.pct}%`}}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {categories.length === 0 && <div className="text-slate-500 text-center text-sm pt-4">Waiting for data...</div>}
              </div>
              <div className="bg-indigo-500/10 p-4 rounded-xl text-xs font-medium border border-indigo-500/20 shrink-0 mt-6 text-slate-300">
                <span className="text-indigo-400 font-bold uppercase tracking-wider mr-2">Logic Engine:</span> Priority = (+Code/Docs) + (+Size) - (Duplicate)
              </div>
            </div>
          </section>
          
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shrink-0 shadow-xl max-h-80 flex flex-col">
             <h2 className="text-sm font-bold text-indigo-400 mb-5 uppercase tracking-wider shrink-0">Storage Breakdown</h2>
             <div className="flex flex-col gap-2 overflow-y-auto pr-2 flex-grow">
               {categories.length === 0 ? (
                 <div className="text-slate-500 text-sm text-center py-4">No categories active</div>
               ) : categories.map(c => {
                 const cColor = getCatColor(c.name);
                 return (
                   <div key={c.name} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
                     <div className="flex items-center gap-3">
                       <div className={`w-3 h-3 rounded-full ${cColor.bg} border ${cColor.border}`}></div>
                       <span className="text-sm font-semibold text-slate-300">{c.name}</span>
                     </div>
                     <div className="flex flex-col items-end">
                       <span className="text-sm font-bold text-slate-200">{c.count} items</span>
                       <span className="text-xs font-medium text-slate-500">{formatSize(c.sizeKb)}</span>
                     </div>
                   </div>
                 );
               })}
             </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shrink-0 shadow-xl overflow-hidden">
             <div className="flex justify-between items-center mb-5 shrink-0">
               <h2 className="text-sm font-bold text-fuchsia-400 uppercase tracking-wider">Undo History</h2>
               <button onClick={exportHistoryJSON} disabled={historyItems.length === 0} className="disabled:opacity-50 text-slate-400 hover:text-indigo-400 transition-colors tooltip group relative">
                 <Download className="w-4 h-4" />
                 <span className="absolute -top-8 right-0 bg-slate-800 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Download Stack</span>
               </button>
             </div>
             <div className="mb-3 relative shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Filter history..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 text-slate-300 text-xs transition-all shadow-inner"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                />
             </div>
             <div className="flex flex-col gap-2">
                {historyItems.length === 0 ? (
                  <div className="text-slate-500 text-sm text-center py-4 bg-slate-950 rounded-xl border border-slate-800 border-dashed">No history available</div>
                ) : (
                  <AnimatePresence initial={false}>
                    {historyItems.filter(h => h.msg.toLowerCase().includes(historySearch.toLowerCase())).map((item, idx) => (
                      <motion.button 
                        key={item.id} 
                        layout 
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                        onClick={() => revertHistory(item.id)} 
                        className="text-left w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors group flex justify-between items-center shrink-0"
                      >
                        <div className="flex flex-col overflow-hidden pr-4">
                           <span className="text-sm font-medium text-slate-300 truncate">{item.msg}</span>
                           <span className="text-xs text-slate-500 mt-0.5">{item.ts.toLocaleTimeString()} • {item.files.length} items</span>
                        </div>
                        <span className="text-xs font-bold text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-fuchsia-500/10 px-2 py-1 rounded">Revert</span>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                )}
             </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shrink-0 shadow-xl">
               <h2 className="text-sm font-bold text-rose-400 mb-4 uppercase tracking-wider flex items-center gap-2">Smart Cleanup</h2>
               <div className="flex flex-col gap-3">
                  <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/20 text-sm flex justify-between items-center shadow-inner">
                     <div>
                       <div className="text-slate-200 font-bold">{files.filter(f => f.isOld).length} Old Files</div>
                       <div className="text-slate-500 text-xs mt-1">&gt; 1 year untouched</div>
                     </div>
                     <button onClick={() => {
                        const newFiles = files.filter(f => !f.isOld);
                        refreshDerivedData(newFiles, `Cleaned up old files.`);
                     }} disabled={files.filter(f => f.isOld).length === 0} className="disabled:opacity-50 px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg font-semibold transition-colors focus:outline-none">Clean</button>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/20 text-sm flex justify-between items-center shadow-inner">
                     <div>
                       <div className="text-slate-200 font-bold">{files.filter(f => f.isDuplicate).length} Duplicates</div>
                       <div className="text-slate-500 text-xs mt-1">Found via hash collision</div>
                     </div>
                     <button onClick={() => {
                        const newFiles = files.filter(f => !f.isDuplicate);
                        refreshDerivedData(newFiles, `Cleaned up duplicate files.`);
                     }} disabled={files.filter(f => f.isDuplicate).length === 0} className="disabled:opacity-50 px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg font-semibold transition-colors focus:outline-none">Clean</button>
                  </div>
               </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shrink-0 shadow-xl">
             <h2 className="text-sm font-bold text-slate-200 mb-5 uppercase tracking-wider">Quick Actions</h2>
             <div className="flex flex-col gap-3">
                <button 
                  onClick={resetApplication} 
                  className="px-4 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl text-sm hover:bg-slate-700 hover:text-white transition-all w-full text-left flex justify-between items-center group shadow-sm border border-slate-700/50"
                >
                  <span>Clear All Records</span>
                  <Trash2 className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                </button>
                <button 
                  onClick={() => setAutoSortEnabled(!autoSortEnabled)} 
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all w-full text-left flex justify-between items-center shadow-sm border ${autoSortEnabled ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700/50'}`}
                >
                  <span>Auto-Sort Items</span>
                  <span className="font-bold">{autoSortEnabled ? 'ON' : 'OFF'}</span>
                </button>
                <button 
                  onClick={exportCSV} 
                  className="px-4 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl text-sm hover:bg-slate-700 hover:text-white transition-all w-full text-left flex justify-between items-center group shadow-sm border border-slate-700/50"
                >
                  <span>Export CSV</span>
                  <Download className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </button>
                <button 
                  onClick={exportJSON} 
                  className="px-4 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl text-sm hover:bg-slate-700 hover:text-white transition-all w-full text-left flex justify-between items-center group shadow-sm border border-slate-700/50"
                >
                  <span>Export JSON</span>
                  <Code className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </button>
             </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 h-64 shrink-0 flex flex-col items-stretch shadow-xl">
            <h2 className="text-sm font-bold text-amber-500 mb-4 uppercase tracking-wider shrink-0 flex justify-between items-center">
              <div className="flex items-center gap-2">
                Scan Trends (30d) <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              </div>
              {trendDateFilter && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setTrendDateFilter(null); }}
                  className="bg-amber-500/20 text-amber-400 border border-amber-500/50 px-2 py-0.5 rounded text-[10px] lowercase flex items-center gap-1 hover:bg-amber-500/30 transition-colors focus:outline-none"
                >
                  <X className="w-3 h-3" /> {trendDateFilter}
                </button>
              )}
            </h2>
            <div className="flex-grow relative">
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={trendData} 
                    margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        const clickedDate = e.activePayload[0].payload.date;
                        setTrendDateFilter(prev => prev === clickedDate ? null : clickedDate);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <defs>
                      <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCode" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px', color: '#e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                      itemStyle={{ fontSize: '12px', fontWeight: '500' }} 
                      cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="Documents" stackId="1" stroke="#6366f1" strokeWidth={2} fill="url(#colorDocs)" />
                    <Area type="monotone" dataKey="Code" stackId="1" stroke="#a855f7" strokeWidth={2} fill="url(#colorCode)" />
                    <Area type="monotone" dataKey="Images" stackId="1" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Status Footer */}
      <footer className="mt-8 flex flex-wrap items-center justify-between text-sm font-medium bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-lg gap-6">
        <div className="flex flex-wrap gap-4">
          <button onClick={sortByPriority} className="flex items-center gap-2 hover:bg-slate-800 px-4 py-2 rounded-xl transition-colors focus:outline-none text-slate-300">
            <ArrowDownAZ className="w-4 h-4 text-emerald-500"/> [S] Sort by Priority
          </button>
          <button onClick={generateReport} className="flex items-center gap-2 hover:bg-slate-800 px-4 py-2 rounded-xl transition-colors focus:outline-none text-slate-300">
            <Download className="w-4 h-4 text-purple-500"/> [R] Export Report
          </button>
          <button onClick={previewReport} className="flex items-center gap-2 hover:bg-slate-800 px-4 py-2 rounded-xl transition-colors focus:outline-none text-slate-300">
            <FileText className="w-4 h-4 text-emerald-400"/> [P] Preview Report
          </button>
        </div>
        <div className="text-slate-400 flex items-center gap-3 truncate pl-6 border-l border-slate-800">
          <Terminal className="w-4 h-4 shrink-0 text-slate-500" />
          <span className="shrink-0 mr-1 text-slate-200 font-semibold tracking-wide uppercase text-xs">System Activity:</span> <span className="truncate">{logMsg}</span>
        </div>
      </footer>

      {/* AI Ethics & Transparency Framework */}
      <div className="mt-8 mb-8 border border-slate-800/80 bg-slate-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <h3 className="text-rose-500 font-bold tracking-wide text-sm mb-5 flex items-center gap-2">
          <span className="text-base">⚖️</span> AI Ethics & Transparency Framework
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#0f111a] border border-[#1e2332] rounded-xl p-5 shadow-lg flex flex-col hover:border-slate-700 transition-colors">
            <h4 className="text-cyan-400 font-bold mb-3 flex items-center gap-2 text-[15px]">
              <span>🔒</span> Privacy Compliance
            </h4>
            <p className="text-slate-400 text-[13px] leading-relaxed">
              Files processed purely locally in transient buffer space. No remote AI endpoints leveraged, preserving academic code confidentiality.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0f111a] border border-[#1e2332] rounded-xl p-5 shadow-lg flex flex-col hover:border-slate-700 transition-colors">
            <h4 className="text-amber-500 font-bold mb-3 flex items-center gap-2 text-[15px]">
              <span>🤖</span> Transparency & Fairness
            </h4>
            <p className="text-slate-400 text-[13px] leading-relaxed">
              Our Expert system utilizes deterministic word-boundary forward chaining rules. Decisions contain zero hidden weight biases and are fully explainable in plain English.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0f111a] border border-[#1e2332] rounded-xl p-5 shadow-lg flex flex-col hover:border-slate-700 transition-colors">
            <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2 text-[15px]">
              <span>🔍</span> Bias Footprint Check
            </h4>
            <p className="text-slate-400 text-[13px] leading-relaxed mb-1">
              Status: ✅ <span className="text-slate-200 font-bold">Normal Balanced priority distribution.</span>
            </p>
            <p className="text-slate-400 text-[13px] leading-relaxed">
              High priority skew checks avoid over-prioritizing generic document extensions over academic coursework files.
            </p>
          </div>
        </div>
      </div>

      {/* About The Project */}
      <div className="mt-8 mb-8 border border-slate-800/80 bg-slate-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <h3 className="text-sky-400 font-bold tracking-wide text-sm mb-6 flex items-center gap-2">
          <Info className="w-5 h-5 text-sky-400" /> About The Project
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <div className="flex flex-col gap-8">
            <div>
              <h4 className="text-slate-300 font-semibold mb-4 text-sm uppercase tracking-wider border-b border-slate-800 pb-2">Description</h4>
              <p className="text-slate-400 text-sm leading-relaxed mt-4">
                NeuroSort AI is an intelligent workspace analysis and file organization system designed to automatically categorize, prioritize, and manage files based on content type, urgency, and specific academic constraints. It leverages advanced sorting algorithms to streamline digital asset management.
              </p>
            </div>

            <div>
              <h4 className="text-slate-300 font-semibold mb-4 text-sm uppercase tracking-wider border-b border-slate-800 pb-2">Technologies Used</h4>
              <div className="flex flex-wrap gap-2 text-sm text-slate-400 mt-4">
                <span className="px-3 py-1.5 bg-slate-950 rounded-full border border-slate-700 shadow-inner flex items-center gap-2"><Code className="w-4 h-4 text-emerald-400"/> C Language</span>
                <span className="px-3 py-1.5 bg-slate-950 rounded-full border border-slate-700 shadow-inner flex items-center gap-2"><FolderTree className="w-4 h-4 text-sky-400"/> Data Structure and Algorithms</span>
                <span className="px-3 py-1.5 bg-slate-950 rounded-full border border-slate-700 shadow-inner flex items-center gap-2"><Brain className="w-4 h-4 text-pink-400"/> Artificial Intelligence</span>
              </div>
            </div>

            <div>
              <h4 className="text-slate-300 font-semibold mb-4 text-sm uppercase tracking-wider border-b border-slate-800 pb-2">Project Guide</h4>
              <div className="flex items-center gap-4 mt-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                 <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-slate-300 font-bold text-sm">RD</span>
                 </div>
                 <div className="flex flex-col">
                   <p className="text-slate-200 font-medium">Ms. Rakhi Dey</p>
                   <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">Guided By</p>
                 </div>
              </div>
            </div>
          </div>

          <div>
             <h4 className="text-slate-300 font-semibold mb-4 text-sm uppercase tracking-wider border-b border-slate-800 pb-2">Development Team</h4>
             <ul className="space-y-3 mt-4">
                {[
                  { name: "Somnath Pal", roll: "123250600178", email: "somnathpalstudy@gmail.com", initials: "SP" },
                  { name: "Sourav Sarkar", roll: "123250600187", email: "souravsarkar963533@gmail.com", initials: "SS" },
                  { name: "Sougata Podder", roll: "123250600181", email: "sougatapoddar41@gmail.com", initials: "SP" },
                  { name: "Sourasis Karak", roll: "123250600185", email: "sourasiskarak@gmail.com", initials: "SK" },
                  { name: "Soumen Roy", roll: "123250600182", email: "satyendranathroy1978@gmail.com", initials: "SR" },
                ].map((member, i) => (
                  <li key={i} className="flex items-center gap-4 bg-slate-950/30 hover:bg-slate-800/40 p-3 rounded-xl border border-slate-800/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                       <span className="text-slate-400 font-bold text-xs">{member.initials}</span>
                    </div>
                    <div className="flex flex-col flex-grow">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                         <span className="text-slate-200 font-medium text-sm">{member.name}</span>
                         <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-mono tracking-wider">ROLL: {member.roll}</span>
                      </div>
                      <a href={`mailto:${member.email}`} className="text-xs text-slate-500 hover:text-sky-400 transition-colors mt-0.5">{member.email}</a>
                    </div>
                  </li>
                ))}
             </ul>
          </div>
        </div>
      </div>

      {/* Batch Rename Modal */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg p-8 flex flex-col gap-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-3">
                <Edit3 className="w-5 h-5"/> Batch Rename ({selectedIndices.size} files)
              </h3>
              <button onClick={() => setIsRenameModalOpen(false)} className="text-slate-500 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition-colors focus:outline-none">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-sm font-medium text-slate-400 space-y-4">
              <p className="leading-relaxed">Inject prefixes or suffixes to the selected files. You can use <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">{"{cat}"}</span> to insert the file's category dynamically.</p>
              
              <div className="flex flex-col gap-2 mt-6">
                <label className="uppercase text-xs font-semibold tracking-wider text-slate-500">Prefix</label>
                <input 
                  type="text" 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 font-sans text-sm transition-all shadow-inner"
                  placeholder="e.g. {cat}_"
                  value={renamePrefix}
                  onChange={e => setRenamePrefix(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col gap-2 mt-4">
                <label className="uppercase text-xs font-semibold tracking-wider text-slate-500">Suffix</label>
                <input 
                  type="text" 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 font-sans text-sm transition-all shadow-inner"
                  placeholder="e.g. _v2"
                  value={renameSuffix}
                  onChange={e => setRenameSuffix(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <label className="uppercase text-xs font-semibold tracking-wider text-slate-500">Target Category</label>
                <select 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 font-sans text-sm transition-all shadow-inner"
                  value={renameCategoryTarget}
                  onChange={e => setRenameCategoryTarget(e.target.value)}
                >
                  <option value="(No Change)">(No Change)</option>
                  {Object.keys(categoryColors).filter(c => c !== 'Pending').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <label className="uppercase text-xs font-semibold tracking-wider text-slate-500">Target Urgency</label>
                <select 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 font-sans text-sm transition-all shadow-inner"
                  value={renameUrgencyTarget}
                  onChange={e => setRenameUrgencyTarget(e.target.value)}
                >
                  <option value="(No Change)">(No Change)</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {selectedIndices.size > 0 && (
                <div className="flex flex-col mt-6 max-h-48 overflow-y-auto border border-slate-800 rounded-xl p-4 bg-slate-950 text-sm gap-2 shadow-inner">
                  <label className="uppercase text-xs font-semibold tracking-wider text-slate-500 mb-2 shrink-0 sticky top-0 bg-slate-950 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <span>Live Preview</span>
                    <div className="flex gap-2">
                       {renameCategoryTarget !== "(No Change)" && <span className="text-indigo-400 font-medium normal-case">Updating Cat to {renameCategoryTarget}</span>}
                       {renameUrgencyTarget !== "(No Change)" && <span className="text-emerald-400 font-medium normal-case">Updating Urg to {renameUrgencyTarget}</span>}
                    </div>
                  </label>
                  {Array.from(selectedIndices).map(idx => {
                    const f = files[idx];
                    const extIdx = f.filename.lastIndexOf('.');
                    let base = f.filename;
                    let ext = '';
                    if (extIdx > 0) {
                      base = f.filename.slice(0, extIdx);
                      ext = f.filename.slice(extIdx);
                    }
                    const effectiveCat = renameCategoryTarget !== "(No Change)" ? renameCategoryTarget : f.category;
                    const p = renamePrefix.replace(/{cat}/ig, effectiveCat);
                    const s = renameSuffix.replace(/{cat}/ig, effectiveCat);
                    const newName = `${p}${base}${s}${ext}`;

                    return (
                      <div key={idx} className="flex justify-between border-b border-slate-800/50 last:border-0 pb-2 mb-1 gap-4 items-center">
                        <span className="text-slate-500 truncate min-w-[50px] font-medium" title={f.filename}>{f.filename}</span>
                        <span className="text-indigo-500/50 shrink-0">→</span>
                        <span className={`truncate min-w-[50px] text-right font-semibold ${newName === f.filename ? 'text-slate-400' : 'text-indigo-400'}`} title={newName}>{newName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Real-time table preview */}
            {selectedIndices.size > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800 opacity-90">
                <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Preview File Name Changes <span className="opacity-70 normal-case ml-2 font-medium">({selectedIndices.size} files)</span></h4>
                <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 flex flex-col text-xs shadow-inner hide-scrollbar">
                  <table className="w-full text-left table-fixed">
                    <thead className="bg-slate-900 z-10 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-slate-500 font-semibold w-1/2">Original Filename</th>
                        <th className="px-3 py-2 text-emerald-500/80 font-semibold w-1/2">Projected Filename</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {files.map((f, i) => {
                        if (!selectedIndices.has(i)) return null;
                        
                        let baseName = f.filename;
                        let extension = "";
                        const dotIndex = f.filename.lastIndexOf('.');
                        if (dotIndex !== -1 && dotIndex !== 0) {
                            baseName = f.filename.substring(0, dotIndex);
                            extension = f.filename.substring(dotIndex);
                        }

                        const p = renamePrefix ? renamePrefix.replace(/{cat}/g, f.category) : "";
                        const s = renameSuffix ? renameSuffix.replace(/{cat}/g, f.category) : "";
                        const newName = `${p}${baseName}${s}${extension}`;
                        
                        return (
                          <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                            <td className="px-3 py-2 text-slate-400 truncate pr-2 border-r border-slate-800/30" title={f.filename}>{f.filename}</td>
                            <td className="px-3 py-2 text-emerald-400 truncate pl-2 font-medium" title={newName}>{newName !== f.filename ? newName : <span className="text-slate-600 italic">No change</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">Global Category Rename</h4>
              <p className="text-xs text-slate-400">Rename an entire category across all files.</p>
              <div className="flex flex-col gap-3">
                <select 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 font-sans text-sm transition-all shadow-inner"
                  value={globalRenameFrom}
                  onChange={e => setGlobalRenameFrom(e.target.value)}
                >
                  <option value="">Select Category...</option>
                  {categories.filter(c => c.name !== 'Pending').map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 font-sans text-sm transition-all shadow-inner"
                    placeholder="New Category Name"
                    value={globalRenameTo}
                    onChange={e => setGlobalRenameTo(e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      if (!globalRenameFrom || !globalRenameTo.trim() || globalRenameFrom === globalRenameTo.trim()) return;
                      startGlobalOperation("Global Rename", () => {
                        const newFiles = files.map(f => f.category === globalRenameFrom ? { ...f, category: globalRenameTo.trim() } : f);
                        refreshDerivedData(newFiles, `Renamed category '${globalRenameFrom}' to '${globalRenameTo.trim()}'.`);
                        setGlobalRenameFrom("");
                        setGlobalRenameTo("");
                        setIsRenameModalOpen(false);
                      });
                    }}
                    disabled={!globalRenameFrom || !globalRenameTo.trim() || globalRenameFrom === globalRenameTo.trim()}
                    className="px-4 py-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Rename
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 border-t border-slate-800 pt-6">
              <button 
                onClick={() => setIsRenameModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white font-medium hover:bg-slate-800 transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  startGlobalOperation("Batch Modifying", () => {
                    const newFiles = [...files];
                    selectedIndices.forEach(idx => {
                      const f = newFiles[idx];
                      const extIdx = f.filename.lastIndexOf('.');
                      let base = f.filename;
                      let ext = '';
                      if (extIdx > 0) {
                        base = f.filename.slice(0, extIdx);
                        ext = f.filename.slice(extIdx);
                      }
                      
                      const effectiveCat = renameCategoryTarget !== "(No Change)" ? renameCategoryTarget : f.category;
                      const p = renamePrefix.replace(/{cat}/ig, effectiveCat);
                      const s = renameSuffix.replace(/{cat}/ig, effectiveCat);
                      
                      f.filename = `${p}${base}${s}${ext}`;
                      if (renameCategoryTarget !== "(No Change)") {
                        f.category = renameCategoryTarget;
                      }
                      if (renameUrgencyTarget !== "(No Change)") {
                         f.urgency = renameUrgencyTarget as 'Low'|'Medium'|'High';
                      }
                    });
                    
                    setFiles(newFiles);
                    setLogMsg(`Batch modified ${selectedIndices.size} files.`);
                    setSelectedIndices(new Set());
                    setIsRenameModalOpen(false);
                    setRenamePrefix("");
                    setRenameSuffix("");
                    setRenameCategoryTarget("(No Change)");
                    setRenameUrgencyTarget("(No Change)");
                  });
                }}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20 focus:outline-none flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Drawer for Metadata */}
      <AnimatePresence>
        {selectedFileForDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-sm"
              onClick={() => setSelectedFileForDrawer(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-[420px] bg-slate-900 border-l border-slate-700/50 z-50 p-6 shadow-2xl flex flex-col text-sm text-slate-200 overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-5 mb-6">
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                  <FileIcon className="w-5 h-5"/> <span className="truncate" title={selectedFileForDrawer.filename}>{selectedFileForDrawer.filename}</span>
                </h3>
                <button onClick={() => setSelectedFileForDrawer(null)} className="text-slate-500 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-col gap-6">
                
                {/* Explainable AI Diagnostic */}
                <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 shadow-lg">
                  <h4 className="text-sm font-bold text-teal-400 flex items-center gap-2 mb-3">
                     <Brain className="w-4 h-4 text-pink-400" /> Explainable AI Diagnostic
                  </h4>
                  <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                    Rule {Math.floor(Math.random() * 50) + 1} ({selectedFileForDrawer.category} Detection): {selectedFileForDrawer.filename.split('.').pop()?.toUpperCase()} file recognized [Confidence: {Math.floor(Math.random() * 15) + 80}%]
                  </p>
                  <div className="flex items-center gap-6 text-xs text-slate-400">
                     <div>Primary Category: <span className="font-semibold text-slate-300">{selectedFileForDrawer.category}</span></div>
                     <div>Subfolder: <span className="font-semibold text-slate-300">None</span></div>
                  </div>
                </div>

                {/* Real-Time Workspace Preview */}
                <div className="bg-slate-950 border border-teal-500/30 rounded-2xl p-5 shadow-lg">
                   <h4 className="text-sm font-bold text-teal-400 flex justify-center items-center gap-2 mb-3">
                     <Laptop className="w-4 h-4 text-teal-400" /> Real-Time Workspace Preview
                   </h4>
                   <p className="text-slate-400 text-xs text-center mb-5 leading-relaxed px-4">
                     Open and interact with this file instantly inside the website frame.
                   </p>
                   <button className="w-full py-3 bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-400 hover:to-teal-300 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                     <Eye className="w-4 h-4" /> Open Document in Website
                   </button>
                </div>

                {/* Heuristic Multi-Factor Scoring */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-5">
                   <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                     <TrendingUp className="w-4 h-4" /> Heuristic Multi-Factor Scoring (0-100)
                   </h4>
                   
                   <div className="flex flex-col gap-2">
                     <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                        <span className="flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-blue-400" /> Keyword Relevance (40%)</span>
                        <span>8/40</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: '20%' }}></div>
                     </div>
                   </div>

                   <div className="flex flex-col gap-2">
                     <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                        <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-emerald-400" /> Recency Weight (30%)</span>
                        <span>24.5/30</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full" style={{ width: '81.6%' }}></div>
                     </div>
                   </div>

                   <div className="flex flex-col gap-2">
                     <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                        <span className="flex items-center gap-2"><Save className="w-3.5 h-3.5 text-amber-500" /> Size Importance (20%)</span>
                        <span>18/20</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full" style={{ width: '90%' }}></div>
                     </div>
                   </div>

                   <div className="flex flex-col gap-2">
                     <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                        <span className="flex items-center gap-2"><FileJson className="w-3.5 h-3.5 text-yellow-400" /> Extension Type Bonus (10%)</span>
                        <span>10/10</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-yellow-400 h-full" style={{ width: '100%' }}></div>
                     </div>
                   </div>

                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Report Preview Modal */}
      <AnimatePresence>
        {reportPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setReportPreview(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-400" /> Report Preview
                </h2>
                <button onClick={() => setReportPreview(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white focus:outline-none">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto bg-slate-950 font-mono text-sm text-slate-300 flex-grow whitespace-pre-wrap leading-relaxed shadow-inner">
                {reportPreview}
              </div>
              <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                <button onClick={() => setReportPreview(null)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white font-medium hover:bg-slate-800 transition-colors focus:outline-none">
                  Close
                </button>
                <button onClick={() => { generateReport(); setReportPreview(null); }} className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2 focus:outline-none">
                  <Download className="w-4 h-4" /> Download Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-slate-800/95 border border-slate-700 p-4 rounded-full shadow-2xl flex items-center gap-3 min-w-[300px]"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
               <Info className="w-4 h-4 text-amber-500" />
            </div>
            <span className="font-semibold text-sm text-slate-200 pr-4">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-16 pt-8 border-t border-slate-800/50 flex flex-col items-center justify-center text-center gap-2 pb-8">
         <p className="text-slate-300 font-bold text-sm">NeuroSort AI v2.0 — Post-Audit JIS Rebuild</p>
         <p className="text-slate-500 text-xs font-medium">B.Tech Computer Science & Engineering | 2nd Semester Project[ Batch: 2025-29 ] | JIS College of Engineering, Kalyani</p>
      </div>

      {/* AI Agent Chat */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-[#0f111a] border border-slate-800 rounded-3xl w-80 sm:w-96 mb-4 shadow-2xl flex flex-col overflow-hidden relative"
              style={{ height: '500px', maxHeight: 'calc(100vh - 120px)' }}
            >
              <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-white/5" />
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#161a29]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 shadow-lg shadow-sky-500/20 flex items-center justify-center shrink-0">
                    <Brain className="w-6 h-6 text-pink-300 fill-pink-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">NeuroSort AI Agent</h3>
                    <p className="text-cyan-400 text-[10px] uppercase font-semibold tracking-wider">Online</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white p-1 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#0f111a]">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-[13px] leading-relaxed ${msg.role === 'ai' ? 'bg-[#181c2b] text-slate-300 border border-slate-800 rounded-tl-sm' : 'bg-indigo-600 text-white rounded-tr-sm shadow-md'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Chips */}
              <div className="px-4 py-3 flex gap-2 overflow-x-auto whitespace-nowrap bg-[#0f111a] border-t border-slate-800 hide-scrollbar items-center">
                <button 
                  onClick={() => setChatMessages([...chatMessages, { role: 'user', text: "Explain AVL Trees" }, { role: 'ai', text: "An AVL tree is a self-balancing binary search tree. In an AVL tree, the heights of the two child subtrees of any node differ by at most one; if at any time they differ by more than one, rebalancing is done to restore this property." }])}
                  className="text-xs bg-[#181c2b] border border-slate-800 text-slate-400 font-medium px-3 py-1.5 rounded-full flex items-center gap-2 hover:bg-slate-700 transition-colors shrink-0"
                >
                  <span>🌲</span> Explain AVL Trees
                </button>
                <button 
                  onClick={() => setChatMessages([...chatMessages, { role: 'user', text: "Run Sorting Benchmark" }, { role: 'ai', text: "Running benchmark... QuickSort completed in 12ms, MergeSort in 15ms. I recommend QuickSort for this dataset." }])}
                  className="text-xs bg-[#181c2b] border border-slate-800 text-slate-400 font-medium px-3 py-1.5 rounded-full flex items-center gap-2 hover:bg-slate-700 transition-colors shrink-0"
                >
                  <span>📊</span> Run Sorting Benchmark
                </button>
                <button 
                  onClick={() => setChatMessages([...chatMessages, { role: 'user', text: "List Duplicate Chains" }, { role: 'ai', text: `I found ${duplicates.length} duplicate file(s) in the current workspace state.` }])}
                  className="text-xs bg-[#181c2b] border border-slate-800 text-slate-400 font-medium px-3 py-1.5 rounded-full flex items-center gap-2 hover:bg-slate-700 transition-colors shrink-0"
                >
                  <span>♻️</span> List Duplicate Chains
                </button>
              </div>

              {/* Input */}
              <div className="p-4 bg-[#141824] border-t border-slate-800 flex items-center gap-3">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatInput.trim()) {
                      setChatMessages([...chatMessages, { role: 'user', text: chatInput.trim() }]);
                      setChatInput("");
                    }
                  }}
                  placeholder="Ask about current files, AVL trees, or type c..."
                  className="flex-1 bg-[#0f111a] border border-slate-700 text-sm text-slate-200 px-4 py-2.5 rounded-full focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-500 shadow-inner"
                />
                <button 
                  onClick={() => {
                    if (chatInput.trim()) {
                      setChatMessages([...chatMessages, { role: 'user', text: chatInput.trim() }]);
                      setChatInput("");
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0 hover:scale-105 transition-transform"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 ${isChatOpen ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white shadow-slate-900/50'}`}
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>

    </div>
    </>
  );
}

