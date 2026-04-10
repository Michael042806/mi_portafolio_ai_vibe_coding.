import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Activity, 
  Terminal, 
  FolderTree, 
  Settings,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
  { id: 'scanner', label: 'Escáner de Sistema', icon: Cpu },
  { id: 'performance', label: 'Rendimiento', icon: Activity },
  { id: 'commands', label: 'Biblioteca de Comandos', icon: Terminal },
  { id: 'files', label: 'Gestor de Archivos', icon: FolderTree },
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [batteryLevel, setBatteryLevel] = React.useState(100);
  const [isCharging, setIsCharging] = React.useState(false);
  const [dischargingTime, setDischargingTime] = React.useState<number | null>(null);
  const [timezone, setTimezone] = React.useState('UTC');

  React.useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // Real Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
          setDischargingTime(battery.dischargingTime);
        };
        
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
        battery.addEventListener('dischargingtimechange', updateBattery);
      });
    }
  }, []);

  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds === Infinity) return "Calculando...";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="w-64 bg-[#141414] border-r border-[#2a2a2a] flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 border-bottom border-[#2a2a2a]">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
          <ShieldAlert className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none tracking-tight">MRsentinel</h1>
          <p className="text-blue-500 text-[10px] font-mono tracking-widest mt-1 uppercase">Live System</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left",
                isActive 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_10px_rgba(37,99,235,0.1)]" 
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-blue-400" : "text-gray-500"
              )} />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2a2a2a]">
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className={cn("w-4 h-4", isCharging ? "text-green-500 animate-pulse" : "text-yellow-500")} />
              <span className="text-xs font-semibold text-gray-300">Batería Real</span>
            </div>
            {isCharging && <span className="text-[9px] font-bold text-green-500 uppercase">Cargando</span>}
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000",
                batteryLevel > 20 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
              )} 
              style={{ width: `${batteryLevel}%` }} 
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-gray-500 font-mono">{batteryLevel}% {isCharging ? 'Cargando' : 'Saludable'}</span>
            <span className="text-[10px] text-gray-400 font-mono">{isCharging ? '∞' : formatTime(dischargingTime)}</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between px-2">
          <button className="flex items-center gap-3 text-gray-500 hover:text-gray-300 transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-xs font-medium">Configuración</span>
          </button>
          <span className="text-[9px] text-gray-600 font-mono uppercase tracking-tighter">{timezone}</span>
        </div>
      </div>
    </div>
  );
}
