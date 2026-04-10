/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ComponentScanner from './components/ComponentScanner';
import PerformanceMonitor from './components/PerformanceMonitor';
import CommandLibrary from './components/CommandLibrary';
import FileManager from './components/FileManager';
import { Bell, Search, User, ExternalLink } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onViewAll={() => setActiveTab('scanner')} />;
      case 'scanner': return <ComponentScanner />;
      case 'performance': return <PerformanceMonitor />;
      case 'commands': return <CommandLibrary />;
      case 'files': return <FileManager />;
      default: return <Dashboard onViewAll={() => setActiveTab('scanner')} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-gray-200 font-sans selection:bg-blue-500/30">
      <Toaster position="top-right" expand={true} richColors theme="dark" />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar funciones, archivos o comandos..." 
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-medium transition-all border border-white/10"
              title="Abrir en otra pestaña"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden md:inline">Abrir en otra pestaña</span>
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
            </button>
            <div className="h-8 w-px bg-[#2a2a2a]" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-none">Usuario Admin</p>
                <p className="text-[10px] text-gray-500 font-mono mt-1">michaelarb11@gmail.com</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center border border-white/10 shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>

        {/* Footer Status Bar */}
        <footer className="h-8 bg-[#141414] border-t border-[#2a2a2a] px-8 flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>MRsentinel Protegido</span>
            </div>
            <div className="flex items-center gap-2">
              <span>CPU: 12%</span>
            </div>
            <div className="flex items-center gap-2">
              <span>RAM: 15.4 GB / 64 GB</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span>Uptime: 14d 02h 45m</span>
            <span>v3.0.0-PRO</span>
          </div>
        </footer>
      </main>
    </div>
  );
}


