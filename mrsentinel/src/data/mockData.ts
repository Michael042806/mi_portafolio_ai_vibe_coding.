import { PCComponent, Driver, SoftwareConflict, ResourceApp, CommandInfo, FileNode } from '../types';

export const MOCK_COMPONENTS: PCComponent[] = [
  { id: '1', name: 'Intel Core i9-13900K', type: 'CPU', status: 'Healthy', details: '8P + 16E Cores, 5.8GHz Max Turbo', temperature: 45, usage: 12 },
  { id: '2', name: 'NVIDIA GeForce RTX 4090', type: 'GPU', status: 'Healthy', details: '24GB GDDR6X', temperature: 38, usage: 5 },
  { id: '3', name: 'Corsair Vengeance 64GB DDR5', type: 'RAM', status: 'Healthy', details: '6000MHz CL30', usage: 24 },
  { id: '4', name: 'Samsung 990 Pro 2TB', type: 'Storage', status: 'Warning', details: 'SSD NVMe Gen4 - 85% Lleno', usage: 85 },
  { id: '5', name: 'ASUS ROG Maximus Z790', type: 'Motherboard', status: 'Healthy', details: 'LGA 1700, WiFi 6E' },
  { id: '6', name: 'Batería Interna', type: 'Battery', status: 'Healthy', details: '92% Salud, 4h 20m restantes', usage: 92 },
];

export const MOCK_DRIVERS: Driver[] = [
  { id: 'd1', name: 'NVIDIA Game Ready Driver', version: '546.17', latestVersion: '595.97', status: 'Update available', component: 'GPU' },
  { id: 'd2', name: 'Intel Chipset Driver', version: '10.1.19600', latestVersion: '10.1.19600', status: 'Up to date', component: 'Placa Base' },
  { id: 'd3', name: 'Realtek Audio Driver', version: '6.0.9514', latestVersion: '6.0.9600', status: 'Update available', component: 'Audio' },
  { id: 'd4', name: 'Bluetooth Generic Adapter', version: '1.0.0', latestVersion: '1.2.0', status: 'Update available', component: 'Red' },
];

export const MOCK_CONFLICTS: SoftwareConflict[] = [
  { 
    id: 'c1', 
    app1: 'Seguridad de Windows (Defender)', 
    app2: 'Malwarebytes Premium', 
    reason: 'Ambas aplicaciones están realizando escaneos en tiempo real simultáneos, lo que puede ralentizar el sistema y causar falsos positivos.', 
    solution: 'Configurar exclusiones mutuas o desactivar el registro de Malwarebytes en el Centro de Seguridad de Windows.',
    steps: [
      'Presione la tecla [Windows] y escriba "Malwarebytes" para abrir la aplicación.',
      'Haga clic en el icono de "Configuración" (engranaje) en la esquina superior derecha.',
      'Vaya a la pestaña "Seguridad".',
      'Localice la sección "Centro de seguridad de Windows".',
      'Desactive la opción "Registrar siempre Malwarebytes en el Centro de seguridad de Windows".',
      'Esto permitirá que Windows Defender actúe como antivirus principal mientras Malwarebytes ofrece protección secundaria sin conflictos.',
      'Reinicie el equipo para asegurar que los servicios se sincronicen correctamente.'
    ]
  },
  { 
    id: 'c2', 
    app1: 'Discord Overlay', 
    app2: 'Steam Overlay', 
    reason: 'Conflicto de renderizado en juegos que utilizan DirectX 12, causando parpadeos o caídas de FPS.', 
    solution: 'Desactivar uno de los dos overlays para mejorar la estabilidad del juego.',
    steps: [
      'Abra Discord y vaya a "Ajustes de usuario" (icono de engranaje abajo a la izquierda).',
      'En el menú lateral, busque la sección "Ajustes de actividad" y haga clic en "Superposición de juegos".',
      'Desactive el interruptor "Habilitar superposición en el juego".',
      'Alternativamente, en Steam: Vaya a Parámetros > En la partida.',
      'Desmarque "Habilitar la comunidad Steam mientras se juega".',
      'Reinicie el juego que presentaba problemas.'
    ]
  },
];

export const MOCK_RESOURCE_APPS: ResourceApp[] = [
  { id: 'r1', name: 'Google Chrome', cpu: 4.5, memory: 1200, disk: 0.1, network: 2.4 },
  { id: 'r2', name: 'Visual Studio Code', cpu: 1.2, memory: 450, disk: 0.0, network: 0.1 },
  { id: 'r3', name: 'Proceso de inactividad', cpu: 85.0, memory: 0, disk: 0.0, network: 0.0 },
  { id: 'r4', name: 'Docker Desktop', cpu: 2.8, memory: 2100, disk: 1.5, network: 0.5 },
];

