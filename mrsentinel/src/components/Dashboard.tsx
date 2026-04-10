import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Thermometer, 
  Activity, 
  Cpu, 
  HardDrive,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert
} from 'lucide-react';
import { MOCK_COMPONENTS, TEMPERATURE_HISTORY, THREATS, MOCK_CONFLICTS } from '../data/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { getHardwareInfo } from '../lib/hardware';

interface DashboardProps {
  onViewAll: () => void;
}

export default function Dashboard({ onViewAll }: DashboardProps) {
  const [networkInfo, setNetworkInfo] = React.useState({ speed: '2.4', type: 'WiFi', online: true });
  const [systemInfo, setSystemInfo] = React.useState({ resolution: '0x0', language: 'es-ES', timezone: 'UTC' });
  const [platform, setPlatform] = React.useState('Windows');
  const [components, setComponents] = React.useState(() => {
    const saved = localStorage.getItem('mrsentinel_components');
    return saved ? JSON.parse(saved) : MOCK_COMPONENTS;
  });
  const healthScore = 94;
  const warnings = components.filter((c: any) => c.status === 'Warning').length;

  // Sync with localStorage
  React.useEffect(() => {
    localStorage.setItem('mrsentinel_components', JSON.stringify(components));
  }, [components]);

  React.useEffect(() => {
    const info = getHardwareInfo();
    
    // Update components with real data only if not already customized/persisted
    const hasCustomGpu = components.some((c: any) => c.type === 'GPU' && c.details.includes('Optimizado'));

    setComponents(prev => prev.map(comp => {
      if (comp.type === 'GPU' && info.gpu !== 'Desconocido' && !hasCustomGpu) {
        return { ...comp, name: info.gpu, details: 'Detectado vía WebGL' };
      }
      if (comp.type === 'CPU') {
        return { ...comp, details: `${info.cpuCores} Núcleos Lógicos Detectados` };
      }
      if (comp.type === 'RAM' && info.memoryGB > 0) {
        return { ...comp, name: `${info.memoryGB}GB RAM Detectada`, details: 'Memoria de Sistema Real' };
      }
      return comp;
    }));

    // Real Network Info
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      const updateConnection = () => {
        setNetworkInfo({
          speed: conn.downlink ? conn.downlink.toFixed(1) : '0.0',
          type: conn.effectiveType || 'Desconocido',
          online: navigator.onLine
        });
      };
      updateConnection();
      conn.addEventListener('change', updateConnection);
      window.addEventListener('online', updateConnection);
      window.addEventListener('offline', updateConnection);
    }

    // Real System Info
    setSystemInfo({
      resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // Real Platform Info
    setPlatform(navigator.platform || 'Desconocido');

    // Simulate detecting threats/conflicts on load
    if (THREATS.length > 0) {
      toast.error(`¡Alerta de Seguridad! Se han detectado ${THREATS.length} amenazas en la red.`, {
        description: 'Vaya a Rendimiento para gestionarlas.',
        duration: 5000,
      });
    }
    if (MOCK_CONFLICTS.length > 0) {
      toast.warning(`Se han detectado ${MOCK_CONFLICTS.length} conflictos de software.`, {
        description: 'Revise el Escáner de Sistema para ver los pasos de solución.',
        duration: 5000,
      });
    }
  }, []);
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Vista General del Sistema</h2>
          <p className="text-gray-400 text-sm">Monitoreo real en {platform} • {systemInfo.timezone}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Último Escaneo</p>
            <p className="text-sm text-gray-300">Hoy, 12:45 PM</p>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-16 h-16 text-green-500" />
          </div>
          <p className="text-gray-500 text-xs font-medium mb-1">Protección Activa</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">Seguro</span>
            <span className="text-green-500 text-xs flex items-center font-medium">
              <ShieldCheck className="w-3 h-3 mr-0.5" /> Activo
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Escaneo en tiempo real</span>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-16 h-16 text-yellow-500" />
          </div>
          <p className="text-gray-500 text-xs font-medium mb-1">Alertas Activas</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{warnings}</span>
            <span className="text-gray-500 text-xs font-medium">Advertencias</span>
          </div>
          <p className="mt-4 text-[10px] text-yellow-500/80 font-mono uppercase tracking-wider">Acción requerida: Almacenamiento</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Thermometer className="w-16 h-16 text-red-500" />
          </div>
          <p className="text-gray-500 text-xs font-medium mb-1">Temp. CPU</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">45°C</span>
            <span className="text-blue-500 text-xs flex items-center font-medium">
              <ArrowDownRight className="w-3 h-3 mr-0.5" /> -3°C
            </span>
          </div>
          <p className="mt-4 text-[10px] text-gray-500 font-mono uppercase tracking-wider">Rango Estable</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-gray-500 text-xs font-medium mb-1">Estado de Red Real</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{networkInfo.online ? 'Online' : 'Offline'}</span>
            <span className={cn(
              "text-xs font-medium ml-1",
              networkInfo.online ? "text-green-500" : "text-red-500"
            )}>
              {networkInfo.speed} MB/s
            </span>
          </div>
          <p className="mt-4 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
            {networkInfo.type} • {systemInfo.resolution}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Temperature Chart */}
        <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-500" />
              Historial Térmico
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] text-gray-400 uppercase font-mono">CPU</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-gray-400 uppercase font-mono">GPU</span>
              </div>
            </div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TEMPERATURE_HISTORY}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#525252" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#525252" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}°`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#ef4444" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                <Area type="monotone" dataKey="gpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGpu)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Components List */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            Componentes Clave
          </h3>
          <div className="space-y-4">
            {components.slice(0, 4).map((comp) => (
              <div key={comp.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  comp.type === 'CPU' ? "bg-red-500/10 text-red-500" :
                  comp.type === 'GPU' ? "bg-blue-500/10 text-blue-500" :
                  comp.type === 'RAM' ? "bg-purple-500/10 text-purple-500" :
                  "bg-yellow-500/10 text-yellow-500"
                )}>
                  {comp.type === 'Storage' ? <HardDrive className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{comp.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono uppercase truncate">{comp.details}</p>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  comp.status === 'Healthy' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                )} />
              </div>
            ))}
          </div>
          <button 
            onClick={onViewAll}
            className="w-full mt-6 py-2.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/20 rounded-xl hover:bg-blue-500/5"
          >
            Ver Todos los Componentes
          </button>
        </div>
      </div>
    </div>
  );
}
