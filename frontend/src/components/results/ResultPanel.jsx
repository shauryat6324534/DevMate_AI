import React, { useState, useEffect } from 'react';
import Prism from 'prismjs';
import { 
  BookOpen, FileText, Cpu, CheckCircle, HelpCircle, Download, RefreshCw, AlertCircle, Copy, Check 
} from 'lucide-react';
import { ResultPanelSkeleton } from '../ui/Skeleton';

export const ResultPanel = ({ code, token }) => {
  const [activeTab, setActiveTab] = useState('explain');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Results states
  const [explainResult, setExplainResult] = useState(null);
  const [docType, setDocType] = useState('readme'); // readme, function, api, comments
  const [docResult, setDocResult] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const [optimizeResult, setOptimizeResult] = useState(null);

  // History mapping IDs for download integration
  const [historyIds, setHistoryIds] = useState({
    explanation: null,
    readme: null,
    'function-docs': null,
    'api-docs': null,
    comments: null,
    review: null,
    optimize: null
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Clear results when code resets
    setExplainResult(null);
    setDocResult(null);
    setReviewResult(null);
    setOptimizeResult(null);
    setError(null);
  }, [code]);

  useEffect(() => {
    Prism.highlightAll();
  }, [explainResult, docResult, reviewResult, optimizeResult, activeTab]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnalysis = async (tabName = activeTab) => {
    if (!code) return;
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      let bodyPayload = { code };

      if (tabName === 'explain') {
        endpoint = 'explain-code';
      } else if (tabName === 'doc') {
        // readme, function, api, comments
        if (docType === 'readme') endpoint = 'generate-readme';
        else if (docType === 'function') endpoint = 'generate-function-docs';
        else if (docType === 'api') endpoint = 'generate-api-docs';
        else if (docType === 'comments') endpoint = 'generate-comments';
      } else if (tabName === 'review') {
        endpoint = 'review-code';
      } else if (tabName === 'optimize') {
        endpoint = 'optimize-code';
      }

      const response = await fetch(`http://localhost:5000/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Analysis failed');
      }

      // Fetch user history to resolve historyId for the download endpoint
      const histResponse = await fetch('http://localhost:5000/api/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const histJson = await histResponse.json();
      
      let mappedHistoryId = null;
      if (histJson.success && histJson.data && histJson.data.length > 0) {
        // The latest history record corresponding to the current feature
        const featMap = {
          explain: 'explanation',
          readme: 'readme',
          'function-docs': 'function-docs',
          'api-docs': 'api-docs',
          comments: 'comments',
          review: 'review',
          optimize: 'optimize'
        };
        const searchFeat = tabName === 'doc' ? docType : tabName;
        const targetFeature = featMap[searchFeat] || tabName;
        const matched = histJson.data.find(h => h.featureType === targetFeature);
        if (matched) {
          mappedHistoryId = matched.id;
        }
      }

      if (tabName === 'explain') {
        setExplainResult(resJson.data);
        setHistoryIds(prev => ({ ...prev, explanation: mappedHistoryId }));
      } else if (tabName === 'doc') {
        setDocResult(resJson.data);
        const mapDocKey = docType === 'readme' ? 'readme' : docType === 'function' ? 'function-docs' : docType === 'api' ? 'api-docs' : 'comments';
        setHistoryIds(prev => ({ ...prev, [mapDocKey]: mappedHistoryId }));
      } else if (tabName === 'review') {
        setReviewResult(resJson.data);
        setHistoryIds(prev => ({ ...prev, review: mappedHistoryId }));
      } else if (tabName === 'optimize') {
        setOptimizeResult(resJson.data);
        setHistoryIds(prev => ({ ...prev, optimize: mappedHistoryId }));
      }
    } catch (err) {
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (featureTypeKey, downloadUrlEndpoint) => {
    const targetId = historyIds[featureTypeKey];
    if (!targetId) return;
    
    // Direct link to download route
    window.open(`http://localhost:5000/api/download/${downloadUrlEndpoint}?id=${targetId}&format=md&token=${token}`, '_blank');
  };

  // Run analysis when tab changes or code changes
  useEffect(() => {
    if (code) {
      const alreadyLoaded = 
        (activeTab === 'explain' && explainResult) ||
        (activeTab === 'doc' && docResult) ||
        (activeTab === 'review' && reviewResult) ||
        (activeTab === 'optimize' && optimizeResult);
      
      if (!alreadyLoaded) {
        handleAnalysis();
      }
    }
  }, [activeTab, code, docType]);

  if (!code) {
    return (
      <aside className="w-96 bg-gray-950 border-l border-gray-800/80 p-6 flex flex-col items-center justify-center text-center space-y-4 shrink-0 h-full hidden lg:flex">
        <HelpCircle className="w-12 h-12 text-gray-700 animate-bounce" />
        <h3 className="text-sm font-bold text-gray-300">Analysis Panel</h3>
        <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
          Select code blocks inside chat messages to analyze explain, review, optimize or document items.
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-96 bg-gray-950 border-l border-gray-800/80 flex flex-col justify-between shrink-0 h-full overflow-hidden hidden lg:flex">
      {/* Header Panel Tabs */}
      <div className="border-b border-gray-800/80 p-3 flex space-x-1.5 shrink-0 bg-gray-950">
        {[
          { id: 'explain', label: 'Explain', icon: BookOpen },
          { id: 'doc', label: 'Docs', icon: FileText },
          { id: 'review', label: 'Review', icon: CheckCircle },
          { id: 'optimize', label: 'Optimize', icon: Cpu }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex flex-col items-center space-y-1 transition-all ${
                isActive 
                  ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400 font-bold' 
                  : 'bg-gray-900/20 border-gray-800/40 text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main content viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <ResultPanelSkeleton />
        ) : error ? (
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/60 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* 1. EXPLAIN WORKSPACE VIEW */}
            {activeTab === 'explain' && explainResult && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">Code Breakdown</h3>
                  {historyIds.explanation && (
                    <button
                      onClick={() => triggerDownload('explanation', 'explanation')}
                      className="p-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-lg text-[9px] flex items-center space-x-1.5 transition-all"
                      title="Download Explanation"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>MD</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-mono">Purpose</span>
                  <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/60 p-3 border border-gray-800/60 rounded-xl">
                    {explainResult.purpose}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-mono">Logic Description</span>
                  <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/60 p-3 border border-gray-800/60 rounded-xl">
                    {explainResult.logic}
                  </p>
                </div>

                {explainResult.workflow && explainResult.workflow.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-mono">Step-by-step Workflow</span>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      {explainResult.workflow.map((w, wIdx) => (
                        <li key={wIdx} className="bg-gray-900/40 p-2.5 rounded-lg border border-gray-800/40 flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {explainResult.complexity && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-indigo-950/20 border border-indigo-850/60 p-3 rounded-xl">
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider font-mono block mb-1">Time Complexity</span>
                      <span className="text-xs text-indigo-300 font-mono font-bold">{explainResult.complexity.time || 'O(1)'}</span>
                    </div>
                    <div className="bg-purple-950/20 border border-purple-850/60 p-3 rounded-xl">
                      <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider font-mono block mb-1">Space Complexity</span>
                      <span className="text-xs text-purple-300 font-mono font-bold">{explainResult.complexity.space || 'O(1)'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. DOCUMENTATION WORKSPACE VIEW */}
            {activeTab === 'doc' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <select 
                    value={docType}
                    onChange={(e) => {
                      setDocType(e.target.value);
                      setDocResult(null);
                    }}
                    className="bg-gray-900 border border-gray-800 text-xs text-gray-300 rounded-xl px-2.5 py-1.5 outline-none font-bold uppercase tracking-wider"
                  >
                    <option value="readme">README.md</option>
                    <option value="function">Function Docs</option>
                    <option value="api">API Specs</option>
                    <option value="comments">Inline Comments</option>
                  </select>
                  
                  {docResult && (
                    <button
                      onClick={() => {
                        const dlMap = { readme: 'readme', function: 'function-docs', api: 'api-docs', comments: 'comments' };
                        triggerDownload(dlMap[docType], 'documentation');
                      }}
                      className="p-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-lg text-[9px] flex items-center space-x-1.5 transition-all"
                      title="Download Docs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>MD</span>
                    </button>
                  )}
                </div>

                {docResult && (
                  <div className="space-y-3 pt-2">
                    {docType === 'readme' && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-mono">Generated Overview README</span>
                        <pre className="p-3 bg-gray-950 border border-gray-800 rounded-xl overflow-x-auto text-[10px] font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {docResult.readme}
                        </pre>
                      </div>
                    )}
                    {docType === 'function' && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-mono">Parameters and Types</span>
                        <pre className="p-3 bg-gray-950 border border-gray-800 rounded-xl overflow-x-auto text-[10px] font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {docResult.functionDocs}
                        </pre>
                      </div>
                    )}
                    {docType === 'api' && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-mono">Request & Response Specs</span>
                        <pre className="p-3 bg-gray-950 border border-gray-800 rounded-xl overflow-x-auto text-[10px] font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {docResult.apiDocs}
                        </pre>
                      </div>
                    )}
                    {docType === 'comments' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-mono">Commented Code Output</span>
                          <button
                            onClick={() => handleCopy(docResult.commentedCode)}
                            className="p-1 hover:text-white text-gray-500 rounded"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="p-3 bg-gray-950 border border-gray-800 rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed"><code className="language-javascript">{docResult.commentedCode}</code></pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. CODE REVIEW REPORT WORKSPACE VIEW */}
            {activeTab === 'review' && reviewResult && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">Quality Reports</h3>
                  {historyIds.review && (
                    <button
                      onClick={() => triggerDownload('review', 'review')}
                      className="p-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-lg text-[9px] flex items-center space-x-1.5 transition-all"
                      title="Download Review Report"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>MD</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Quality', val: reviewResult.qualityScore, color: 'text-indigo-400 border-indigo-950/60' },
                    { label: 'Readability', val: reviewResult.readabilityScore, color: 'text-purple-400 border-purple-950/60' },
                    { label: 'Maintainable', val: reviewResult.maintainabilityScore, color: 'text-emerald-400 border-emerald-950/60' }
                  ].map((score, sIdx) => (
                    <div key={sIdx} className={`p-2.5 bg-gray-900 border rounded-xl text-center ${score.color}`}>
                      <span className="text-[8px] text-gray-500 font-bold block uppercase tracking-wider mb-0.5">{score.label}</span>
                      <span className="text-sm font-bold font-mono">{score.val}/100</span>
                    </div>
                  ))}
                </div>

                {reviewResult.namingConventions && reviewResult.namingConventions.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-mono block">Naming Checks</span>
                    <div className="space-y-1.5 text-xs">
                      {reviewResult.namingConventions.map((n, idx) => (
                        <div key={idx} className="bg-gray-900/60 border border-gray-800/80 p-2.5 rounded-xl flex items-start space-x-2.5">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.status === 'OK' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          <div>
                            <span className="font-bold text-gray-300 block mb-0.5">{n.variable}</span>
                            <span className="text-gray-400 block text-[10px] leading-relaxed">{n.recommendation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reviewResult.codeSmells && reviewResult.codeSmells.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-mono block">Code Smells Identified</span>
                    <div className="space-y-1.5 text-xs text-gray-300">
                      {reviewResult.codeSmells.map((s, idx) => (
                        <div key={idx} className="bg-gray-900/40 border border-gray-800/40 p-2.5 rounded-xl">
                          <span className="font-bold text-indigo-400 block text-[10px] mb-1 font-mono">{s.type} (Line {s.line})</span>
                          <span className="text-gray-400 block text-[10px] leading-relaxed">{s.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. OPTIMIZED ALTERNATIVE WORKSPACE VIEW */}
            {activeTab === 'optimize' && optimizeResult && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">Optimized Output</h3>
                  {historyIds.optimize && (
                    <button
                      onClick={() => triggerDownload('optimize', 'optimize')}
                      className="p-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-lg text-[9px] flex items-center space-x-1.5 transition-all"
                      title="Download Optimized Report"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>MD</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-mono">Optimized Code Block</span>
                    <button
                      onClick={() => handleCopy(optimizeResult.optimizedCode)}
                      className="p-1 hover:text-white text-gray-500 rounded"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="p-3 bg-gray-950 border border-gray-800 rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed"><code className="language-javascript">{optimizeResult.optimizedCode}</code></pre>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-mono block">Improvement Details</span>
                  <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/60 p-3 border border-gray-800/60 rounded-xl">
                    {optimizeResult.explanation}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer trigger manual refresh */}
      <div className="border-t border-gray-800/60 p-3 flex justify-end shrink-0 bg-gray-950">
        <button
          onClick={() => handleAnalysis()}
          disabled={loading}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Run</span>
        </button>
      </div>
    </aside>
  );
};

export default ResultPanel;
