
import React, { useState } from 'react';
// Added Sparkles to the imported components from lucide-react
import { PenLine, Search, Tag, BrainCircuit, Heart, Plus, Sparkles } from 'lucide-react';
import { analyzeJournalEntry } from '../services/geminiService';

const CareJournal: React.FC = () => {
  const [entry, setEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  
  const [entries, setEntries] = useState([
    { id: '1', date: 'Oct 24, 2024', content: "Maya started walking today! She took 3 steps towards Robert. It was such an emotional moment for all of us.", author: 'Jane', mood: 'Happy' },
    { id: '2', date: 'Oct 22, 2024', content: "Robert has been working late recently. Trying to keep the stress levels low at home. Need to plan a quiet weekend.", author: 'Jane', mood: 'Tired' },
  ]);

  const handleAnalyze = async () => {
    if (!entry.trim()) return;
    setIsAnalyzing(true);
    const result = await analyzeJournalEntry(entry);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleSave = () => {
    if (!entry.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      content: entry,
      author: 'Jane',
      mood: analysis?.sentiment || 'Neutral'
    };
    setEntries([newEntry, ...entries]);
    setEntry('');
    setAnalysis(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Editor & AI Analysis */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-slate-800">
            <PenLine size={20} className="text-indigo-600" />
            <h3 className="font-bold">New Entry</h3>
          </div>
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Write about today's family highlights, concerns, or milestones..."
            className="w-full h-40 p-4 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 resize-none outline-none"
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200 transition-colors">
                <Tag size={14} /> Add Tag
              </button>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !entry.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                <BrainCircuit size={18} /> {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus size={18} /> Save Entry
              </button>
            </div>
          </div>
        </div>

        {analysis && (
          <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg transform animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={20} />
              <h4 className="font-bold">AI Care Insights</h4>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">Mood Detected</p>
                <p className="text-lg font-medium">{analysis.sentiment}</p>
              </div>
              <div>
                <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">Summary</p>
                <p className="text-sm opacity-90">{analysis.summary}</p>
              </div>
              <div className="pt-2">
                <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold mb-2">Recommendations</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.recommendations.map((rec: string, i: number) => (
                    <span key={i} className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                      {rec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Past Entries</h3>
          {entries.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">{item.author}</span>
                  <span className="text-xs text-slate-400">• {item.date}</span>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                  item.mood === 'Happy' ? 'bg-green-100 text-green-600' : 
                  item.mood === 'Tired' ? 'bg-orange-100 text-orange-600' : 
                  'bg-slate-100 text-slate-600'
                }`}>
                  {item.mood}
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar - Quick Stats */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="Search memories..." className="text-sm outline-none w-full" />
          </div>
          <h4 className="font-bold text-slate-800 mb-4">Milestone Tracker</h4>
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <div className="flex items-center gap-3 mb-2">
                <Heart size={16} className="text-rose-600" />
                <span className="text-sm font-bold text-rose-800">Maya's 1st Steps</span>
              </div>
              <p className="text-xs text-rose-600">Reached on Oct 24, 2024</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <Plus size={16} className="text-blue-600" />
                <span className="text-sm font-bold text-blue-800">Family Reunion</span>
              </div>
              <p className="text-xs text-blue-600">Coming up in 12 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareJournal;
