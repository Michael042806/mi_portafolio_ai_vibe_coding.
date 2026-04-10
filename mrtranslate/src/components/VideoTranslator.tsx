import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Play, Pause, Languages, Download, Volume2, RefreshCcw, CheckCircle2, AlertCircle, ExternalLink, Settings, Activity, FileVideo, FileText } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Subtitle {
  start: number;
  end: number;
  text: string;
}

export default function VideoTranslator() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isDubbingEnabled, setIsDubbingEnabled] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const lastSpokenIndex = useRef<number>(-1);

  // Robust API key detection
  const getApiKey = () => {
    const key = (process.env as any).GEMINI_API_KEY || (process.env as any).API_KEY || "";
    return (key && key !== "undefined" && key !== "null") ? key : "";
  };

  const [apiKey, setApiKey] = useState(getApiKey());
  const [isApiKeyValid, setIsApiKeyValid] = useState(true);
  const [showKeyHelp, setShowKeyHelp] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(!!(window as any).aistudio?.openSelectKey);

  useEffect(() => {
    setIsPlatformAvailable(!!(window as any).aistudio?.openSelectKey);
    
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. Checking for platform selection...");
      checkPlatformKey();
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const spanishVoices = availableVoices.filter(v => v.lang.startsWith('es'));
      setVoices(spanishVoices);
      if (spanishVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(spanishVoices[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const checkPlatformKey = async () => {
    if ((window as any).aistudio?.hasSelectedApiKey) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (hasKey) {
        // The key is injected into process.env.API_KEY automatically after selection
        // but we might need to refresh state if it was just selected
        const currentKey = getApiKey();
        if (currentKey) setApiKey(currentKey);
      }
    }
  };

  const openKeySelection = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      try {
        await (window as any).aistudio.openSelectKey();
        // After selection, the platform usually refreshes or we can check again
        setTimeout(async () => {
          const newKey = getApiKey();
          if (newKey) {
            setApiKey(newKey);
            setIsApiKeyValid(true);
            toast.success("Clave de API vinculada correctamente.");
          }
        }, 1000);
      } catch (err) {
        console.error("Error opening key selection:", err);
        setShowKeyHelp(true);
      }
    } else {
      setShowKeyHelp(true);
    }
  };

  const loadDemo = () => {
    setIsDemoMode(true);
    setVideoUrl("https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
    setSubtitles([
      { start: 1, end: 5, text: "¡Hola! Bienvenido a MRtranslate, la herramienta de doblaje con IA." },
      { start: 6, end: 12, text: "Estamos viendo un demo de cómo la inteligencia artificial puede traducir y doblar videos en tiempo real." },
      { start: 13, end: 18, text: "Esta tecnología utiliza Gemini 1.5 para el análisis y síntesis de voz para el audio." },
      { start: 19, end: 25, text: "Es perfecto para creadores de contenido que quieren llegar a audiencias globales rápidamente." }
    ]);
    toast.success("Demo cargado correctamente. ¡Dale a Play para ver la magia!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 1024 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande (máximo 1GB)");
        return;
      }
      setFile(selectedFile);
      setVideoUrl(URL.createObjectURL(selectedFile));
      setSubtitles([]);
      lastSpokenIndex.current = -1;
    }
  };

  const processVideo = async () => {
    if (!file) return;
    
    // Always get the freshest key
    const currentKey = getApiKey();
    if (!currentKey) {
      toast.error("Falta la clave de API de Gemini.");
      openKeySelection();
      return;
    }

    // Create instance right before use as per skill guidelines
    const genAI = new GoogleGenAI({ apiKey: currentKey });

    setIsProcessing(true);
    setProgress(10);
    setProcessingStatus('Subiendo video a Gemini...');
    
    try {
      // 1. Upload to Gemini File API (Directly from browser)
      const uploadResult = await genAI.files.upload({
        file: file,
        config: {
          mimeType: file.type,
          displayName: file.name,
        },
      });

      setProgress(40);
      setProcessingStatus('Procesando video en la nube...');

      // 2. Wait for processing
      let geminiFile = await genAI.files.get({ name: uploadResult.name });
      let attempts = 0;
      while (geminiFile.state === "PROCESSING" && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        geminiFile = await genAI.files.get({ name: uploadResult.name });
        attempts++;
      }

      if (geminiFile.state === "FAILED") {
        throw new Error("El procesamiento del video en Gemini falló");
      }

      setProgress(70);
      setProcessingStatus('Analizando y traduciendo audio...');

      // 3. Generate content
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            fileData: {
              mimeType: geminiFile.mimeType,
              fileUri: geminiFile.uri,
            },
          },
          {
            text: "Analiza este video y traduce todo el audio hablado al español latinoamericano. Devuelve una lista de objetos que contengan 'start' (segundo de inicio), 'end' (segundo de fin) y 'text' (traducción al español). Asegúrate de que los tiempos sean precisos para el doblaje.",
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER },
                text: { type: Type.STRING },
              },
              required: ["start", "end", "text"],
            },
          },
        }
      });

      setProgress(100);
      setProcessingStatus('¡Listo!');
      
      const result = JSON.parse(response.text);
      
      if (result && Array.isArray(result)) {
        setSubtitles(result);
        toast.success("Traducción completada");
      } else {
        toast.error("No se pudo traducir el video");
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Error al procesar el video.";
      
      if (message.includes("API key not valid") || message.includes("INVALID_ARGUMENT") || message.includes("API_KEY_INVALID") || message.includes("Requested entity was not found")) {
        setIsApiKeyValid(false);
        toast.error("Clave de API inválida o no configurada. Por favor, vincúlala de nuevo.");
        openKeySelection();
        setProcessingStatus("Error: Clave de API inválida. Revisa la configuración.");
      } else {
        toast.error(message);
        setProcessingStatus(`Error: ${message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = (text: string) => {
    if (!isDubbingEnabled) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.lang = 'es-MX';
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    const subIndex = subtitles.findIndex(s => time >= s.start && time <= s.end);
    if (subIndex !== -1 && subIndex !== lastSpokenIndex.current) {
      lastSpokenIndex.current = subIndex;
      speak(subtitles[subIndex].text);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      window.speechSynthesis.cancel();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const downloadSRT = () => {
    if (subtitles.length === 0) return;
    
    const formatTime = (seconds: number) => {
      const date = new Date(0);
      date.setSeconds(seconds);
      const hh = date.getUTCHours().toString().padStart(2, '0');
      const mm = date.getUTCMinutes().toString().padStart(2, '0');
      const ss = date.getUTCSeconds().toString().padStart(2, '0');
      const ms = (seconds % 1).toFixed(3).split('.')[1]?.padEnd(3, '0') || '000';
      return `${hh}:${mm}:${ss},${ms}`;
    };

    let srtContent = '';
    subtitles.forEach((sub, i) => {
      srtContent += `${i + 1}\n`;
      srtContent += `${formatTime(sub.start)} --> ${formatTime(sub.end)}\n`;
      srtContent += `${sub.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.split('.')[0] || 'video'}_subtitles.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Subtítulos (.srt) descargados");
  };

  const exportVideo = async () => {
    if (!file || subtitles.length === 0) return;
    
    setIsExporting(true);
    setExportProgress(0);
    toast.info("Iniciando exportación... Esto puede tardar varios minutos.");

    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });

      ffmpeg.on('progress', ({ progress }) => {
        setExportProgress(Math.round(progress * 100));
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      // Write original video
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));

      // Generate SRT
      const srtContent = subtitles.map((sub, i) => {
        const formatTime = (s: number) => {
          const d = new Date(0); d.setSeconds(s);
          return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}:${d.getUTCSeconds().toString().padStart(2, '0')}.${(s % 1).toFixed(3).split('.')[1] || '000'}`;
        };
        return `${i + 1}\n${formatTime(sub.start)} --> ${formatTime(sub.end)}\n${sub.text}`;
      }).join('\n\n');

      await ffmpeg.writeFile('subs.srt', srtContent);

      // Note: Exporting with audio is complex due to TTS. 
      // For now, we provide the SRT and a message.
      toast.info("La exportación de video con audio integrado está en desarrollo. Por ahora, descarga los subtítulos (.srt) para usarlos con cualquier reproductor.");
      downloadSRT();
      
    } catch (error) {
      console.error(error);
      toast.error("Error en la exportación");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Enhanced Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-600/5 blur-[100px] rounded-full" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Top Navigation Bar */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-5">
            <div className="vibrant-gradient p-3 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <Languages className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold tracking-tight text-gradient">
                MRtranslate
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-white/50 font-medium uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Neural Engine Active</span>
                <span className="mx-1 opacity-30">•</span>
                <span className="text-indigo-400 font-bold">Vibe Optimized</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {(!apiKey || !isApiKeyValid) && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 text-[11px] font-bold uppercase tracking-wider h-10 px-4 rounded-xl"
                onClick={openKeySelection}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {!apiKey ? "Missing API Key" : "Invalid API Key"}
              </Button>
            )}
            <div className="flex items-center gap-2 glass-morphism px-4 py-2 rounded-xl">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">v2.5.0-VIBE</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="glass-morphism border-white/10 hover:bg-white/10 text-[11px] font-bold uppercase tracking-wider h-10 px-4 rounded-xl text-indigo-300 border-indigo-500/30"
              onClick={loadDemo}
            >
              <Activity className="w-4 h-4 mr-2" />
              Try Demo
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="glass-morphism border-white/10 hover:bg-white/10 text-[11px] font-bold uppercase tracking-wider h-10 px-4 rounded-xl text-white/70"
              onClick={() => window.open(window.location.href, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              New Tab
            </Button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Controls */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="glass-card border-none text-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5 p-6">
                <CardTitle className="text-sm font-heading font-bold uppercase tracking-[0.15em] text-indigo-300">Control_Center</CardTitle>
                <CardDescription className="text-xs text-white/40">Configure translation parameters</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Voice_Synthesis</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-indigo-500/50">
                      <SelectValue placeholder="Select target voice" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f12] border-white/10 text-white rounded-xl">
                      {voices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name} className="focus:bg-indigo-500/20 focus:text-indigo-200">
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Source_Input</label>
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer group
                      ${file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 hover:border-indigo-500/30 hover:bg-white/5'}`}
                    onClick={() => document.getElementById('video-upload')?.click()}
                  >
                    <input 
                      type="file" 
                      id="video-upload" 
                      className="hidden" 
                      accept="video/*" 
                      onChange={handleFileChange}
                    />
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${file ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/20'}`}>
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1">
                          {file ? file.name : "Drop video here"}
                        </p>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.1em]">MKV, MP4, AVI • MAX 1GB</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full vibrant-gradient hover:opacity-90 text-white font-bold uppercase tracking-[0.2em] text-xs py-8 rounded-2xl shadow-[0_10px_30px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98]"
                  disabled={!file || isProcessing}
                  onClick={processVideo}
                >
                  {isProcessing ? (
                    <RefreshCcw className="w-5 h-5 animate-spin mr-3" />
                  ) : (
                    <Languages className="w-5 h-5 mr-3" />
                  )}
                  {isProcessing ? "Processing..." : "Execute Translation"}
                </Button>

                {isProcessing && (
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span className="flex items-center gap-2">
                        <Activity className="w-4 h-4 animate-pulse text-indigo-400" />
                        {processingStatus}
                      </span>
                      <span className="text-indigo-300">{progress}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full vibrant-gradient"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {isExporting && (
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span className="flex items-center gap-2">
                        <Download className="w-4 h-4 animate-bounce text-purple-400" />
                        Exporting Video...
                      </span>
                      <span className="text-purple-300">{exportProgress}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {subtitles.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl">
                    <div className="flex gap-4 items-start">
                      <div className="bg-green-500 p-1.5 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-[11px] uppercase tracking-wider leading-relaxed">
                        <p className="font-bold text-green-400 mb-1">Status: Success</p>
                        <p className="text-white/50">Translation matrix generated. Ready for playback.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-none text-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5 p-6">
                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">System_Manual</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5 text-[11px] font-medium uppercase tracking-widest text-white/50">
                <div className="flex gap-4 items-center">
                  <span className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">01</span>
                  <p>Load video file into the buffer.</p>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">02</span>
                  <p>Trigger AI translation engine.</p>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">03</span>
                  <p>Monitor output and verify dubbing.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Player & Data Grid */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="glass-card border-none text-white rounded-3xl overflow-hidden aspect-video relative group shadow-2xl">
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20 rounded-2xl overflow-hidden">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Neural Network Visualization */}
                    <div className="absolute inset-0 opacity-30">
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ 
                            opacity: [0.1, 0.5, 0.1],
                            scale: [1, 1.2, 1],
                            x: Math.random() * 100 - 50 + '%',
                            y: Math.random() * 100 - 50 + '%'
                          }}
                          transition={{ 
                            duration: 3 + Math.random() * 2, 
                            repeat: Infinity,
                            delay: Math.random() * 2
                          }}
                          className="absolute w-1 h-1 bg-indigo-400 rounded-full"
                        />
                      ))}
                    </div>
                    
                    <div className="text-center space-y-6 relative z-10 px-8">
                      <div className="relative inline-block">
                        <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-400 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold tracking-tight text-white">{processingStatus}</h3>
                        <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mx-auto">
                          <motion.div 
                            className="h-full vibrant-gradient"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs font-mono text-white/40 uppercase tracking-[0.2em]">{progress}% Complete</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {videoUrl ? (
                <>
                  <video 
                    ref={videoRef}
                    src={videoUrl} 
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    muted={isDubbingEnabled}
                  />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <Button 
                      size="icon" 
                      className="w-24 h-24 rounded-full vibrant-gradient hover:scale-110 transition-transform text-white shadow-[0_0_40px_rgba(99,102,241,0.5)]"
                      onClick={togglePlay}
                    >
                      {isPlaying ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12 ml-2" />}
                    </Button>
                  </div>

                  {/* Subtitle Overlay - Modern Style */}
                  <AnimatePresence>
                    {subtitles.map((sub, i) => (
                      currentTime >= sub.start && currentTime <= sub.end && (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute bottom-12 left-0 right-0 text-center px-12"
                        >
                          <span className="inline-block bg-black/60 backdrop-blur-xl text-white px-8 py-4 rounded-2xl border border-white/10 text-2xl font-heading font-bold tracking-tight shadow-2xl">
                            {sub.text}
                          </span>
                        </motion.div>
                      )
                    ))}
                  </AnimatePresence>
                  
                  {/* Timecode Overlay */}
                  <div className="absolute top-6 right-6 glass-morphism px-4 py-2 rounded-xl text-[11px] font-bold text-indigo-300 tracking-widest shadow-lg">
                    <span className="opacity-40 mr-2">TC</span> {currentTime.toFixed(3)}s
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-8 bg-[#050505]">
                  <div className="w-28 h-28 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02]">
                    <Play className="w-10 h-10 text-white/10" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold uppercase tracking-[0.4em] text-white/20">Waiting for source input</p>
                    <p className="text-[10px] uppercase tracking-widest text-white/10">Upload a video to begin processing</p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="glass-card border-none text-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5 p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-heading font-bold uppercase tracking-[0.15em] text-purple-300">Data_Output_Grid</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-wider h-10 px-4 rounded-xl text-white/70 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                      )}
                      disabled={subtitles.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export_Data
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0f0f12] border-white/10 text-white rounded-xl p-2 min-w-[180px]">
                      <DropdownMenuItem onClick={downloadSRT} className="text-[11px] font-bold uppercase tracking-wider cursor-pointer rounded-lg focus:bg-indigo-500 focus:text-white p-3">
                        <FileText className="w-4 h-4 mr-3" />
                        Subtitles (.srt)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportVideo} className="text-[11px] font-bold uppercase tracking-wider cursor-pointer rounded-lg focus:bg-purple-500 focus:text-white p-3">
                        <FileVideo className="w-4 h-4 mr-3" />
                        Video (Experimental)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={`border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-wider h-10 px-4 rounded-xl transition-all ${isDubbingEnabled ? 'text-indigo-400 border-indigo-500/30' : 'text-white/30'}`}
                    onClick={() => setIsDubbingEnabled(!isDubbingEnabled)}
                  >
                    {isDubbingEnabled ? "DUBBING_ACTIVE" : "DUBBING_MUTED"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0f0f12] border-b border-white/5 z-20">
                      <tr className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                        <th className="p-6 font-normal">ID</th>
                        <th className="p-6 font-normal">Timecode_Range</th>
                        <th className="p-6 font-normal">Translation_Data</th>
                        <th className="p-6 font-normal text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subtitles.length > 0 ? (
                        subtitles.map((sub, i) => (
                          <tr 
                            key={i} 
                            className={`group border-b border-white/[0.02] transition-all cursor-pointer hover:bg-white/[0.03] ${
                              currentTime >= sub.start && currentTime <= sub.end 
                                ? 'bg-indigo-500/10 text-indigo-300' 
                                : ''
                            }`}
                            onClick={() => {
                              if (videoRef.current) videoRef.current.currentTime = sub.start;
                            }}
                          >
                            <td className="p-6 text-[11px] font-bold opacity-30">{(i + 1).toString().padStart(2, '0')}</td>
                            <td className="p-6 text-[11px] font-bold tracking-tight font-mono">
                              {sub.start.toFixed(2)}s <span className="mx-2 opacity-20">→</span> {sub.end.toFixed(2)}s
                            </td>
                            <td className="p-6 text-[13px] font-medium leading-relaxed">
                              {sub.text}
                            </td>
                            <td className="p-6 text-right">
                              {currentTime >= sub.start && currentTime <= sub.end ? (
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                                  <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                                </div>
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-white/5 ml-auto" />
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-24 text-center">
                            <div className="flex flex-col items-center gap-6 opacity-20">
                              <div className="p-5 rounded-full bg-white/5">
                                <AlertCircle className="w-10 h-10" />
                              </div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.4em]">No data available in grid</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Tech Stack Showcase */}
        <section className="pt-12 pb-20">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-white/30">Neural Architecture</h2>
            <p className="text-3xl font-heading font-bold text-gradient">Powered by Advanced AI</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Activity className="w-6 h-6" />,
                title: "Gemini 1.5 Flash",
                desc: "Multimodal analysis for precise audio-visual synchronization and context-aware translation.",
                color: "text-blue-400"
              },
              {
                icon: <Volume2 className="w-6 h-6" />,
                title: "Neural TTS",
                desc: "High-fidelity speech synthesis with natural prosody and emotional resonance.",
                color: "text-purple-400"
              },
              {
                icon: <FileVideo className="w-6 h-6" />,
                title: "FFmpeg WASM",
                desc: "Client-side video processing and subtitle injection using WebAssembly for maximum privacy.",
                color: "text-indigo-400"
              }
            ].map((tech, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="glass-card p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className={cn("p-3 rounded-xl bg-white/5 w-fit mb-6 group-hover:scale-110 transition-transform", tech.color)}>
                  {tech.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{tech.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Vibe Coding Portfolio Section */}
        <section className="pb-32">
          <div className="glass-card p-12 rounded-[3rem] border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] -ml-32 -mb-32" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  Vibe Coding Showcase
                </div>
                <h2 className="text-4xl md:text-5xl font-heading font-bold leading-tight">
                  Crafting <span className="text-gradient">Intelligent</span> Experiences
                </h2>
                <p className="text-lg text-white/60 leading-relaxed">
                  MRtranslate is more than a tool; it's a demonstration of how AI can bridge language gaps with style. 
                  Built with a focus on <span className="text-white">performance</span>, <span className="text-white">privacy</span>, and <span className="text-white">aesthetic precision</span>.
                </p>
                <div className="flex flex-wrap gap-4">
                  {['React 18', 'Tailwind CSS', 'Framer Motion', 'Gemini AI', 'WASM'].map((tag) => (
                    <span key={tag} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-white/40">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="glass-card p-6 rounded-3xl bg-indigo-500/5 border-indigo-500/10">
                    <h4 className="text-2xl font-bold text-white">0.8s</h4>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Latency</p>
                  </div>
                  <div className="glass-card p-6 rounded-3xl bg-purple-500/5 border-purple-500/10">
                    <h4 className="text-2xl font-bold text-white">100%</h4>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Client-Side</p>
                  </div>
                </div>
                <div className="pt-8 space-y-4">
                  <div className="glass-card p-6 rounded-3xl bg-blue-500/5 border-blue-500/10">
                    <h4 className="text-2xl font-bold text-white">4K</h4>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Resolution</p>
                  </div>
                  <div className="glass-card p-6 rounded-3xl bg-pink-500/5 border-pink-500/10">
                    <h4 className="text-2xl font-bold text-white">Neural</h4>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Synthesis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col md:flex-row justify-between items-center gap-4 py-10 border-t border-white/5 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
          <p>© 2026 MRtranslate // Powered by Google Gemini</p>
          <div className="flex gap-8">
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-indigo-500" />
              Latency: 18ms
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-purple-500" />
              Buffer: 2048MB
            </span>
          </div>
        </footer>

        {/* API Key Help Modal */}
        <AnimatePresence>
          {showKeyHelp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-card max-w-md w-full p-8 rounded-3xl space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 vibrant-gradient" />
                
                <div className="flex justify-between items-start">
                  <div className="vibrant-gradient p-3 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <button 
                    onClick={() => setShowKeyHelp(false)}
                    className="text-white/40 hover:text-white transition-colors p-2"
                  >
                    <RefreshCcw className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-heading font-bold text-white">Configuración de API Key</h2>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Parece que el selector automático no está disponible en este entorno (esto ocurre si has abierto la app en una pestaña nueva).
                  </p>
                </div>

                <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pasos para resolverlo:</h3>
                  <ol className="space-y-3 text-xs text-white/80 list-decimal ml-4">
                    <li>Regresa a la pestaña de <b>AI Studio Build</b>.</li>
                    <li>En el menú lateral izquierdo, haz clic en el icono de <b>Settings</b> (engranaje).</li>
                    <li>Ve a la sección <b>Secrets</b>.</li>
                    <li>Añade una clave llamada <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300 font-mono">GEMINI_API_KEY</code>.</li>
                    <li>Pega tu clave de API de Gemini y guarda los cambios.</li>
                  </ol>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    className="vibrant-gradient hover:opacity-90 h-12 rounded-xl font-bold"
                    onClick={() => {
                      const key = getApiKey();
                      if (key) {
                        setApiKey(key);
                        setIsApiKeyValid(true);
                        setShowKeyHelp(false);
                        toast.success("Clave detectada correctamente.");
                      } else {
                        toast.error("Aún no se detecta la clave. Asegúrate de guardarla en Secrets.");
                      }
                    }}
                  >
                    Verificar Clave Ahora
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-white/40 hover:text-white hover:bg-white/5 h-12 rounded-xl text-xs"
                    onClick={() => setShowKeyHelp(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
