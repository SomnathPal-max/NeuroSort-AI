import React, { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle } from '../lib/firebase';
import { Brain, LogIn, Loader2 } from 'lucide-react';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Authenticating...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
           <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full blur-[100px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-500 rounded-full blur-[100px]" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl z-10 w-full max-w-md flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-slate-700">
            <Brain className="w-8 h-8 text-pink-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">NeuroSort AI</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Intelligent workspace analysis and file organization system. Please sign in to access your secure workspace.
          </p>
          
          <button 
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 font-semibold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
