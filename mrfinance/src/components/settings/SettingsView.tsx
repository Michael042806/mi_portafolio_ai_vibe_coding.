import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Bell, Globe, DollarSign } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export function SettingsView() {
  const [notifications, setNotifications] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("es");

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          Ajustes del Sistema
        </h2>
        <p className="text-slate-500 font-medium">Personaliza tu experiencia y configura tus preferencias globales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* General Settings */}
        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="border-b border-slate-50 p-8">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-600" />
              General
            </CardTitle>
            <CardDescription>Idioma y moneda del sistema.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Idioma</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="es">Español (España)</SelectItem>
                    <SelectItem value="en">English (US)</SelectItem>
                    <SelectItem value="pt">Português (Brasil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Moneda Principal</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                    <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="border-b border-slate-50 p-8">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <Bell className="w-5 h-5 text-rose-500" />
              Notificaciones
            </CardTitle>
            <CardDescription>Controla cuándo quieres ser notificado.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900">Alertas de Gasto</p>
                <p className="text-xs text-slate-500">Recibe avisos cuando superes límites.</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900">Resumen Semanal</p>
                <p className="text-xs text-slate-500">Un informe de tus finanzas cada lunes.</p>
              </div>
              <Switch checked={true} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
