"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileSearch, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  User,
  Briefcase,
  Layers,
  Terminal,
  Cpu,
  Sparkles,
  ShieldCheck,
  Activity
} from "lucide-react";

const STEPS = [
  { id: "screener", icon: FileSearch, label: "Resume Screening", description: "Analyzing skills and experience" },
  { id: "scheduler", icon: Calendar, label: "Interview Scheduling", description: "Proposing optimal time slots" },
  { id: "evaluator", icon: CheckCircle2, label: "Final Evaluation", description: "Generating hiring decision" },
];

const SAMPLE_DATA = {
  jobRole: "Senior Frontend Engineer",
  resume: `John Doe - Senior Frontend Engineer
Email: john.doe@example.com | GitHub: github.com/johndoe | Portfolio: johndoe.dev

SUMMARY
A passionate Senior Frontend Engineer with over 8 years of experience building high-performance, scalable web applications. Expert in React, TypeScript, and modern CSS architectures.

EXPERIENCE

Lead Frontend Engineer | TechFlow Systems | 2020 – Present
- Orchestrated the migration of a legacy monolithic frontend to a Next.js micro-frontend architecture, reducing bundle sizes by 40%.
- Led a team of 6 engineers to deliver a real-time data visualization dashboard using WebGL and D3.js.
- Implemented a comprehensive design system using Radix UI and Tailwind CSS, increasing developer velocity by 30%.

Senior Web Developer | Creative Pulse | 2017 – 2020
- Developed a high-traffic e-commerce platform using React and Redux, handling over 1M monthly active users.
- Optimized core web vitals, improving Lighthouse performance scores from 65 to 95+.
- Mentored junior developers and conducted weekly technical workshops on React best practices.

SKILLS
Technological: React, Next.js, TypeScript, JavaScript (ES6+), HTML5, CSS3, Tailwind CSS, Framer Motion, Redux, GraphQL.
Tools: Git, Docker, Jest, Cypress, Vite, Webpack, Figma.

EDUCATION
Bachelor of Science in Computer Science | University of Technology | 2013 - 2017`,
  availability: "Weekdays 2:00 PM - 6:00 PM IST"
};

