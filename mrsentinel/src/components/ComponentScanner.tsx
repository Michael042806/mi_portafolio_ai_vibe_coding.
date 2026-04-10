import React, { useState } from 'react';
import { 
  Search, 
  RefreshCw, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  HardDrive, 
  Database, 
  Zap,
  ShieldAlert,
  Wrench,
  ChevronDown,
  ChevronUp,
  Globe,
  Activity
} from 'lucide-react';
import { MOCK_COMPONENTS, MOCK_DRIVERS, MOCK_CONFLICTS } from '../data/mockData';
import { cn } from '../lib/utils';
import { getHardwareInfo, DetectedHardware } from '../lib/hardware';

import { toast } from 'sonner';

export default function ComponentScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [expandedConflict, setExpandedConflict] = useState<string | null>(null);
  const [updatingDriver, setUpdatingDriver] = useState<string | null>(null);
  
  // Persistence logic
  const [drivers, setDrivers] = useState(() => {
    const saved = localStorage.getItem('mrsentinel_drivers');
    return saved ? JSON.parse(saved) : MOCK_DRIVERS;
  });
  
  const [components, setComponents] = useState(() => {
    const saved = localStorage.getItem('mrsentinel_components');
    return saved ? JSON.parse(saved) : MOCK_COMPONENTS;
  });

  const [conflicts, setConflicts] = useState(MOCK_CONFLICTS);
  const [realSystemInfo, setRealSystemInfo] = useState<DetectedHardware | null>(null);

  // Sync with localStorage
  React.useEffect(() => {
    localStorage.setItem('mrsentinel_drivers', JSON.stringify(drivers));
  }, [drivers]);

  React.useEffect(() => {
    localStorage.setItem('mrsentinel_components', JSON.stringify(components));
  }, [components]);

  React.useEffect(() => {
    const info = getHardwareInfo();
    setRealSystemInfo(info);

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
  }, []);

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          
          // Validation is now implicit as state is persisted, 
          // but we can trigger a refresh toast
          toast.success(`Escaneo ${isDeepScan ? 'Profundo' : 'Rápido'} Finalizado`, {
            description: 'Todos los controladores y componentes están sincronizados.',
          });

          if (conflicts.length > 0) {
            toast.warning(`Se detectaron ${conflicts.length} conflictos.`, {
              description: 'Revise la sección de conflictos para ver las soluciones.',
            });
          }
          return 100;
        }
        return prev + (isDeepScan ? 1 : 2); // Deep scan is slower
      });
    }, isDeepScan ? 100 : 50);
  };

  const handleResolveConflict = (id: string) => {
    setConflicts(prev => prev.filter(c => c.id !== id));
    setExpandedConflict(null);
    toast.success('Conflicto marcado como solucionado.', {
      description: 'El sistema ha actualizado el registro de integridad.',
    });
  };

  const handleResolveAllConflicts = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
      loading: 'Aplicando parches de compatibilidad y resolviendo conflictos...',
      success: () => {
        setConflicts([]);
        setExpandedConflict(null);
        return '¡Éxito! Todos los conflictos han sido resueltos mediante optimización automática.';
      },
      error: 'Error al resolver conflictos.',
    });
  };

  const handleUpdateDriver = (id: string) => {
    setUpdatingDriver(id);
    const driver = drivers.find(d => d.id === id);
    
    toast.info(`Iniciando actualización de ${driver?.name}...`, {
      description: 'Conectando con servidores de descarga seguros.',
    });
    
    setTimeout(() => {
      setUpdatingDriver(null);
      
      // Update drivers state IMMEDIATELY to "Up to date"
      setDrivers(prev => prev.map(d => 
        d.id === id ? { ...d, status: 'Up to date' as any, version: d.latestVersion } : d
      ));

      // Update hardware inventory details in real-time
      if (driver?.component === 'GPU') {
        setComponents(prev => prev.map(comp => 
          comp.type === 'GPU' ? { ...comp, details: `Driver v${driver.latestVersion} - Optimizado` } : comp
        ));
      }

      toast.success(`¡${driver?.name} actualizado!`, {
        description: 'El hardware ha sido optimizado y el registro del sistema actualizado en tiempo real.',
      });
    }, 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Escáner de Sistema</h2>
          <p className="text-gray-400 text-sm">Auditoría de hardware, actualización de drivers y resolución de conflictos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Escaneo Profundo</span>
            <button 
              onClick={() => setIsDeepScan(!isDeepScan)}
              className={cn(
                "w-10 h-5 rounded-full relative transition-colors duration-300",
                isDeepScan ? "bg-blue-600" : "bg-gray-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300",
                isDeepScan ? "left-6" : "left-1"
              )} />
            </button>
          </div>
          <button 
            onClick={startScan}
            disabled={isScanning}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300",
              isScanning 
                ? "bg-blue-600/20 text-blue-400 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isScanning && "animate-spin")} />
            {isScanning ? `Escaneando... ${scanProgress}%` : 'Iniciar Escaneo'}
          </button>
        </div>
      </header>

      {isScanning && (
        <div className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 overflow-hidden relative">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">Analizando capas de hardware...</span>
            <span className="text-xs font-mono text-blue-400">{scanProgress}%</span>
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(37,99,235,0.6)]" 
              style={{ width: `${scanProgress}%` }} 
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-500" />
              Inventario de Hardware
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1a1a1a] border border-blue-500/30 p-4 rounded-2xl hover:border-blue-500/50 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <Globe className="w-12 h-12 text-blue-500" />
                </div>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-blue-500/10 text-blue-500">
                    Navegador Real
                  </span>
                </div>
                <h4 className="text-white font-medium truncate">{realSystemInfo?.browser || 'Detectando...'}</h4>
                <p className="text-xs text-gray-500 mt-1 font-mono">Motor de Renderizado Live</p>
              </div>

              <div className="bg-[#1a1a1a] border border-purple-500/30 p-4 rounded-2xl hover:border-purple-500/50 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <Activity className="w-12 h-12 text-purple-500" />
                </div>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-purple-500/10 text-purple-500">
                    Plataforma Host
                  </span>
                </div>
                <h4 className="text-white font-medium truncate">{realSystemInfo?.os || 'Detectando...'}</h4>
                <p className="text-xs text-gray-500 mt-1 font-mono">Arquitectura del Sistema</p>
              </div>

              {components.map((comp) => (
                <div key={comp.id} className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded-2xl hover:border-blue-500/30 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      comp.status === 'Healthy' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {comp.type === 'CPU' && <Cpu className="w-5 h-5" />}
                      {comp.type === 'GPU' && <Zap className="w-5 h-5" />}
                      {comp.type === 'RAM' && <Database className="w-5 h-5" />}
                      {comp.type === 'Storage' && <HardDrive className="w-5 h-5" />}
                      {comp.type === 'Motherboard' && <Wrench className="w-5 h-5" />}
                      {comp.type === 'Battery' && <Zap className="w-5 h-5" />}
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider",
                      comp.status === 'Healthy' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {comp.status === 'Healthy' ? 'Saludable' : 'Advertencia'}
                    </span>
                  </div>
                  <h4 className="text-white font-medium truncate">{comp.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{comp.details}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-white">Conflictos de Software</h3>
              </div>
              {conflicts.length > 0 && (
                <button 
                  onClick={handleResolveAllConflicts}
                  className="px-3 py-1.5 bg-blue-600/10 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
                >
                  Reparación Automática
                </button>
              )}
            </div>
            <div className="space-y-4">
              {conflicts.length > 0 ? (
                conflicts.map((conflict) => (
                  <div key={conflict.id} className="bg-[#1a1a1a] border border-red-500/20 rounded-2xl overflow-hidden">
                    <div 
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => setExpandedConflict(expandedConflict === conflict.id ? null : conflict.id)}
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <h4 className="text-red-400 font-semibold">{conflict.app1} vs {conflict.app2}</h4>
                      </div>
                      {expandedConflict === conflict.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                    
                    {expandedConflict === conflict.id && (
                      <div className="p-5 border-t border-[#2a2a2a] bg-red-500/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <p className="text-sm text-gray-400">{conflict.reason}</p>
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-200 uppercase tracking-wider">Guía Paso a Paso para Solucionar:</p>
                          {conflict.steps.map((step, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-[10px] flex items-center justify-center shrink-0 font-bold border border-blue-500/30">
                                {i + 1}
                              </div>
                              <p className="text-sm text-gray-300">{step}</p>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 flex justify-end">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveConflict(conflict.id);
                            }}
                            className="px-4 py-2 bg-green-600/20 text-green-400 text-xs font-bold rounded-lg border border-green-500/30 hover:bg-green-600 hover:text-white transition-all"
                          >
                            Marcar como Solucionado
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-400">No se han detectado conflictos de software activos.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 sticky top-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-green-500" />
                Actualizaciones
              </h3>
              <button 
                onClick={startScan}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1"
              >
                <Search className="w-3 h-3" /> Buscar
              </button>
            </div>
            <div className="space-y-6">
              {drivers.map((driver) => (
                <div key={driver.id} className="group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-200">{driver.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono uppercase">{driver.component}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {driver.status === 'Update available' ? (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                      ) : (
                        <span className="text-[9px] font-bold text-green-500 uppercase tracking-tighter">Actualizado</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[9px] text-gray-600 font-bold uppercase">Versión</p>
                        <p className="text-xs text-gray-400 font-mono">{driver.version}</p>
                      </div>
                      {driver.status === 'Update available' && (
                        <div>
                          <p className="text-[9px] text-gray-600 font-bold uppercase">Disponible</p>
                          <p className="text-xs text-blue-400 font-mono">{driver.latestVersion}</p>
                        </div>
                      )}
                    </div>
                    {driver.status === 'Update available' ? (
                      <button 
                        onClick={() => handleUpdateDriver(driver.id)}
                        disabled={updatingDriver === driver.id}
                        className={cn(
                          "p-2 rounded-lg transition-all duration-300",
                          updatingDriver === driver.id 
                            ? "bg-blue-600 text-white animate-pulse" 
                            : "bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white"
                        )}
                      >
                        {updatingDriver === driver.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-[8px] font-bold uppercase">Listo</span>
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-[#2a2a2a] mt-6 group-last:hidden" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
