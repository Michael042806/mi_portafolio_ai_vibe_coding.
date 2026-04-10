export interface PCComponent {
  id: string;
  name: string;
  type: 'CPU' | 'GPU' | 'RAM' | 'Storage' | 'Motherboard' | 'Battery';
  status: 'Healthy' | 'Warning' | 'Critical';
  details: string;
  temperature?: number;
  usage?: number;
  updateAvailable?: boolean;
}

export interface Driver {
  id: string;
  name: string;
  version: string;
  latestVersion: string;
  status: 'Up to date' | 'Update available';
  component: string;
}

export interface SoftwareConflict {
  id: string;
  app1: string;
  app2: string;
  reason: string;
  solution: string;
  steps: string[];
}

export interface ResourceApp {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export interface CommandInfo {
  id: string;
  command: string;
  description: string;
  usage: string;
  config: string;
  category: 'Sistema' | 'Red' | 'Archivos' | 'Procesos' | 'Hardware';
  detailedGuide?: string[];
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified: string;
  children?: FileNode[];
}
