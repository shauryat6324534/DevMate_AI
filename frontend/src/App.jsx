import { useState, useEffect } from 'react';
import { 
  Code2, 
  Terminal, 
  Cpu, 
  BookOpen, 
  MessageSquare, 
  History, 
  Download, 
  ShieldCheck, 
  Activity, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  Layers,
  Wrench,
  Search
} from 'lucide-react';

function App() {
  const [healthStatus, setHealthStatus] = useState({ success: false, loading: true, data: null });
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedModule, setSelectedModule] = useState(null);

  const fetchHealth = async () => {
    setHealthStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (response.ok) {
        const data = await response.json();
        setHealthStatus({ success: true, loading: false, data });
      } else {
        setHealthStatus({ success: false, loading: false, data: null });
      }
    } catch (error) {
      setHealthStatus({ success: false, loading: false, data: null });
    }
  };

  useEffect(() => {
    fetchHealth();
    // Poll health status every 15 seconds
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const modules = [
    {
      id: 'nlu',
      title: 'Natural Language Understanding',
      description: 'Intent detection, language recognition, constraint extraction, and structured prompt preparation.',
      icon: Search,
      color: 'from-blue-500 to-indigo-500',
      features: ['Intent Classification', 'Language Detection', 'Constraint Extraction', 'Context Mapping']
    },
    {
      id: 'codegen',
      title: 'Code Generation',
      description: 'Transforming natural language requirements into functions, classes, and complete modules in multiple languages.',
      icon: Code2,
      color: 'from-purple-500 to-indigo-500',
      features: ['Multi-language Support', 'Function Generator', 'Class Scaffolders', 'Modular Code Snippets']
    },
    {
      id: 'explain',
      title: 'Code Explanation',
      description: 'Line-by-line code breakdowns, time/space complexity analysis, and beginner-friendly learning concepts.',
      icon: BookOpen,
      color: 'from-emerald-500 to-teal-500',
      features: ['Line-by-Line Breakdown', 'Big-O Analysis', 'Logic Workflows', 'Conceptual Explanations']
    },
    {
      id: 'debug',
      title: 'Debugging Assistant',
      description: 'Locating syntax and logical bugs, determining root causes, and generating fully corrected code solutions.',
      icon: Terminal,
      color: 'from-red-500 to-rose-500',
      features: ['Syntax Analysis', 'Runtime Log Parsing', 'Root Cause Explanation', 'Automated Code Fixes']
    },
    {
      id: 'optimize',
      title: 'Optimization Engine',
      description: 'Enhancing algorithmic efficiency, reducing memory usage, and refactoring for industry-grade best practices.',
      icon: Cpu,
      color: 'from-amber-500 to-orange-500',
      features: ['Time Complexity Refactoring', 'Memory Optimization', 'Style Guide Conformity', 'Redundancy Checks']
    },
    {
      id: 'docgen',
      title: 'Documentation Generator',
      description: 'Generating complete READMEs, inline code comments, and robust API document structures automatically.',
      icon: FileText,
      color: 'from-cyan-500 to-blue-500',
      features: ['README Auto-gen', 'JSDoc/Docstring Standard', 'API Swagger Scaffolding', 'Architecture Diagrams']
    },
    {
      id: 'review',
      title: 'Code Review System',
      description: 'Validating naming conventions, evaluating code quality index, and diagnosing code smells.',
      icon: CheckCircle,
      color: 'from-teal-500 to-emerald-500',
      features: ['Naming Convention Checks', 'Static Lint Warnings', 'Code Smell Detection', 'Refactoring Lists']
    },
    {
      id: 'learning',
      title: 'Learning Assistant',
      description: 'Custom coding exercises, customized learning paths, and tailored guidance on coding paradigms.',
      icon: Sparkles,
      color: 'from-pink-500 to-rose-500',
      features: ['Interactive Exercises', 'Topic Curations', 'Programming Paradigm Paths', 'Interactive Q&A']
    },
    {
      id: 'chat',
      title: 'Conversation System',
      description: 'Managing ongoing and persistent threads, isolating user sessions, and maintaining active context.',
      icon: MessageSquare,
      color: 'from-indigo-500 to-pink-500',
      features: ['Thread Persistence', 'Context Isolation', 'Session Management', 'Token Counters']
    },
    {
      id: 'history',
      title: 'History & Persistence',
      description: 'Ensuring usage histories, generated code logs, and past conversations are safely written and isolated.',
      icon: History,
      color: 'from-sky-500 to-blue-500',
      features: ['Activity Logs', 'Resource Persistence', 'User Isolation Rules', 'State Recoverability']
    },
    {
      id: 'download',
      title: 'Download System',
      description: 'Exporting code generated components, explanations, and reviews into structured Markdown and plain text.',
      icon: Download,
      color: 'from-blue-500 to-teal-500',
      features: ['Markdown Exports', 'Plain Text Output', 'Batch ZIP Generation', 'Custom File Naming']
    },
    {
      id: 'auth',
      title: 'Authentication & Security',
      description: 'Industry standard JWT validations, password crypts, protected routes, and API rate-limiting rules.',
      icon: ShieldCheck,
      color: 'from-green-500 to-emerald-500',
      features: ['JWT Credentials', 'Bcrypt Protection', 'Isolate Middleware', 'Access Rate Limiters']
    }
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-950/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090d16]/80 border-b border-gray-800/60 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white to-gray-400">
                DevMate <span className="text-indigo-400">AI</span>
              </span>
              <span className="block text-[10px] text-gray-500 font-mono tracking-wider uppercase">Sprint 1 Foundation</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1 bg-gray-900/60 p-1 rounded-xl border border-gray-800/40">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'overview' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              System Overview
            </button>
            <button 
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'architecture' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              Architecture Layers
            </button>
          </nav>

          {/* API Health Monitor */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchHealth}
              disabled={healthStatus.loading}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-all disabled:opacity-50"
              title="Refresh API Connection"
            >
              <RefreshCw className={`w-4 h-4 ${healthStatus.loading ? 'animate-spin' : ''}`} />
            </button>
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium font-mono ${
              healthStatus.success 
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-400' 
                : healthStatus.loading 
                  ? 'bg-yellow-950/30 border-yellow-800/60 text-yellow-400'
                  : 'bg-red-950/30 border-red-800/60 text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                healthStatus.success 
                  ? 'bg-emerald-500 animate-pulse' 
                  : healthStatus.loading 
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500 animate-pulse'
              }`}></span>
              <span>API: {healthStatus.success ? 'ONLINE' : healthStatus.loading ? 'CONNECTING...' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        
        {activeTab === 'overview' && (
          <>
            {/* Hero Summary */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-800/40 text-xs text-indigo-300 mb-6 animate-float">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modern Service-Based Architecture Active</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 font-sans">
                Elevating Developer Workflows with <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-extrabold">AI Assistance</span>
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed">
                DevMate AI provides a robust, production-grade foundation separating controller parsing, validation middleware, and specialized business logic services.
              </p>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((mod) => {
                const IconComponent = mod.icon;
                const isSelected = selectedModule?.id === mod.id;
                
                return (
                  <div 
                    key={mod.id} 
                    onClick={() => setSelectedModule(isSelected ? null : mod)}
                    className={`group relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                      isSelected 
                        ? 'bg-gray-900 border-indigo-500 shadow-lg shadow-indigo-500/5 glow-indigo' 
                        : 'bg-gray-900/40 border-gray-800/80 hover:bg-gray-900/80 hover:border-gray-700/80'
                    }`}
                  >
                    {/* Top Accent Gradient Border */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mod.color} transform origin-left transition-transform duration-300`}></div>
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${mod.color} bg-opacity-10 text-white shadow-md`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono uppercase bg-gray-800/80 px-2 py-0.5 rounded">
                        {mod.id}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                      {mod.title}
                    </h3>
                    
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                      {mod.description}
                    </p>

                    {/* Features list dropdown effect */}
                    <div className={`transition-all duration-300 overflow-hidden ${isSelected ? 'max-h-60 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="pt-4 border-t border-gray-800/80">
                        <span className="text-xs font-semibold text-gray-300 block mb-2 font-mono">Planned Capabilities:</span>
                        <div className="grid grid-cols-2 gap-2">
                          {mod.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-xs text-gray-400">
                              <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end text-xs text-indigo-400 mt-2 font-medium">
                      <span>{isSelected ? 'Collapse Details' : 'View Specifications'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ml-1 transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'architecture' && (
          <div className="max-w-4xl mx-auto bg-gray-900/30 rounded-3xl border border-gray-800 p-8 glow-indigo">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 flex items-center space-x-3">
              <Layers className="text-indigo-400 w-8 h-8" />
              <span>Service-Based Request Flow</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              DevMate AI enforces clean separations of concern. Request handling, security middleware validation, and model execution have isolated classes.
            </p>

            <div className="space-y-6">
              <div className="relative pl-8 border-l border-indigo-600/40 pb-6">
                <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 shadow-md"></div>
                <h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider font-mono mb-1">1. Routing (Route Layer)</h4>
                <p className="text-xs text-gray-400">Entry endpoint definition located in <code className="text-indigo-400">src/routes</code>. Aggregated under the index router and protected via security standards.</p>
              </div>

              <div className="relative pl-8 border-l border-indigo-600/40 pb-6">
                <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 shadow-md"></div>
                <h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider font-mono mb-1">2. Middlewares (Security & Validations)</h4>
                <p className="text-xs text-gray-400">Enforces request sanitation, rate limits, headers check, and JWT validations. Global error wrapper catches anomalies.</p>
              </div>

              <div className="relative pl-8 border-l border-indigo-600/40 pb-6">
                <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 shadow-md"></div>
                <h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider font-mono mb-1">3. Controllers (Intermediary Layer)</h4>
                <p className="text-xs text-gray-400">Strictly parses payload formatting, executes basic validation checks, and forwards to services. Under no conditions contains business operations.</p>
              </div>

              <div className="relative pl-8 border-l border-emerald-600/40 pb-6">
                <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 shadow-md"></div>
                <h4 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider font-mono mb-1">4. Services (Business & AI Operations)</h4>
                <p className="text-xs text-gray-400">Maintains core intelligence logic, processes algorithmic steps, and utilizes prompt building structures to query AI modules.</p>
              </div>

              <div className="relative pl-8">
                <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 shadow-md animate-pulse"></div>
                <h4 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider font-mono mb-1">5. AI Service & Databases (Data Output)</h4>
                <p className="text-xs text-gray-400">Handles OpenRouter integrations, failover setups, prompt builder constructs, or executes SQL operations.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer System Details */}
      <footer className="border-t border-gray-800/60 bg-gray-950/80 py-8 px-6 text-center text-xs text-gray-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <p>© 2026 DevMate AI. All rights reserved. Lying the groundwork for Sprints 2-13.</p>
          <div className="flex space-x-6">
            <span>React {healthStatus.data?.reactVersion || '19'}</span>
            <span>Vite</span>
            <span>TailwindCSS</span>
            <span>Express.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
