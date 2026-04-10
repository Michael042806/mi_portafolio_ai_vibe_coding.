import React from 'react';
import { 
  Activity, 
  Globe, 
  Thermometer, 
  Cpu, 
  Database, 
  HardDrive,
  ArrowUp,
  ArrowDown,
  Zap,
  ShieldAlert,
  Lock,
  Wifi,
  ShieldCheck
} from 'lucide-react';
import { MOCK_RESOURCE_APPS, NETWORK_HISTORY, THREATS } from '../data/mockData';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function PerformanceMonitor() {
  const [threats, setThreats] = React.useState(THREATS);
  const [isCleaning, setIsCleaning] = React.useState(false);
  const [realMemory, setRealMemory] = React.useState<{ used: number, total: number } | null>(null);
  const [activityLog, setActivityLog] = React.useState<{ id: string, msg: string, time: string, type: 'info' | 'warning' | 'success' }[]>([]);
  const [cpuUsage, setCpuUsage] = React.useState(12);

  const addLog = (msg: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type
    };
    setActivityLog(prev => [newLog, ...prev].slice(0, 10));
  };

  React.useEffect(() => {
    // Initial logs
    addLog("Motor de monitoreo MRsentinel iniciado", "success");
    addLog("Escaneando puertos de red locales...", "info");

    const updateMemory = () => {
      if ((performance as any).memory) {
        const mem = (performance as any).memory;
        setRealMemory({
          used: Math.round(mem.usedJSHeapSize / (1024 * 1024)),
          total: Math.round(mem.jsHeapSizeLimit / (1024 * 1024))
        });
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 2000);

    // Real event listeners for activity log
    const handleOnline = () => addLog("Conexión a Internet restaurada", "success");
    const handleOffline = () => addLog("Conexión a Internet perdida", "warning");
    const handleFocus = () => addLog("Ventana de aplicación en primer plano", "info");
    const handleBlur = () => addLog("Aplicación en segundo plano (Modo Ahorro)", "info");

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Simulate real-time CPU fluctuation based on activity
    const handleMouseMove = () => {
      setCpuUsage(prev => Math.min(45, Math.max(5, prev + (Math.random() > 0.5 ? 1 : -1))));
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleDeleteThreat = (id: string) => {
    const threat = threats.find(t => t.id === id);
    setThreats(prev => prev.filter(t => t.id !== id));
    toast.success(`Amenaza eliminada: ${threat?.name}`, {
      description: 'El sistema ha sido limpiado correctamente.',
    });
  };

  const handleCleanAll = () => {
    setIsCleaning(true);
    toast.promise(new Promise((resolve) => setTimeout(resolve, 2500)), {
      loading: 'Ejecutando limpieza profunda de virus y malware...',
      success: () => {
        setThreats([]);
        setIsCleaning(false);
        return '¡Sistema Limpio! Todas las amenazas han sido eliminadas.';
      },
      error: 'Error durante la limpieza.',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white">Analíticas de Rendimiento</h2>
            <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-bold rounded border border-green-500/20 uppercase tracking-tighter animate-pulse">Live</span>
          </div>
          <p className="text-gray-400 text-sm">Utilización de recursos reales del navegador y red</p>
        </div>
        {threats.length > 0 && (
          <button 
            onClick={handleCleanAll}
            disabled={isCleaning}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50"
          >
            <ShieldAlert className={cn("w-4 h-4", isCleaning && "animate-pulse")} />
            {isCleaning ? 'Limpiando...' : 'Eliminar Todas las Amenazas'}
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Procesos de Alto Consumo
              </h3>
              {realMemory && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-mono uppercase">Memoria JS Usada</p>
                  <p className="text-xs font-bold text-blue-400">{realMemory.used} MB / {realMemory.total} MB</p>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-[#2a2a2a]">
                    <th className="pb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nombre del Proceso</th>
                    <th className="pb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">CPU</th>
                    <th className="pb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Memoria</th>
                    <th className="pb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Red</th>
                    <th className="pb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {MOCK_RESOURCE_APPS.map((app) => (
                    <tr key={app.id} className="group hover:bg-white/5 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-bold">
                            {app.name[0]}
                          </div>
                          <span className="text-sm text-gray-200 font-medium">{app.name}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "text-xs font-mono",
                          (app.id === 'r1' ? cpuUsage : app.cpu) > 10 ? "text-yellow-500" : "text-gray-400"
                        )}>{app.id === 'r1' ? cpuUsage : app.cpu}%</span>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-mono text-gray-400">{app.memory} MB</span>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-mono text-gray-400">{app.network} Mbps</span>
                      </td>
                      <td className="py-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-500 font-bold uppercase">Ejecutando</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Tráfico de Red
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <ArrowDown className="w-3 h-3 text-green-500" />
                  <span className="text-[10px] text-gray-400 uppercase font-mono">Descarga</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowUp className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] text-gray-400 uppercase font-mono">Subida</span>
                </div>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={NETWORK_HISTORY}>
                  <defs>
                    <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                  <XAxis dataKey="time" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="download" stroke="#22c55e" fillOpacity={1} fill="url(#colorDown)" strokeWidth={2} />
                  <Area type="monotone" dataKey="upload" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Bandwidth Stats */}
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-blue-500" />
              Ancho de Banda Disponible
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Descarga Máx.</p>
                <p className="text-xl font-bold text-green-500">600 Mbps</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Subida Máx.</p>
                <p className="text-xl font-bold text-blue-500">300 Mbps</p>
              </div>
            </div>
          </section>

          {/* Threat Detection */}
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Amenazas Detectadas
            </h3>
            <div className="space-y-4">
              {threats.length > 0 ? (
                threats.map(threat => (
                  <div key={threat.id} className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl relative group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xs font-bold text-red-400 truncate pr-4">{threat.name}</h4>
                      <Lock className="w-3 h-3 text-red-500" />
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">{threat.time}</span>
                      <span className="text-red-500 font-bold uppercase">{threat.status}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteThreat(threat.id)}
                      className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl text-xs font-bold"
                    >
                      Eliminar Permanentemente
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-gray-400">¡Sistema Protegido!</p>
                  <p className="text-xs text-gray-600">No se detectaron amenazas activas.</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              Registro de Actividad Live
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {activityLog.length > 0 ? (
                activityLog.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-purple-500/30">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                      log.type === 'success' ? "bg-green-500" : 
                      log.type === 'warning' ? "bg-red-500" : "bg-blue-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 leading-relaxed">{log.msg}</p>
                      <p className="text-[9px] text-gray-600 font-mono mt-0.5">{log.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 text-xs py-10 italic">Esperando eventos del sistema...</p>
              )}
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-500" />
              Picos Térmicos
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs text-gray-400">Pico CPU Hoy</span>
                <span className="text-sm font-bold text-red-400">72°C</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs text-gray-400">Pico GPU Hoy</span>
                <span className="text-sm font-bold text-blue-400">65°C</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
