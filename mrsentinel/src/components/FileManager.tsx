import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  File, 
  Search, 
  Plus, 
  MoreVertical, 
  ChevronRight, 
  Trash2,
  Move,
  Download,
  HardDrive,
  Star,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { MOCK_FILES } from '../data/mockData';
import { FileNode } from '../types';
import { cn } from '../lib/utils';

export default function FileManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPath, setCurrentPath] = useState<string[]>(['Raíz']);
  const [files, setFiles] = useState<FileNode[]>(MOCK_FILES);

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    
    const search = (nodes: FileNode[]): FileNode[] => {
      return nodes.reduce((acc: FileNode[], node) => {
        const matches = node.name.toLowerCase().includes(searchQuery.toLowerCase());
        const childrenMatches = node.children ? search(node.children) : [];
        
        if (matches || childrenMatches.length > 0) {
          acc.push({
            ...node,
            children: childrenMatches.length > 0 ? childrenMatches : node.children
          });
        }
        return acc;
      }, []);
    };
    
    return search(files);
  }, [files, searchQuery]);

  const handleQuickAccess = (folderName: string) => {
    setCurrentPath(['Raíz', folderName]);
    alert(`Navegando a: ${folderName}`);
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isFolder = node.type === 'folder';

    return (
      <div key={node.id} className="space-y-1">
        <div 
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl transition-all group cursor-pointer",
            "hover:bg-white/5 border border-transparent hover:border-white/5"
          )}
          style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
        >
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isFolder ? "bg-blue-500/10 text-blue-500" : "bg-gray-500/10 text-gray-400"
          )}>
            {isFolder ? <Folder className="w-4 h-4 fill-current" /> : <File className="w-4 h-4" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-200 truncate">{node.name}</h4>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] text-gray-500 font-mono uppercase">{node.modified}</span>
              {node.size && <span className="text-[10px] text-gray-600 font-mono">{node.size}</span>}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); alert('Moviendo archivo...'); }} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors">
              <Move className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); alert('Archivo eliminado (simulado)'); }} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-white transition-colors">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {isFolder && node.children && (
          <div className="space-y-1">
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestor de Archivos</h2>
          <p className="text-gray-400 text-sm">Administre archivos de sistema, directorios y almacenamiento</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert('Nueva carpeta creada')} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-xl text-sm font-medium hover:bg-white/5 transition-all">
            <Plus className="w-4 h-4" />
            Nueva Carpeta
          </button>
          <button onClick={() => alert('Importando archivos...')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">
            <Download className="w-4 h-4" />
            Importar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6">
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-500" />
              Dispositivos
            </h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-medium text-gray-200">Disco Local (C:)</p>
                    <p className="text-[10px] text-gray-500 font-mono">1.8 TB / 2.0 TB</p>
                  </div>
                  <span className="text-xs font-bold text-blue-400">90%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[90%]" />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Acceso Rápido
            </h3>
            <div className="space-y-2">
              {[
                { name: 'Descargas', icon: Download },
                { name: 'Documentos', icon: Folder },
                { name: 'Escritorio', icon: LayoutGrid },
                { name: 'Recientes', icon: Clock }
              ].map(item => (
                <button 
                  key={item.name} 
                  onClick={() => handleQuickAccess(item.name)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.name}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Buscar archivos y carpetas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <div className="bg-[#222] px-6 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ruta:</span>
              <div className="flex items-center gap-1">
                {currentPath.map((p, i) => (
                  <React.Fragment key={p}>
                    <span className="text-xs text-blue-400 hover:underline cursor-pointer">{p}</span>
                    {i < currentPath.length - 1 && <ChevronRight className="w-3 h-3 text-gray-600" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredFiles.length > 0 ? (
                filteredFiles.map(node => renderFileNode(node))
              ) : (
                <div className="text-center py-20">
                  <Search className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron archivos.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
