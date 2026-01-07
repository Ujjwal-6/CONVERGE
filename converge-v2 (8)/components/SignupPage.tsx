import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Cpu, 
  Network, 
  Lock, 
  Mail, 
  User, 
  ShieldAlert, 
  ChevronLeft, 
  FileText, 
  Building2, 
  BookOpen, 
  GraduationCap, 
  Signal,
  FileUp,
  CheckCircle
} from 'lucide-react';
import { registerUser, fileToBase64 } from '../services/api.service';

// Access global PDF.js library loaded via script tag in index.html
// This avoids ESM import issues with pdfjs-dist
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface SignupPageProps {
  onSignupSuccess: () => void;
  onNavigateToLogin: () => void;
}

/**
 * ==============================================================================
 * COMPONENT: CONVERGE SIGNUP PAGE
 * ==============================================================================
 * Handles new user registration.
 * 
 * FEATURES:
 * - Client-Side PDF Parsing: Uploaded PDFs are processed in the browser to extract text.
 * - JSON Submission: Extracted text is sent as a JSON string.
 */
export const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess, onNavigateToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    department: '',
    year: '',
    availability: 'Available'
  });
  
  const [resumeText, setResumeText] = useState('');
  const [resumeBase64, setResumeBase64] = useState(''); // NEW: Store raw base64
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configure PDF.js worker on mount
  useEffect(() => {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /**
   * HANDLER: File Upload & Extraction
   * Reads PDF binary -> Extracts Text -> Populates resumeText state
   * ALSO converts file to Base64 for backend storage.
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("Only PDF documents are supported for auto-extraction.");
      return;
    }

    if (!window.pdfjsLib) {
      setError("PDF processing library not loaded. Please refresh the page.");
      return;
    }

    setIsProcessingPdf(true);
    setError(null);

    try {
      // 1. Convert to Base64 for backend storage
      const base64String = await fileToBase64(file);
      setResumeBase64(base64String);

      // 2. Parse Text for Gemini
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Iterate through all pages to extract text
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Join items with space, add double newline for page breaks
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      setResumeText(fullText.trim());
      
    } catch (err) {
      console.error("PDF Processing failed:", err);
      setError("Failed to parse PDF content.");
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    if (!formData.institution || !formData.department || !formData.year) {
      setError("Please fill in all academic details.");
      setIsLoading(false);
      return;
    }

    if (!resumeText.trim()) {
      setError("Please upload a PDF resume to initialize your profile.");
      setIsLoading(false);
      return;
    }

    try {
      // Call API Service (Sends as JSON with Base64 PDF)
      await registerUser(
        formData.fullName, 
        formData.email, 
        formData.password, 
        resumeText, 
        formData.institution,
        formData.department,
        formData.year,
        formData.availability,
        resumeBase64 // Pass the base64 string
      );
      onSignupSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-row font-sans bg-white">
      
      {/* 
        LEFT PANEL ("THE NEXUS" - Visuals)
      */}
      <div className="hidden lg:flex lg:w-[55%] bg-converge-bg relative overflow-hidden flex-col justify-between p-16 text-white sticky top-0 h-screen shrink-0">
        
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute bottom-1/3 left-1/3 w-[500px] h-[500px] bg-converge-indigo/20 rounded-full blur-[128px] animate-pulse-slow"></div>
            <div className="absolute top-10 right-10 w-64 h-64 bg-converge-blue/20 rounded-full blur-[96px] animate-pulse-slow delay-700"></div>
        </div>

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-2.5 rounded-xl shadow-lg">
             <Network className="text-converge-emerald w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight text-white">Converge</span>
        </div>

        {/* Copy */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-display font-bold leading-tight mb-6">
            Initialize Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-converge-emerald to-converge-blue">Identity.</span>
          </h1>
          <p className="text-converge-muted text-lg leading-relaxed font-light mb-8">
            Join the decentralized research network. Create your academic node to begin collaborating with peers and utilizing Gemini-powered tools.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs font-mono text-slate-500 uppercase tracking-widest">
          System Status: All Systems Go
        </div>
      </div>

      {/* 
        RIGHT PANEL ("THE PORTAL" - Form)
      */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-white min-h-screen">
        <div className="w-full max-w-md py-8">
          
          {/* Mobile Header */}
          <div className="lg:hidden mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Network className="text-converge-blue w-8 h-8" />
              <span className="text-2xl font-display font-bold text-slate-900">Converge</span>
            </div>
          </div>

          <button 
            onClick={onNavigateToLogin}
            className="group flex items-center text-sm text-slate-500 hover:text-converge-blue mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Access Terminal
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-500">Enter your academic credentials to register.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            
            {/* --- PERSONAL DETAILS SECTION --- */}
            <div className="space-y-4">
              {/* FULL NAME */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-converge-blue transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-converge-blue/20 focus:border-converge-blue transition-all bg-gray-50 focus:bg-white"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Institutional Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-converge-blue transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-converge-blue/20 focus:border-converge-blue transition-all bg-gray-50 focus:bg-white"
                    placeholder="student@university.edu"
                  />
                </div>
              </div>
            </div>

            {/* --- ACADEMIC DETAILS SECTION --- */}
            <div className="pt-2 pb-2 border-t border-gray-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 mt-2">Academic Profile</p>
              
              <div className="space-y-4">
                {/* INSTITUTION */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Institution</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400 group-focus-within:text-converge-blue transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      name="institution"
                      required
                      value={formData.institution}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-converge-blue/20 focus:border-converge-blue transition-all bg-gray-50 focus:bg-white"
                      placeholder="University of Technology"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   {/* DEPARTMENT */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Department</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BookOpen className="h-5 w-5 text-gray-400 group-focus-within:text-converge-blue transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        name="department"
                        required
                        value={formData.department}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-converge-blue/20 focus:border-converge-blue transition-all bg-gray-50 focus:bg-white"
                        placeholder="CS / Eng"
                      />
                    </div>
                  </div>

                  {/* YEAR */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Year</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GraduationCap className="h-5 w-5 text-gray-400 group-focus-within:text-converge-blue transition-colors" />
                      </div>
                      <input 
                        type="number"
                        name="year"
                        required
                        min="1"
                        placeholder="e.g. 1"
                        value={formData.year}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-converge-blue/20 focus:border-converge-blue transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                 {/* AVAILABILITY */}
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Collaboration Status</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Signal className={`h-5 w-5 transition-colors ${formData.availability === 'Available' ? 'text-converge-emerald' : 'text-gray-400'}`} />
                      </div>
                      <select 
                        name="availability"
                        required
                        value={formData.availability}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-8 py-3 border border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-converge-blue/20 focus:border-converge-blue transition-all bg-gray-50 focus:bg-white appearance-none"
                      >
                        <option value="Available">Open to Collaborate</option>
                        <option value="Not Available">Not Available</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
              </div>
            </div>

            {/* --- SECURITY & RESUME SECTION --- */}
            <div className="pt-2 border-t border-gray-100 space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 mt-2">Credentials</p>
              
               {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-converge-blue transition-colors" />
                  </div>
                  <input 
                    type="password" 
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-converge-blue/20 focus:border-converge-blue transition-all bg-gray-50 focus:bg-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldAlert className="h-5 w-5 text-gray-400 group-focus-within:text-converge-blue transition-colors" />
                  </div>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-converge-blue/20 focus:border-converge-blue transition-all bg-gray-50 focus:bg-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* RESUME EXTRACTION SECTION */}
              <div className="space-y-3">
                 <label className="block text-sm font-medium text-slate-700 ml-1">Resume Data</label>
                 
                 {/* PDF Upload Zone */}
                 <div className="relative">
                    <input 
                      type="file" 
                      id="resume-upload" 
                      className="hidden" 
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      disabled={isProcessingPdf || isLoading}
                    />
                    <label 
                      htmlFor="resume-upload" 
                      className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group
                        ${isProcessingPdf 
                          ? 'bg-blue-50 border-blue-200' 
                          : resumeText 
                            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-converge-blue'
                        }`}
                    >
                      {isProcessingPdf ? (
                        <div className="flex flex-col items-center gap-2 text-converge-blue animate-pulse">
                          <Cpu className="w-6 h-6 animate-spin" />
                          <span className="text-xs font-semibold">Extracting Neural Data...</span>
                        </div>
                      ) : resumeText ? (
                        <div className="flex flex-col items-center gap-2 text-emerald-600">
                          <CheckCircle className="w-6 h-6" />
                          <div className="text-center">
                            <span className="text-xs font-semibold">Resume Analyzed</span>
                            <span className="text-[10px] block text-emerald-500">Click to replace file</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-converge-blue">
                          <FileUp className="w-6 h-6" />
                          <div className="text-center">
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-converge-blue">Click to Upload PDF</span>
                            <span className="text-[10px] block text-slate-400">Auto-extracts data for profile</span>
                          </div>
                        </div>
                      )}
                    </label>
                 </div>
              </div>
            </div>

            {/* ERROR MSG */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center animate-pulse">
                <ShieldAlert className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            {/* SUBMIT */}
            <button 
              type="submit" 
              disabled={isLoading || isProcessingPdf}
              className="w-full bg-converge-blue hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                   <Cpu className="w-4 h-4 animate-spin" /> Registering...
                </span>
              ) : (
                <>
                  Initialize Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              Already have an ID?{' '}
              <button onClick={onNavigateToLogin} className="text-converge-blue font-semibold hover:underline">
                Access Terminal
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
