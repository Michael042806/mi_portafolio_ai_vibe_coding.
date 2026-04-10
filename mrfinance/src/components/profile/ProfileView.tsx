import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Shield, Camera, Save } from "lucide-react";
import { useState } from "react";
import { User as UserType } from "@/types";
import { motion } from "framer-motion";

interface ProfileViewProps {
  user: UserType;
  onUpdateUser: (name: string) => void;
}

export function ProfileView({ user, onUpdateUser }: ProfileViewProps) {
  const [name, setName] = useState(user.name);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdateUser(name);
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative group">
          <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-blue-200 group-hover:scale-105 transition-transform duration-500">
            {user.name[0].toUpperCase()}
          </div>
          <Button size="icon" className="absolute -bottom-2 -right-2 rounded-2xl bg-white text-slate-600 shadow-xl border border-slate-100 hover:bg-slate-50 h-10 w-10">
            <Camera className="w-5 h-5" />
          </Button>
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{user.name}</h2>
          <p className="text-slate-500 font-medium">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="border-b border-slate-50 p-8">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              Información Personal
            </CardTitle>
            <CardDescription>Gestiona tus datos básicos de cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Nombre Completo</Label>
                <div className="flex gap-3">
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    disabled={!isEditing}
                    className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 disabled:opacity-100 disabled:cursor-default font-medium"
                  />
                  {!isEditing ? (
                    <Button 
                      variant="outline" 
                      className="h-12 px-6 rounded-2xl border-slate-200 font-bold hover:bg-slate-50"
                      onClick={() => setIsEditing(true)}
                    >
                      Editar
                    </Button>
                  ) : (
                    <Button 
                      className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100"
                      onClick={handleSave}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <Input 
                    value={user.email} 
                    disabled 
                    className="h-12 pl-12 rounded-2xl bg-slate-50 border-transparent disabled:opacity-50 font-medium"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="border-b border-slate-50 p-8">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-600" />
              Seguridad
            </CardTitle>
            <CardDescription>Protege tu cuenta y tus datos financieros.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900">Contraseña</p>
                <p className="text-xs text-slate-500">Último cambio hace 3 meses</p>
              </div>
              <Button variant="outline" className="rounded-xl border-slate-200 font-bold hover:bg-white">
                Cambiar
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900">Autenticación de dos pasos</p>
                <p className="text-xs text-slate-500">Añade una capa extra de seguridad</p>
              </div>
              <Button variant="outline" className="rounded-xl border-slate-200 font-bold hover:bg-white text-emerald-600">
                Activar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
