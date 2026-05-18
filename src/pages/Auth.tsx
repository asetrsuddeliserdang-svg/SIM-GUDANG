import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { ShieldCheck, Hospital } from 'lucide-react';
import { UserRole } from '../types';

export default function Auth() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user profile with default UNIT role
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          role: UserRole.UNIT,
          status: 'AKTIF'
        });
      }
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans">
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
        <CardContent className="space-y-8 px-8 pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 leading-relaxed group hover:bg-sky-50 hover:border-sky-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                <ShieldCheck className="text-sky-600" size={16} />
              </div>
              <p className="font-medium group-hover:text-sky-700 transition-colors font-mono tracking-tight uppercase text-[9px]">
                Akses terbatas untuk personel gudang dan unit kerja rumah sakit terdaftar.
              </p>
            </div>
            
            <Button 
              className="w-full bg-[#111827] hover:bg-slate-800 h-14 text-sm font-bold uppercase tracking-widest shadow-lg shadow-slate-900/10 rounded-2xl transition-all active:scale-[0.98]"
              onClick={handleLogin}
              disabled={loading}
            >
              <div className="flex items-center gap-3">
                {loading ? (
                   <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4 brightness-100 grayscale hover:grayscale-0 transition-all" alt="Google" />
                )}
                {loading ? "AUTHENTICATING..." : "LOGIN WITH GOOGLE"}
              </div>
            </Button>
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
