import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShieldCheck, Lock, Mail, Cpu, Orbit, Package, Search, Activity, Info, ArrowRight, BarChart3, Truck, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

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

  const featureCards = [
    { label: "Permintaan Barang", sub: "Ajukan kebutuhan unit", icon: Package, color: "cyan" },
    { label: "Monitoring Stok", sub: "Data persediaan realtime", icon: Activity, color: "indigo" },
    { label: "Barang Masuk", sub: "Manajemen penerimaan", icon: Truck, color: "cyan" },
    { label: "Barang Keluar", sub: "Distribusi antar unit", icon: ClipboardList, color: "indigo" },
    { label: "Laporan Gudang", sub: "Analisis & audit data", icon: BarChart3, color: "slate" },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#020617] font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* LEFT SIDE: Branding & Features (50%) */}
      <div className="relative w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-16 overflow-hidden border-r border-white/5">
        {/* Background Tech Decor */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[140px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ 
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px' 
            }} 
          />
        </div>

        {/* Brand Header */}
        <div className="relative z-10 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 py-4"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg border border-white/20">
              <Orbit size={24} strokeWidth={1.5} className="animate-pulse" />
            </div>
            <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
            <span className="text-[10px] font-heading font-black text-cyan-500 uppercase tracking-[0.5em]">SIM.PROTOCOL v3</span>
          </motion.div>

          <div className="space-y-4 max-w-xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-8xl font-heading font-bold text-white tracking-tighter leading-none"
            >
              SIM<span className="text-cyan-500">.</span>GUDANG
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg lg:text-xl text-slate-400 font-medium leading-relaxed"
            >
              Sistem pengelolaan persediaan barang dan distribusi kebutuhan unit rumah sakit.
            </motion.p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12 lg:mt-0">
          {featureCards.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              className="p-5 bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl group transition-all cursor-default"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl mb-4 flex items-center justify-center border transition-all",
                item.color === 'cyan' && "bg-cyan-500/5 border-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500/10 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]",
                item.color === 'indigo' && "bg-indigo-500/5 border-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500/10 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]",
                item.color === 'slate' && "bg-slate-500/5 border-slate-500/10 text-slate-400 group-hover:bg-slate-500/10"
              )}>
                <item.icon size={20} strokeWidth={1.5} />
              </div>
              <h4 className="text-xs font-heading font-black text-white uppercase tracking-widest">{item.label}</h4>
              <p className="text-[9px] font-heading font-medium text-slate-500 uppercase tracking-widest mt-1 group-hover:text-slate-400 transition-colors tracking-tight">{item.sub}</p>
            </motion.div>
          ))}
          
          {/* Quick Request Button as a Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={() => navigate('/request')}
            className="p-5 bg-cyan-600/10 border border-cyan-500/20 rounded-2xl group transition-all cursor-pointer hover:bg-cyan-600/20 lg:col-span-1 flex flex-col justify-center"
          >
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-heading font-black text-cyan-400 uppercase tracking-widest">Quick Portal</span>
               <ArrowRight size={14} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-sm font-heading font-black text-white uppercase tracking-widest mt-2">Permintaan Barang</h4>
          </motion.div>
        </div>

        {/* Footer Brand */}
        <div className="relative z-10 pt-12 lg:pt-0">
           <p className="text-[9px] font-heading font-bold uppercase tracking-[0.6em] text-slate-600">
             BAGIAN ASET • RSUD Drs. H. AMRI TAMBUNAN • 2026
           </p>
        </div>
      </div>

      {/* RIGHT SIDE: Login Terminal (50%) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden bg-slate-950">
        {/* Subtle Background Glow for Login Side */}
        <div className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] w-[80%] h-[80%] bg-cyan-400/5 rounded-full blur-[100px]" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[400px]"
        >
          <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[40px] overflow-hidden shadow-2xl shadow-black/80">
            <div className="p-10 lg:p-12 space-y-10">
              <div className="space-y-2">
                <h2 className="text-3xl font-heading font-bold text-white tracking-tight">Sign In</h2>
                <p className="text-sm text-slate-500 font-medium">Access your enterprise terminal.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Authentication ID</Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                      <Mail size={16} strokeWidth={1.5} />
                    </div>
                    <Input 
                      type="email"
                      placeholder="protocol@rsud.system"
                      className="pl-12 h-14 bg-slate-800/30 border-white/5 rounded-2xl focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-medium text-white placeholder:text-slate-600"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Access Key</Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                      <Lock size={16} strokeWidth={1.5} />
                    </div>
                    <Input 
                      type="password"
                      placeholder="••••••••"
                      className="pl-12 h-14 bg-slate-800/30 border-white/5 rounded-2xl focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-medium text-white placeholder:text-slate-600"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button 
                    type="submit"
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white h-14 text-xs font-heading font-bold uppercase tracking-[0.3em] shadow-lg shadow-cyan-600/10 rounded-2xl border border-white/10 transition-all relative overflow-hidden group"
                    disabled={loading}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Cpu size={16} className="animate-spin" />
                        Validating...
                      </div>
                    ) : (
                      "Initialize Access"
                    )}
                  </Button>
                </motion.div>
              </form>

              <div className="pt-6 border-t border-white/5 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5 text-[9px] text-slate-500 leading-relaxed">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
                    <ShieldCheck className="text-cyan-400" size={16} strokeWidth={1.5} />
                  </div>
                  <p className="font-heading font-medium tracking-wider uppercase opacity-50">
                    System terminal is currently active. All authentication attempts are logged.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* External Support Link */}
          <div className="mt-8 text-center text-[10px] font-heading font-bold text-slate-600 uppercase tracking-widest">
            Trouble signing in? <span className="text-cyan-600 hover:text-cyan-400 cursor-pointer transition-colors px-1 underline decoration-cyan-600/30">Contact Administrator</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