export default function RecruitmentDashboard() {
  const [resumeText, setResumeText] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [availability, setAvailability] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const loadSample = () => {
    setJobRole(SAMPLE_DATA.jobRole);
    setResumeText(SAMPLE_DATA.resume);
    setAvailability(SAMPLE_DATA.availability);
    addLog("[SYSTEM] Sample candidate payload loaded.");
  };

  const runPipeline = async () => {
    setIsProcessing(true);
    setError(null);
    setResults(null);
    setCurrentStep("screener");
    setLogs(["[SYSTEM] Initializing multi-agent workflow on Llama 3.3..."]);
    
    try {
      const response = await fetch("http://localhost:8000/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText, job_role: jobRole, availability }),
      });
      
      if (!response.ok) throw new Error("Failed to process recruitment pipeline");
      if (!response.body) throw new Error("No response body received from server");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                setError(data.error);
                addLog(`[ERROR] ${data.error}`);
                continue;
              }
              
              const stepInfo = STEPS.find(s => s.id === data.node);
              setCurrentStep(data.node);
              addLog(`[AGENT] ${stepInfo?.label || data.node} thinking...`);
              
              setResults((prev: any) => ({
                ...prev,
                ...data.output
              }));
            } catch (e) {
              console.error("Error parsing stream chunk", e);
            }
          }
        }
      }
      
      addLog("[SYSTEM] Pipeline execution completed successfully.");
    } catch (err: any) {
      setError(err.message);
      addLog(`[CRITICAL] ${err.message}`);
    } finally {
      setIsProcessing(false);
      setCurrentStep(null);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-[#050507] text-[#f0f0f2] selection:bg-blue-500/30 overflow-x-hidden font-sans">
      <div className="max-w-[1600px] mx-auto space-y-10">
        
        {/* Superior Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 border-b border-white/5 pb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                <Cpu size={36} className="glow-icon" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-4xl md:text-6xl font-black tracking-[ -0.05em] text-white uppercase italic leading-none">
                  Aegis <span className="text-blue-600 not-italic">Recruit</span>
                </h1>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] uppercase font-black text-blue-500 tracking-widest">v2.0 PRO</span>
                  <div className="h-1 w-1 bg-white/20 rounded-full" />
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Multi-Agent Talent Orchestration</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-6 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-green-500 animate-pulse" />
                <div className="space-y-0.5">
                  <div className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">System Health</div>
                  <div className="text-xs font-bold text-white uppercase tracking-widest">Operational</div>
                </div>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-blue-500" />
                <div className="space-y-0.5">
                  <div className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">Current Model</div>
                  <div className="text-xs font-bold text-white uppercase tracking-widest">Llama 3.3 70B</div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => window.open('https://smith.langchain.com', '_blank')}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 group hover:border-blue-500/50"
            >
              <Layers size={14} className="text-blue-500 group-hover:rotate-12 transition-transform" /> 
              Observability
            </button>
          </div>
        </div>

        {/* Global Grid System */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Panel: Configuration & Logs (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-premium p-1 p-0.5 rounded-[2.5rem] border border-white/5 relative group">
              <div className="bg-black/40 rounded-[2.4rem] p-8 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity translate-x-4 -translate-y-4">
                  <Sparkles size={160} />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 text-blue-400 font-black uppercase tracking-[0.2em] text-[10px]">
                    <div className="w-4 h-0.5 bg-blue-500" />
                    Candidate Ingestion
                  </div>
                  <button 
                    onClick={loadSample}
                    className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-blue-600/20 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all text-gray-400 hover:text-blue-400"
                  >
                    <Sparkles size={12} /> Load Sample
                  </button>
                </div>
                
                <div className="space-y-8 relative z-10">
                  <div className="group/input space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 group-focus-within/input:text-blue-500 transition-colors">Target Position</label>
                    <input 
                      type="text" 
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder="e.g. Principal Product Designer"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all font-bold placeholder:text-gray-800 text-sm"
                    />
                  </div>
                  
                  <div className="group/input space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 group-focus-within/input:text-blue-500 transition-colors">Resume Context (Textual)</label>
                    <textarea 
                      rows={14}
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste resume content here for immediate analysis..."
                      className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-6 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all text-sm font-bold placeholder:text-gray-800 leading-relaxed custom-scrollbar"
                    />
                  </div>

                  <div className="group/input space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 group-focus-within/input:text-blue-500 transition-colors">Availability Matrix</label>
                    <input 
                      type="text" 
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="e.g. Weekdays 09:00 - 18:00 EST"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all font-bold placeholder:text-gray-800 text-sm"
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={runPipeline}
                      disabled={isProcessing || !resumeText || !jobRole}
                      className="w-full py-6 bg-blue-600 rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-500 active:scale-[0.97] transition-all disabled:opacity-20 flex justify-center items-center gap-4 shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] group"
                    >
                      {isProcessing ? <><Loader2 className="animate-spin" size={24} /> Processing System</> : <><ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> Initialize Workflow</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Terminal Panel */}
            <div className="glass-premium rounded-[2.5rem] border border-white/5 bg-black/40 p-8 h-[250px] flex flex-col space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                  <Terminal size={16} /> Orchestration Logs
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-2 custom-scrollbar pr-4">
                {logs.length === 0 && <div className="text-gray-700 italic opacity-50">System awaiting initialization...</div>}
                {logs.map((log, i) => (
                  <div key={i} className={`flex gap-3 ${log.includes('[ERROR]') || log.includes('[CRITICAL]') ? 'text-red-500' : log.includes('[AGENT]') ? 'text-blue-400' : 'text-gray-500'}`}>
                    <span className="opacity-30 shrink-0">{i + 1}</span>
                    <span className="leading-tight">{log}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>

          {/* Right Panel: Analysis & Outcomes (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Workflow Visualizer Card */}
            <div className="glass-premium rounded-[3rem] border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-12 relative min-h-[500px] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
              
              {/* Node Display */}
              <div className="relative z-10 flex w-full justify-between items-start pt-4">
                {STEPS.map((step, idx) => {
                  const isActive = currentStep === step.id;
                  const isDone = results?.[step.id === 'screener' ? 'screening_result' : step.id === 'scheduler' ? 'schedule_proposal' : 'final_evaluation'];
                  
                  return (
                    <div key={step.id} className="relative flex flex-col items-center group flex-1">
                      <div className={`relative w-24 h-24 rounded-3xl flex items-center justify-center z-10 transition-all duration-700 border-2 ${
                        isActive 
                          ? 'bg-blue-600 border-blue-400 shadow-[0_0_50px_rgba(37,99,235,0.7)] scale-110' 
                          : (isDone 
                            ? 'bg-green-600/20 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]' 
                            : 'bg-white/5 border-white/10 group-hover:border-white/20')
                      }`}>
                        <step.icon size={36} className={`transition-all duration-500 ${isActive ? 'text-white' : (isDone ? 'text-green-500' : 'text-gray-700')}`} />
                        {isDone && !isActive && (
                          <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-green-500 border-4 border-[#050507] flex items-center justify-center">
                            <CheckCircle2 size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                      
                      {idx < STEPS.length - 1 && (
                        <div className={`absolute left-[50%] top-12 w-full h-[3px] transition-all duration-1000 ${
                          isDone 
                            ? 'bg-gradient-to-r from-green-500/50 to-white/5' 
                            : 'bg-white/5'
                        }`} />
                      )}
                      
                      <div className="mt-8 text-center space-y-2 max-w-[140px]">
                        <div className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-blue-400' : (isDone ? 'text-green-500' : 'text-gray-600')}`}>
                          {step.label}
                        </div>
                        <div className="text-[10px] text-gray-700 font-bold leading-tight uppercase tracking-tighter hidden xl:block">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Center Stage */}
              <div className="relative z-10 h-full py-12 flex flex-col justify-center items-center">
                <AnimatePresence mode="wait">
                  {!isProcessing && !results && !error && (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="text-center space-y-8"
                    >
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-blue-600/10 blur-[40px] rounded-full" />
                        <div className="relative p-12 bg-white/[0.02] border border-white/5 rounded-full">
                          <Briefcase size={96} className="text-gray-800" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-black text-gray-500 uppercase tracking-widest leading-none">Intelligence Engine Ready</h3>
                        <p className="text-gray-700 font-bold uppercase tracking-tighter text-sm max-w-sm mx-auto">Upload a candidate resume to begin automated evaluation sequences on Llama 3.3 Infrastructure.</p>
                      </div>
                    </motion.div>
                  )}

                  {isProcessing && (
                    <motion.div 
                      key="processing"
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-center space-y-10"
                    >
                      <div className="relative mx-auto w-40 h-40">
                        <div className="absolute inset-0 border-[6px] border-blue-600/10 rounded-full" />
                        <div className="absolute inset-0 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Cpu size={48} className="text-blue-500 animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="text-5xl font-black uppercase tracking-[-0.05em] italic">
                          Agent <span className="text-blue-500">{STEPS.find(s => s.id === currentStep)?.label.split(' ')[0]}</span> Active
                        </div>
                        <div className="flex items-center justify-center gap-3">
                           <span className="w-12 h-[1px] bg-blue-500/30" />
                           <p className="text-gray-600 text-xs font-black uppercase tracking-[0.3em]">Processing Logic Loop</p>
                           <span className="w-12 h-[1px] bg-blue-500/30" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div 
                      key="error"
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="text-red-400 flex flex-col items-center gap-6 bg-red-400/5 p-12 rounded-[2.5rem] border border-red-500/20 w-full"
                    >
                      <AlertCircle size={64} strokeWidth={1} />
                      <div className="text-center space-y-2">
                        <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-1">Execution Pipeline Error</h4>
                        <p className="text-sm font-bold opacity-60 uppercase tracking-tight">{error}</p>
                      </div>
                    </motion.div>
                  )}

                  {results && !isProcessing && (
                    <motion.div 
                      key="results"
                      initial={{ opacity: 0, y: 30 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="w-full space-y-12"
                    >
                      {/* Mega Final Conclusion Card */}
                      <div className="flex flex-col xl:flex-row justify-between items-center bg-white/[0.03] p-12 rounded-[3.5rem] border border-white/10 gap-10 shadow-[inner_0_0_40px_rgba(255,255,255,0.01)] relative overflow-hidden group/final">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/[0.03] to-transparent pointer-events-none" />
                        
                        <div className="space-y-4 text-center xl:text-left relative z-10">
                          <div className="flex items-center gap-3 justify-center xl:justify-start">
                             <div className="w-8 h-[2px] bg-blue-600 rounded-full" />
                             <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.4em]">Final Recommendation</span>
                          </div>
                          <div className={`text-7xl xl:text-8xl font-black italic tracking-[-0.08em] uppercase leading-none drop-shadow-2xl ${
                            results.final_evaluation?.recommendation.includes('Hire') ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {results.final_evaluation?.recommendation}
                          </div>
                        </div>
                        
                        <div className="flex gap-6 relative z-10">
                          <div className="px-10 py-8 bg-white/5 rounded-[2.5rem] text-center min-w-[160px] border border-white/5">
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Match Index</div>
                            <div className="text-5xl font-black text-blue-500 tracking-tighter">{results.screening_result?.match_score}%</div>
                          </div>
                          <div className="px-10 py-8 bg-white/5 rounded-[2.5rem] text-center min-w-[160px] border border-white/5">
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Total Tenure</div>
                            <div className="text-5xl font-black text-blue-500 tracking-tighter">{results.screening_result?.experience_years}Y</div>
                          </div>
                        </div>
                      </div>

                      {/* Info Display Grids */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                         <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400 flex items-center gap-3">
                               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Extracted Skills
                            </h4>
                            <div className="flex flex-wrap gap-2.5">
                               {results.screening_result?.skills.slice(0, 8).map((s: string) => (
                                 <span key={s} className="px-4 py-1.5 bg-white/5 text-[9px] font-black uppercase tracking-widest rounded-xl border border-white/10 text-gray-300 hover:bg-blue-600/20 hover:border-blue-500/50 transition-colors cursor-default">{s}</span>
                               ))}
                            </div>
                         </div>
                         <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 flex items-center gap-3">
                               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Interview Slots
                            </h4>
                            <div className="space-y-3">
                               {results.schedule_proposal?.proposed_slots.map((slot: string) => (
                                 <div key={slot} className="text-[10px] font-bold text-gray-500 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all">{slot}</div>
                               ))}
                            </div>
                         </div>
                         <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-400 flex items-center gap-3">
                               <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Evaluation Rationale
                            </h4>
                            <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
                              {results.final_evaluation?.justification}
                            </p>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Disclaimer / Global Footer */}
            <div className="flex justify-between items-center px-6">
               <p className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">Aegis Recruit Enterprise v2.0</p>
               <div className="flex gap-4">
                  <span className="text-[10px] font-bold text-gray-800 uppercase tracking-widest underline cursor-pointer">Security Protocol</span>
                  <span className="text-[10px] font-bold text-gray-800 uppercase tracking-widest underline cursor-pointer">Terms of Service</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
        }

        .glass-premium {
          background: rgba(255, 255, 255, 0.01);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
        }
        .glow-icon {
          filter: drop-shadow(0 0 15px rgba(37, 99, 235, 0.6));
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(37, 99, 235, 0.2);
        }
        
        input::placeholder, textarea::placeholder {
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 10px;
          opacity: 0.3;
        }
      `}</style>
    </main>
  );
}


