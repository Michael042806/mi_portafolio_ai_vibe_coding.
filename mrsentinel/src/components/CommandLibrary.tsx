import React, { useState } from 'react';
import { 
  Terminal, 
  Search, 
  Play, 
  History, 
  Copy, 
  Info,
  ChevronRight,
  Command,
  HelpCircle,
  X
} from 'lucide-react';
import { MOCK_COMMANDS } from '../data/mockData';
import { CommandInfo } from '../types';
import { cn } from '../lib/utils';

export default function CommandLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<{ cmd: string; time: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewingGuide, setViewingGuide] = useState<CommandInfo | null>(null);

  const filteredCommands = MOCK_COMMANDS.filter(cmd => {
    const matchesSearch = cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         cmd.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? cmd.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const runCommand = (cmd: string) => {
    const newHistory = [{ cmd, time: new Date().toLocaleTimeString() }, ...history].slice(0, 10);
    setHistory(newHistory);
    alert(`Ejecutando comando: ${cmd}`);
  };

  const categories = Array.from(new Set(MOCK_COMMANDS.map(c => c.category)));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Biblioteca de Comandos</h2>
          <p className="text-gray-400 text-sm">Comandos de sistema, utilidades y guías de hardware</p>
        </div>
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                selectedCategory === cat 
                  ? "bg-blue-600 border-blue-500 text-white" 
                  : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-500 hover:text-gray-300"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text"
              placeholder="Buscar comandos o guías (ej. ipconfig, RAM, particiones)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredCommands.map((cmd) => (
              <div key={cmd.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Terminal className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold font-mono">{cmd.command}</h3>
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{cmd.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cmd.detailedGuide && (
                      <button 
                        onClick={() => setViewingGuide(cmd)}
                        className="p-2 bg-purple-600/10 text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all"
                        title="Ver Guía Detallada"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => runCommand(cmd.command)}
                      className="p-2 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                      title="Ejecutar Comando"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-all">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">{cmd.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-xl p-4 border border-[#2a2a2a]">
                    <p className="text-[9px] font-bold text-gray-600 uppercase mb-2 flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3" /> Ejemplo de Uso
                    </p>
                    <code className="text-xs text-blue-400 font-mono">{cmd.usage}</code>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4 border border-[#2a2a2a]">
                    <p className="text-[9px] font-bold text-gray-600 uppercase mb-2 flex items-center gap-1.5">
                      <Info className="w-3 h-3" /> Parámetros
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{cmd.config}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 sticky top-6">
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" />
              Historial de Ejecución
            </h3>
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 group-hover:bg-blue-500 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 font-mono truncate">{item.cmd}</p>
                      <p className="text-[10px] text-gray-600 font-mono">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-xs text-gray-600 italic">No hay comandos ejecutados.</p>
              </div>
            )}
            <button 
              onClick={() => setHistory([])}
              className="w-full mt-8 py-2 text-[10px] font-bold text-gray-500 hover:text-red-400 transition-colors uppercase tracking-widest"
            >
              Limpiar Historial
            </button>
          </section>
        </div>
      </div>

      {/* Guide Modal */}
      {viewingGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-purple-500" />
                <h3 className="text-xl font-bold text-white">Guía: {viewingGuide.command}</h3>
              </div>
              <button onClick={() => setViewingGuide(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-gray-400">{viewingGuide.description}</p>
              <div className="space-y-4">
                {viewingGuide.detailedGuide?.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center shrink-0 font-bold border border-purple-500/30">
                      {i + 1}
                    </div>
                    <p className="text-gray-300">{step}</p>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-[#2a2a2a]">
                <button 
                  onClick={() => setViewingGuide(null)}
                  className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-all"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
