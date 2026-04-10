import React, { useState, useCallback, useRef } from 'react';
import { 
  HardDrive, 
  FolderDown, 
  Play, 
  Pause, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Folder,
  ShieldAlert,
  RefreshCw,
  XCircle,
  Settings,
  Activity,
  Database,
  Filter,
  Clock,
  Video,
  Copy,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogEntry {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

interface Stats {
  totalFiles: number;
  copiedFiles: number;
  failedFiles: number;
  duplicateFiles: number;
  videoFiles: number;
  currentFile: string;
}

export default function App() {
  const [isInIframe, setIsInIframe] = useState(false);

  React.useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  const [sourceHandle, setSourceHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [sourceSize, setSourceSize] = useState<number | null>(null);
  const [isCalculatingSize, setIsCalculatingSize] = useState(false);
  const [isPickerActive, setIsPickerActive] = useState(false);
  const [destHandle, setDestHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [includeExtensions, setIncludeExtensions] = useState('');
  const [excludeExtensions, setExcludeExtensions] = useState('');
  const [detectDuplicates, setDetectDuplicates] = useState(false);
  const [skipExisting, setSkipExisting] = useState(true);
  const [smartSync, setSmartSync] = useState(false);
  const [renameSequentially, setRenameSequentially] = useState(false);
  const [separateVideos, setSeparateVideos] = useState(false);
  const [fastMode, setFastMode] = useState(false);
  const [isScanningDest, setIsScanningDest] = useState(false);
  const [omitSystemFolders, setOmitSystemFolders] = useState(true);
  const [showMaintenanceGuide, setShowMaintenanceGuide] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    copiedFiles: 0,
    failedFiles: 0,
    duplicateFiles: 0,
    videoFiles: 0,
    currentFile: ''
  });
  
  const renameCounter = useRef(1);
  const stopRequested = useRef(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const fileHashes = useRef<Set<string>>(new Set());
  const duplicatesFolderHandle = useRef<FileSystemDirectoryHandle | null>(null);
  const videosFolderHandle = useRef<FileSystemDirectoryHandle | null>(null);

  const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp'];

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [
      {
        id: Math.random().toString(36).substring(7),
        message,
        type,
        timestamp: new Date()
      },
      ...prev.slice(0, 99) // Keep last 100 logs
    ]);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateFolderSize = async (directory: FileSystemDirectoryHandle): Promise<number> => {
    let size = 0;
    try {
      const entries = (directory as any).values();
      for await (const entry of entries) {
        if (entry.kind === 'file') {
          try {
            const file = await entry.getFile();
            size += file.size;
          } catch (e) {
            // Skip unreadable files
          }
        } else if (entry.kind === 'directory') {
          size += await calculateFolderSize(entry);
        }
      }
    } catch (e) {
      // Skip unreadable directories
    }
    return size;
  };

  const selectSource = async () => {
    if (isPickerActive) return;
    setIsPickerActive(true);
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'read'
      });
      setIsPickerActive(false);
      setSourceHandle(handle);
      addLog(`Origen seleccionado: ${handle.name}`, 'success');
      
      // Start calculating size
      setIsCalculatingSize(true);
      setSourceSize(null);
      addLog('Calculando tamaño del origen...', 'info');
      
      const size = await calculateFolderSize(handle);
      setSourceSize(size);
      setIsCalculatingSize(false);
      addLog(`Tamaño total calculado: ${formatSize(size)}`, 'info');
    } catch (err) {
      setIsPickerActive(false);
      if ((err as Error).name !== 'AbortError') {
        addLog(`Error al seleccionar origen: ${(err as Error).message}`, 'error');
      }
      setIsCalculatingSize(false);
    }
  };

  const selectDestination = async () => {
    if (isPickerActive) return;
    setIsPickerActive(true);
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      setIsPickerActive(false);
      setDestHandle(handle);
      addLog(`Destino seleccionado: ${handle.name}`, 'success');
    } catch (err) {
      setIsPickerActive(false);
      if ((err as Error).name !== 'AbortError') {
        addLog(`Error al seleccionar destino: ${(err as Error).message}`, 'error');
      }
    }
  };

  const calculateHash = async (file: File): Promise<string | null> => {
    try {
      // For very large files, hashing the entire content might crash the browser.
      // We'll hash the first 1MB, the middle 1MB, and the last 1MB + size to get a "good enough" unique signature.
      // This is much faster and safer for a data rescue tool.
      const CHUNK_SIZE = 1024 * 1024; // 1MB
      let dataToHash: ArrayBuffer;

      if (file.size <= CHUNK_SIZE * 3) {
        dataToHash = await file.arrayBuffer();
      } else {
        const firstChunk = await file.slice(0, CHUNK_SIZE).arrayBuffer();
        const midStart = Math.floor(file.size / 2) - Math.floor(CHUNK_SIZE / 2);
        const midChunk = await file.slice(midStart, midStart + CHUNK_SIZE).arrayBuffer();
        const lastChunk = await file.slice(file.size - CHUNK_SIZE).arrayBuffer();
        
        // Combine chunks + size string
        const sizeInfo = new TextEncoder().encode(`size:${file.size}`);
        const combined = new Uint8Array(firstChunk.byteLength + midChunk.byteLength + lastChunk.byteLength + sizeInfo.byteLength);
        combined.set(new Uint8Array(firstChunk), 0);
        combined.set(new Uint8Array(midChunk), firstChunk.byteLength);
        combined.set(new Uint8Array(lastChunk), firstChunk.byteLength + midChunk.byteLength);
        combined.set(sizeInfo, firstChunk.byteLength + midChunk.byteLength + lastChunk.byteLength);
        dataToHash = combined.buffer;
      }

      const hashBuffer = await crypto.subtle.digest('SHA-256', dataToHash);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      return null;
    }
  };

  const copyFile = async (fileHandle: FileSystemFileHandle, destDirHandle: FileSystemDirectoryHandle) => {
    try {
      setStats(prev => ({ ...prev, currentFile: fileHandle.name }));
      
      const file = await fileHandle.getFile();
      let targetDir = destDirHandle;
      let isDuplicate = false;
      let isVideo = false;

      const parts = fileHandle.name.split('.');
      const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';

      if (separateVideos && VIDEO_EXTENSIONS.includes(ext)) {
        isVideo = true;
        if (videosFolderHandle.current) {
          targetDir = videosFolderHandle.current;
        }
      }

      if (detectDuplicates || smartSync) {
        const hash = await calculateHash(file);
        if (hash) {
          if (fileHashes.current.has(hash)) {
            if (smartSync) {
              addLog(`Omitido (contenido ya existe en destino): ${fileHandle.name}`, 'info');
              setStats(prev => ({ ...prev, copiedFiles: prev.copiedFiles + 1 }));
              return true;
            }
            isDuplicate = true;
            if (duplicatesFolderHandle.current) {
              targetDir = duplicatesFolderHandle.current;
            }
          } else {
            fileHashes.current.add(hash);
          }
        }
      }

      if (skipExisting && !isDuplicate) {
        try {
          await targetDir.getFileHandle(fileHandle.name, { create: false });
          addLog(`Omitido (ya existe): ${fileHandle.name}`, 'info');
          setStats(prev => ({ ...prev, copiedFiles: prev.copiedFiles + 1 }));
          return true;
        } catch (e) {
          // File doesn't exist, proceed with copy
        }
      }

      let fileName = isDuplicate ? `${Date.now()}_${fileHandle.name}` : fileHandle.name;
      
      if (renameSequentially && !isDuplicate) {
        const parts = fileHandle.name.split('.');
        const ext = parts.length > 1 ? `.${parts.pop()}` : '';
        fileName = `${renameCounter.current}${ext}`;
        renameCounter.current++;
      }

      const newFileHandle = await targetDir.getFileHandle(fileName, { create: true });
      const writable = await (newFileHandle as any).createWritable();
      
      await writable.write(file);
      await writable.close();
      
      if (isDuplicate) {
        setStats(prev => ({ ...prev, duplicateFiles: prev.duplicateFiles + 1 }));
        addLog(`Duplicado detectado: ${fileHandle.name} -> Carpeta Duplicados`, 'info');
      } else if (isVideo) {
        setStats(prev => ({ ...prev, videoFiles: prev.videoFiles + 1, copiedFiles: prev.copiedFiles + 1 }));
        addLog(`Video detectado: ${fileHandle.name} -> Carpeta Videos`, 'info');
      } else {
        setStats(prev => ({ ...prev, copiedFiles: prev.copiedFiles + 1 }));
      }
      return true;
    } catch (err) {
      const errorMsg = (err as Error).message;
      const isStateError = errorMsg.includes('state cached') || errorMsg.includes('state had changed');
      addLog(`${isStateError ? 'Error de lectura (Estado):' : 'Error copiando'} "${fileHandle.name}": ${errorMsg}`, 'error');
      setStats(prev => ({ ...prev, failedFiles: prev.failedFiles + 1 }));
      return false;
    }
  };

  const shouldProcessFile = (fileName: string) => {
    if (omitSystemFolders && (fileName.startsWith('.') || fileName.startsWith('$'))) {
      return false;
    }

    const parts = fileName.split('.');
    if (parts.length === 1) return true; // No extension
    const ext = parts.pop()?.toLowerCase() || '';
    
    const includeList = includeExtensions.split(',').map(e => e.trim().toLowerCase().replace('.', '')).filter(e => e !== '');
    const excludeList = excludeExtensions.split(',').map(e => e.trim().toLowerCase().replace('.', '')).filter(e => e !== '');

    if (includeList.length > 0 && !includeList.includes(ext)) {
      return false;
    }

    if (excludeList.length > 0 && excludeList.includes(ext)) {
      return false;
    }

    return true;
  };

  const shouldProcessDirectory = (dirName: string) => {
    if (omitSystemFolders && (dirName.startsWith('.') || dirName.startsWith('$'))) {
      return false;
    }
    if (dirName === 'Archivos_Duplicados' || dirName === 'Videos_Recuperados') {
      return false;
    }
    return true;
  };

  const processDirectory = async (source: FileSystemDirectoryHandle, dest: FileSystemDirectoryHandle) => {
    if (stopRequested.current) return;

    try {
      // Use any to bypass linter for .values() which might not be in standard types yet
      const entries = (source as any).values();
      for await (const entry of entries) {
        if (stopRequested.current) break;

        try {
          if (entry.kind === 'file') {
            if (shouldProcessFile(entry.name)) {
              await copyFile(entry, dest);
            }
          } else if (entry.kind === 'directory') {
            if (shouldProcessDirectory(entry.name)) {
              try {
                const newDestDir = await dest.getDirectoryHandle(entry.name, { create: true });
                await processDirectory(entry, newDestDir);
              } catch (err) {
                addLog(`No se pudo acceder/crear carpeta "${entry.name}": ${(err as Error).message}`, 'error');
              }
            }
          }
        } catch (innerErr) {
          addLog(`Error procesando entrada "${entry.name}": ${(innerErr as Error).message}`, 'error');
        }
      }
    } catch (outerErr) {
      addLog(`Error recorriendo directorio "${source.name}": ${(outerErr as Error).message}`, 'error');
    }
  };

  const countFiles = async (directory: FileSystemDirectoryHandle): Promise<number> => {
    let count = 0;
    try {
      const entries = (directory as any).values();
      for await (const entry of entries) {
        if (stopRequested.current) break;
        if (entry.kind === 'file') {
          if (shouldProcessFile(entry.name)) {
            count++;
          }
        } else if (entry.kind === 'directory') {
          if (shouldProcessDirectory(entry.name)) {
            count += await countFiles(entry);
          }
        }
      }
    } catch (err) {
      // Skip directories that can't be counted
    }
    return count;
  };

  const collectFiles = async (directory: FileSystemDirectoryHandle, dest: FileSystemDirectoryHandle, list: {handle: FileSystemFileHandle, dest: FileSystemDirectoryHandle, date: number}[] = []) => {
    if (stopRequested.current) return list;
    try {
      const entries = (directory as any).values();
      for await (const entry of entries) {
        if (stopRequested.current) break;
        if (entry.kind === 'file') {
          if (shouldProcessFile(entry.name)) {
            const file = await entry.getFile();
            list.push({ handle: entry, dest, date: file.lastModified });
          }
        } else if (entry.kind === 'directory') {
          if (shouldProcessDirectory(entry.name)) {
            try {
              const newDestDir = await dest.getDirectoryHandle(entry.name, { create: true });
              await collectFiles(entry, newDestDir, list);
            } catch (err) {
              addLog(`No se pudo acceder/crear carpeta "${entry.name}": ${(err as Error).message}`, 'error');
            }
          }
        }
      }
    } catch (err) {
      addLog(`Error recorriendo directorio "${directory.name}": ${(err as Error).message}`, 'error');
    }
    return list;
  };

  const scanDestinationHashes = async (directory: FileSystemDirectoryHandle) => {
    if (stopRequested.current) return;
    try {
      const entries = (directory as any).values();
      for await (const entry of entries) {
        if (stopRequested.current) break;
        if (entry.kind === 'file') {
          try {
            const file = await entry.getFile();
            const hash = await calculateHash(file);
            if (hash) {
              fileHashes.current.add(hash);
            }
          } catch (e) {
            // Skip unreadable files in destination
          }
        } else if (entry.kind === 'directory') {
          // Skip the duplicates folder if it exists
          if (entry.name !== 'Archivos_Duplicados' && entry.name !== 'Videos_Recuperados') {
            await scanDestinationHashes(entry);
          }
        }
      }
    } catch (e) {
      // Error scanning directory
    }
  };

  const startRecovery = async () => {
    if (!sourceHandle || !destHandle) return;

    setIsProcessing(true);
    stopRequested.current = false;
    fileHashes.current = new Set();
    duplicatesFolderHandle.current = null;
    videosFolderHandle.current = null;
    renameCounter.current = 1;
    setStats({ totalFiles: 0, copiedFiles: 0, failedFiles: 0, duplicateFiles: 0, videoFiles: 0, currentFile: '' });
    
    try {
      if (smartSync) {
        setIsScanningDest(true);
        addLog('Sincronización Inteligente: Analizando archivos existentes en el destino...', 'info');
        await scanDestinationHashes(destHandle);
        setIsScanningDest(false);
        addLog(`Análisis de destino completado. Se encontraron ${fileHashes.current.size} firmas únicas.`, 'success');
      }

      if (detectDuplicates) {
        duplicatesFolderHandle.current = await destHandle.getDirectoryHandle('Archivos_Duplicados', { create: true });
        addLog('Carpeta de duplicados creada/verificada.', 'info');
      }

      if (separateVideos) {
        videosFolderHandle.current = await destHandle.getDirectoryHandle('Videos_Recuperados', { create: true });
        addLog('Carpeta de videos creada/verificada.', 'info');
      }

      if (renameSequentially) {
        addLog('Analizando y ordenando archivos por fecha...', 'info');
        const files = await collectFiles(sourceHandle, destHandle);
        files.sort((a, b) => a.date - b.date);
        
        setStats(prev => ({ ...prev, totalFiles: files.length }));
        addLog(`Se encontraron ${files.length} archivos. Iniciando renombrado secuencial...`, 'info');
        
        for (const file of files) {
          if (stopRequested.current) break;
          await copyFile(file.handle, file.dest);
        }
      } else {
        if (!fastMode) {
          addLog('Analizando archivos para calcular progreso...', 'info');
          const total = await countFiles(sourceHandle);
          setStats(prev => ({ ...prev, totalFiles: total }));
          addLog(`Se encontraron ${total} archivos para procesar.`, 'info');
        } else {
          addLog('Modo Rápido: Iniciando sin conteo previo para reducir estrés en el disco.', 'info');
        }
        
        addLog('Iniciando proceso de extracción...', 'warning');
        await processDirectory(sourceHandle, destHandle);
      }
      
      if (stopRequested.current) {
        addLog('Proceso detenido por el usuario.', 'warning');
      } else {
        addLog('--- RESUMEN FINAL ---', 'success');
        addLog(`Archivos procesados: ${stats.copiedFiles + stats.failedFiles + stats.duplicateFiles}`, 'info');
        addLog(`Copiados con éxito: ${stats.copiedFiles}`, 'success');
        if (smartSync) {
          addLog('Sincronización Inteligente: Se omitieron archivos ya presentes en el destino.', 'info');
        }
        if (separateVideos) {
          addLog(`Videos separados: ${stats.videoFiles}`, 'info');
        }
        addLog(`Duplicados separados: ${stats.duplicateFiles}`, 'info');
        addLog(`Fallidos: ${stats.failedFiles}`, stats.failedFiles > 0 ? 'error' : 'info');
        addLog('Proceso de extracción completado.', 'success');
        setShowMaintenanceGuide(true);
      }
    } catch (err) {
      addLog(`Error crítico durante el proceso: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
      setStats(prev => ({ ...prev, currentFile: '' }));
    }
  };

  const stopRecovery = () => {
    stopRequested.current = true;
    addLog('Solicitando detención...', 'info');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-600/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-emerald-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Iframe Warning */}
        <AnimatePresence>
          {isInIframe && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center gap-4 backdrop-blur-md"
            >
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-100 font-semibold">Modo de Seguridad Activo</p>
                <p className="text-xs text-blue-300/70">Para acceder a tus discos físicos, abre la app en una pestaña independiente.</p>
              </div>
              <a 
                href={process.env.APP_URL || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-900/40"
              >
                Abrir App
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <motion.div 
                animate={isProcessing ? { rotate: 360 } : {}}
                transition={isProcessing ? { duration: 4, repeat: Infinity, ease: "linear" } : {}}
                className="p-3 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl shadow-blue-900/20"
              >
                <ShieldAlert className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                  MRDataRescue <span className="text-blue-500">Pro</span>
                </h1>
                <p className="text-slate-500 text-sm font-medium">Sistemas de Recuperación de Datos de Alta Precisión</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {isProcessing ? 'Procesando' : 'Listo'}
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Connection & Action */}
          <div className="xl:col-span-4 space-y-6">
            <section className="glass-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-500" />
                  Conexión
                </h2>
              </div>

              <div className="space-y-4">
                {/* Source Picker */}
                <div className="group">
                  <button
                    onClick={selectSource}
                    disabled={isProcessing || isPickerActive}
                    className={`w-full group flex flex-col p-4 rounded-2xl border transition-all duration-300 ${
                      sourceHandle 
                        ? 'bg-blue-600/10 border-blue-500/40 text-blue-100' 
                        : 'bg-slate-800/30 border-slate-800 hover:border-slate-700 text-slate-400'
                    } disabled:opacity-50 relative overflow-hidden`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${sourceHandle ? 'bg-blue-500/20' : 'bg-slate-700/30'}`}>
                          <HardDrive className={`w-5 h-5 ${sourceHandle ? 'text-blue-400' : 'text-slate-500'}`} />
                        </div>
                        <span className="text-sm font-bold">Origen</span>
                      </div>
                      {sourceHandle && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div className="text-xs font-medium truncate w-full text-left">
                      {sourceHandle ? sourceHandle.name : 'Seleccionar Disco Externo'}
                    </div>
                    {isCalculatingSize && (
                      <div className="absolute bottom-0 left-0 h-1 bg-blue-500/30 w-full overflow-hidden">
                        <div className="h-full bg-blue-500 animate-[shimmer_2s_infinite]" style={{ width: '30%' }} />
                      </div>
                    )}
                  </button>
                  {sourceSize !== null && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center justify-between"
                    >
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Tamaño Total</span>
                      <span className="text-xs font-mono text-blue-400 font-bold">{formatSize(sourceSize)}</span>
                    </motion.div>
                  )}
                </div>

                {/* Destination Picker */}
                <button
                  onClick={selectDestination}
                  disabled={isProcessing || isPickerActive}
                  className={`w-full group flex flex-col p-4 rounded-2xl border transition-all duration-300 ${
                    destHandle 
                      ? 'bg-purple-600/10 border-purple-500/40 text-purple-100' 
                      : 'bg-slate-800/30 border-slate-800 hover:border-slate-700 text-slate-400'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${destHandle ? 'bg-purple-500/20' : 'bg-slate-700/30'}`}>
                        <FolderDown className={`w-5 h-5 ${destHandle ? 'text-purple-400' : 'text-slate-500'}`} />
                      </div>
                      <span className="text-sm font-bold">Destino</span>
                    </div>
                    {destHandle && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                  </div>
                  <div className="text-xs font-medium truncate w-full text-left">
                    {destHandle ? destHandle.name : 'Seleccionar Carpeta en PC'}
                  </div>
                </button>
              </div>

              {/* Main Action Button */}
              <div className="pt-4">
                {!isProcessing ? (
                  <button
                    onClick={startRecovery}
                    disabled={!sourceHandle || !destHandle}
                    className="w-full group relative overflow-hidden bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-blue-900/40"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <Play className="w-6 h-6 fill-current" />
                    <span className="text-lg">Iniciar Extracción</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecovery}
                    className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all"
                  >
                    <Pause className="w-6 h-6 fill-current" />
                    <span className="text-lg">Detener Proceso</span>
                  </button>
                )}
              </div>

              {/* Storage Info Note */}
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <Info className="w-3 h-3" />
                  Nota de Seguridad
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  El navegador opera en un entorno seguro (Sandbox). No puede leer el espacio físico del disco, por lo que calculamos el tamaño sumando cada archivo individualmente.
                </p>
              </div>
            </section>
          </div>

          {/* MIDDLE COLUMN: Settings & Rules */}
          <div className="xl:col-span-4 space-y-6">
            <section className="glass-card p-6 space-y-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-500" />
                Reglas de Filtrado
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <Filter className="w-3 h-3" />
                    Extensiones a Incluir
                  </label>
                  <input
                    type="text"
                    value={includeExtensions}
                    onChange={(e) => setIncludeExtensions(e.target.value)}
                    disabled={isProcessing}
                    placeholder="Ej: jpg, mp4, pdf (Vacío = Todo)"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <XCircle className="w-3 h-3" />
                    Extensiones a Excluir
                  </label>
                  <input
                    type="text"
                    value={excludeExtensions}
                    onChange={(e) => setExcludeExtensions(e.target.value)}
                    disabled={isProcessing}
                    placeholder="Ej: tmp, log, ini"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:border-red-500/50 transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="h-px bg-slate-800/50" />

              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Lógica Avanzada
              </h2>

              <div className="space-y-3">
                {[
                  { id: 'detectDuplicates', label: 'Detección de Duplicados', icon: Copy, color: 'text-blue-400', state: detectDuplicates, setter: setDetectDuplicates },
                  { id: 'smartSync', label: 'Sincronización Inteligente', icon: RefreshCw, color: 'text-emerald-400', state: smartSync, setter: setSmartSync },
                  { id: 'renameSequentially', label: 'Renombrado Secuencial', icon: Clock, color: 'text-purple-400', state: renameSequentially, setter: setRenameSequentially },
                  { id: 'separateVideos', label: 'Separar Videos', icon: Video, color: 'text-red-400', state: separateVideos, setter: setSeparateVideos },
                  { id: 'fastMode', label: 'Modo Rápido (Sin conteo)', icon: Play, color: 'text-amber-400', state: fastMode, setter: setFastMode },
                  { id: 'omitSystemFolders', label: 'Omitir Sistema/Ocultos', icon: Database, color: 'text-slate-400', state: omitSystemFolders, setter: setOmitSystemFolders },
                ].map((item) => (
                  <label 
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                      item.state 
                        ? 'bg-slate-800/40 border-slate-700/50' 
                        : 'bg-transparent border-transparent hover:bg-slate-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.state ? 'bg-slate-700/50' : 'bg-slate-800/30'}`}>
                        <item.icon className={`w-4 h-4 ${item.state ? item.color : 'text-slate-600'}`} />
                      </div>
                      <span className={`text-xs font-semibold ${item.state ? 'text-slate-200' : 'text-slate-500'}`}>
                        {item.label}
                      </span>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={item.state}
                        onChange={(e) => item.setter(e.target.checked)}
                        disabled={isProcessing}
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white" />
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Stats & Logs */}
          <div className="xl:col-span-4 space-y-6">
            {/* Real-time Stats */}
            <section className="glass-card p-6 space-y-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Rendimiento
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Copiados', value: stats.copiedFiles, color: 'text-blue-400', icon: CheckCircle2 },
                  { label: 'Videos', value: stats.videoFiles, color: 'text-red-400', icon: Video },
                  { label: 'Duplicados', value: stats.duplicateFiles, color: 'text-amber-400', icon: Copy },
                  { label: 'Fallidos', value: stats.failedFiles, color: 'text-rose-500', icon: XCircle },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex flex-col items-center text-center">
                    <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                    <div className="text-2xl font-bold text-white tabular-nums">{stat.value}</div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {isProcessing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-slate-500">Progreso General</span>
                    <span className="text-blue-400 tabular-nums">
                      {stats.totalFiles > 0 ? Math.round(((stats.copiedFiles + stats.failedFiles + stats.duplicateFiles) / stats.totalFiles) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.totalFiles > 0 ? ((stats.copiedFiles + stats.failedFiles + stats.duplicateFiles) / stats.totalFiles) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium truncate">
                    <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                    {stats.currentFile || 'Preparando...'}
                  </div>
                </div>
              )}
            </section>

            {/* Logs Console */}
            <section className="glass-card p-6 flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Consola de Eventos
                </h2>
                <button 
                  onClick={() => setLogs([])}
                  className="text-[10px] font-bold text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors"
                >
                  Limpiar
                </button>
              </div>

              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2"
              >
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-3">
                    <Activity className="w-10 h-10 opacity-20" />
                    <p className="text-xs font-medium italic">Esperando actividad...</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-xl text-[11px] font-mono leading-relaxed border flex gap-3 ${
                        log.type === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                        log.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                        log.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' :
                        'bg-slate-800/30 border-slate-800/50 text-slate-400'
                      }`}
                    >
                      <span className="opacity-40 shrink-0">{log.timestamp.toLocaleTimeString([], { hour12: false })}</span>
                      <span className="break-all">{log.message}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-slate-600">
            &copy; 2026 MRDataRescue Pro. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <button className="text-xs font-bold text-slate-600 hover:text-blue-400 transition-colors uppercase tracking-widest">Documentación</button>
            <button className="text-xs font-bold text-slate-600 hover:text-blue-400 transition-colors uppercase tracking-widest">Soporte Técnico</button>
          </div>
        </footer>
      </div>

      {/* Maintenance Guide Modal */}
      <AnimatePresence>
        {showMaintenanceGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-2xl w-full p-8 space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldAlert className="w-32 h-32" />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Extracción Completada</h2>
                  <p className="text-slate-400">El proceso ha finalizado con éxito.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Guía de Mantenimiento Post-Rescate</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Verificación', desc: 'Revisa los archivos en la carpeta de destino antes de formatear el disco.' },
                    { title: 'Duplicados', desc: 'Si activaste la detección, revisa la carpeta "Archivos_Duplicados".' },
                    { title: 'Formateo', desc: 'Si el disco tiene errores lógicos, un formateo lento puede recuperarlo.' },
                    { title: 'Backup', desc: 'Mantén siempre una copia de seguridad en la nube o en otro disco físico.' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                      <div className="text-blue-400 text-xs font-bold mb-1 uppercase tracking-wider">{item.title}</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowMaintenanceGuide(false)}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
              >
                Entendido, cerrar guía
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
