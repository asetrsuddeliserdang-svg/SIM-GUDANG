import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { ShieldCheck, Hospital, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Gagal login', { description: 'Email dan password harus diisi.' });
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login Berhasil', { description: 'Selamat datang di SIM-GUDANG.' });
    } catch (error: any) {
      console.error("Login failed", error);
      toast.error('Login Gagal', { description: error.message || 'Email atau password salah.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans selection:bg-sky-100 selection:text-sky-900">
      <Card className="w-full max-w-sm shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-slate-200 overflow-hidden bg-white rounded-3xl">
        <CardHeader className="text-center space-y-6 pt-10 pb-6 px-8">
          <div className="mx-auto w-20 h-20 bg-sky-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-sky-600/20 rotate-3 transform hover:rotate-0 transition-transform duration-500">
            <Hospital size={40} strokeWidth={2.5} />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-black tracking-tighter text-slate-900 uppercase">SIM-GUDANG</CardTitle>
            <div className="h-1 w-12 bg-sky-600 mx-auto rounded-full"></div>
            <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest px-4">
              RSUD Professional Logistics Management System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors">
                  <Mail size={16} />
                </div>
                <Input 
                  type="email"
                  placeholder="name@example.com"
                  className="pl-11 h-12 bg-slate-50 border-slate-100 rounded-2xl focus:ring-sky-600/20 focus:border-sky-600 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</Label>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors">
                  <Lock size={16} />
                </div>
                <Input 
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 bg-slate-50 border-slate-100 rounded-2xl focus:ring-sky-600/20 focus:border-sky-600 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit"
              className="w-full bg-[#111827] hover:bg-slate-800 h-14 text-sm font-bold uppercase tracking-widest shadow-lg shadow-slate-900/10 rounded-2xl transition-all active:scale-[0.98] mt-4"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  AUTHENTICATING...
                </div>
              ) : (
                "MASUK KE SISTEM"
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 leading-relaxed group hover:bg-sky-50 hover:border-sky-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck className="text-sky-600" size={16} />
            </div>
            <p className="font-medium group-hover:text-sky-700 transition-colors font-mono tracking-tight uppercase text-[9px]">
              Akses terbatas untuk personel gudang dan unit kerja RS yang terdaftar.
            </p>
          </div>
          
          <div className="text-center">
             <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
               v3.1.0 • secure cloud access
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
