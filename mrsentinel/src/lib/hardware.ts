
export interface DetectedHardware {
  cpuCores: number;
  memoryGB: number;
  gpu: string;
  os: string;
  browser: string;
}

export function getHardwareInfo(): DetectedHardware {
  const ua = navigator.userAgent;
  let browser = "Desconocido";
  if (ua.indexOf("Chrome") > -1) browser = "Google Chrome";
  else if (ua.indexOf("Firefox") > -1) browser = "Mozilla Firefox";
  else if (ua.indexOf("Safari") > -1) browser = "Apple Safari";
  else if (ua.indexOf("Edge") > -1) browser = "Microsoft Edge";

  let gpu = "Desconocido";
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpu = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {
    console.error("Error detectando GPU:", e);
  }

  return {
    cpuCores: navigator.hardwareConcurrency || 0,
    memoryGB: (navigator as any).deviceMemory || 0,
    gpu: gpu,
    os: navigator.platform,
    browser: browser
  };
}