export const MOCK_COMMANDS: CommandInfo[] = [
  { id: 'cmd1', command: 'ipconfig', description: 'Muestra todos los valores actuales de la configuración de red TCP/IP.', usage: 'ipconfig /all', config: '/all, /release, /renew, /flushdns', category: 'Red' },
  { id: 'cmd2', command: 'sfc /scannow', description: 'Escanea y repara archivos de sistema dañados.', usage: 'sfc /scannow', config: 'Requiere privilegios de Administrador', category: 'Sistema' },
  { id: 'cmd3', command: 'tasklist', description: 'Muestra una lista de los procesos que se están ejecutando actualmente.', usage: 'tasklist /v', config: '/v (detallado), /svc (servicios)', category: 'Procesos' },
  { id: 'cmd4', command: 'mkdir', description: 'Crea un nuevo directorio.', usage: 'mkdir [nombre_carpeta]', config: 'Soporta rutas relativas y absolutas', category: 'Archivos' },
  { id: 'cmd5', command: 'ping', description: 'Prueba la capacidad de respuesta de un host en una red IP.', usage: 'ping google.com', config: '-t (continuo), -n [cantidad]', category: 'Red' },
  { 
    id: 'cmd6', 
    command: 'diskpart', 
    description: 'Herramienta para administrar particiones de disco.', 
    usage: 'diskpart', 
    config: 'list disk, select disk X, create partition primary', 
    category: 'Hardware',
    detailedGuide: [
      'Escriba "list disk" para ver los discos conectados.',
      'Use "select disk X" para elegir el disco deseado.',
      'Escriba "clean" para borrar el disco (¡CUIDADO!).',
      'Use "create partition primary" para crear una nueva partición.',
      'Escriba "format fs=ntfs quick" para darle formato.'
    ]
  },
  { 
    id: 'cmd7', 
    command: 'Cambio de RAM', 
    description: 'Guía paso a paso para actualizar o cambiar módulos de memoria RAM.', 
    usage: 'Manual físico', 
    config: 'Asegúrese de que el equipo esté apagado y desconectado.', 
    category: 'Hardware',
    detailedGuide: [
      'Apague la PC y desconecte el cable de alimentación.',
      'Abra el panel lateral del gabinete.',
      'Localice las ranuras de RAM en la placa base.',
      'Presione las pestañas laterales de la ranura para liberar el módulo actual.',
      'Alinee la muesca del nuevo módulo con la ranura.',
      'Presione firmemente hacia abajo hasta que las pestañas hagan "clic".',
      'Cierre el gabinete y encienda la PC.'
    ]
  },
  { 
    id: 'cmd8', 
    command: 'chkdsk', 
    description: 'Verifica el estado de un disco y repara errores de estructura de archivos.', 
    usage: 'chkdsk C: /f /r', 
    config: '/f (reparar), /r (localizar sectores defectuosos)', 
    category: 'Hardware' 
  },
];

export const MOCK_FILES: FileNode[] = [
  {
    id: 'f1', name: 'Documentos', type: 'folder', modified: '2024-03-20', children: [
      { id: 'f1-1', name: 'Reporte.pdf', type: 'file', size: '2.4 MB', modified: '2024-03-15' },
      { id: 'f1-2', name: 'Presupuesto.xlsx', type: 'file', size: '1.1 MB', modified: '2024-03-18' },
    ]
  },
  {
    id: 'f2', name: 'Imágenes', type: 'folder', modified: '2024-03-21', children: [
      { id: 'f2-1', name: 'Vacaciones.jpg', type: 'file', size: '4.5 MB', modified: '2024-02-10' },
    ]
  },
  { id: 'f3', name: 'config.sys', type: 'file', size: '1 KB', modified: '2024-01-01' },
];

export const TEMPERATURE_HISTORY = [
  { time: '12:00', cpu: 42, gpu: 35 },
  { time: '12:10', cpu: 45, gpu: 38 },
  { time: '12:20', cpu: 55, gpu: 42 },
  { time: '12:30', cpu: 48, gpu: 40 },
  { time: '12:40', cpu: 44, gpu: 37 },
  { time: '12:50', cpu: 46, gpu: 39 },
];

export const NETWORK_HISTORY = [
  { time: '12:00', download: 1.2, upload: 0.4 },
  { time: '12:10', download: 5.8, upload: 1.2 },
  { time: '12:20', download: 12.4, upload: 2.5 },
  { time: '12:30', download: 3.1, upload: 0.8 },
  { time: '12:40', download: 0.9, upload: 0.3 },
  { time: '12:50', download: 2.5, upload: 0.6 },
];

export const THREATS = [
  { id: 't1', name: 'Trojan.Win32.Generic', severity: 'Alta', status: 'Bloqueado', time: '10:15 AM' },
  { id: 't2', name: 'Adware.Browser.Helper', severity: 'Media', status: 'En Cuarentena', time: '11:30 AM' },
];
