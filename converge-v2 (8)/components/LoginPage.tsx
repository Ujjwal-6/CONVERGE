import React, { useState } from 'react';
import { 
  ArrowRight, 
  Cpu, 
  Network, 
  Lock,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { loginUser } from '../services/api.service';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateToSignup: () => void;
}

/**
 * ==============================================================================
 * COMPONENT: CONVERGE LOGIN PAGE
 * ==============================================================================
 */
export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToSignup }) => {
  // STATE MANAGEMENT
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * HANDLER: Submit Form
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // API CALL: Sends credentials to the backend
      await loginUser(email, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      setError("Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-white">
      
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[55%] bg-converge-bg relative overflow-hidden flex-col justify-between p-16 text-white">
        
        {/* BACKGROUND VISUALIZATION */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-converge-violet/30 rounded-full blur-[128px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-converge-blue/20 rounded-full blur-[96px] animate-pulse-slow delay-700"></div>
        </div>

        {/* BRAND LOGO AREA */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-2.5 rounded-xl shadow-lg">
             <Network className="text-converge-blue w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight text-white">Converge</span>
        </div>

        {/* HERO COPY AREA */}
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-converge-emerald/30 bg-converge-emerald/10 text-converge-emerald text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-converge-emerald mr-2 animate-pulse"></span>
            SYSTEM ONLINE: v1.2
          </div>
          
          <h1 className="text-5xl font-display font-bold leading-tight mb-6">
            Where Intent Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-converge-blue to-converge-violet">Execution.</span>
          </h1>
          
          <p className="text-converge-muted text-lg leading-relaxed font-light mb-8">
            The ecosystem for campus innovation. Upload your resume, let our Gemini AI parse your skills, and get matched with collaborators instantly.
          </p>

          <div className="flex gap-4 text-sm font-medium text-slate-400">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-converge-blue" /> Secure Access</div>
            <div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-converge-violet" /> AI Powered</div>
          </div>
        </div>

        {/* FOOTER AREA */}
        <div className="relative z-10 text-xs font-mono text-slate-500 uppercase tracking-widest">
          Engineered by Team SUNS
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md">
          
          {/* Mobile Header */}
          <div className="lg:hidden mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Network className="text-converge-blue w-8 h-8" />
              <span className="text-2xl font-display font-bold text-slate-900">Converge</span>
            </div>
            <p className="text-slate-500 text-sm">Campus Innovation Platform</p>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500">Enter your credentials to access the ecosystem.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* INPUT GROUP: EMAIL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Institutional Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-converge-blue transition-colors" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-converge-blue/20 focus:border-converge-blue transition-all bg-gray-50 focus:bg-white"
                  placeholder="student@university.edu"
                />
              </div>
            </div>

            {/* INPUT GROUP: PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-converge-blue transition-colors" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-converge-blue/20 focus:border-converge-blue transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* ERROR ALERT BOX */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center animate-pulse">
                <ShieldCheck className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-converge-blue hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                   <Cpu className="w-4 h-4 animate-spin" /> Verifying Credentials...
                </span>
              ) : (
                <>
                  Access Terminal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* SIGN UP FOOTER */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              No account?{' '}
              <button onClick={onNavigateToSignup} className="text-converge-blue font-semibold hover:underline">
                Initialize Profile
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};