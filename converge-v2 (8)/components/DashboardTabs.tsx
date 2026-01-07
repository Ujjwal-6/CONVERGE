import React, { useState, useEffect } from 'react';
import { ParsedProfile, Opportunity, TeammateMatch, MLMatchResponse, TeammateRequest, Teammate, RatingSubmission, MLMatchCandidate } from '../types';
import { 
  Terminal, User, Layers, Search, 
  Code, FlaskConical, Globe, Github, 
  ExternalLink, Send, Sparkles, CheckCircle,
  FileText, Trophy, Loader2, AlertCircle, 
  FolderGit2, ArrowLeft, BarChart, Users,
  Mail, Building2, BookOpen, GraduationCap, Download, Plus,
  Inbox, Check, X, Clock, AlertTriangle, Star, Trash2,
  UploadCloud, BadgeCheck, Lock, Briefcase, Zap
} from 'lucide-react';
import { 
    getMyProjects, 
    getExploreProjects, 
    createProject, 
    getTeammateMatches, 
    getUserProfileById, 
    addTeammate, 
    getProjectDetails, 
    getTeammateRequests, 
    acceptTeammateRequest, 
    submitTeammateRating, 
    completeProject,
    downloadMyResume,
    downloadUserResume,
    uploadUserResume,
    fileToBase64
} from '../services/api.service';

// Access global PDF.js library
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

/**
 * ============================================================================
 * TAB 1: PROFILE TAB (Clean UI)
 * ============================================================================
 */
interface ProfileTabProps {
  data: ParsedProfile | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ data, loading, error, onRetry }) => {
    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;
    if (error) return (
        <div className="p-6 bg-red-50 rounded-xl border border-red-100 text-red-600 flex flex-col items-center text-center">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="font-semibold">{error}</p>
            <button onClick={onRetry} className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50">Retry</button>
        </div>
    );
    if (!data) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{data.fullName || data.name}</h2>
                    <p className="text-slate-500">{data.email}</p>
                </div>
                <button onClick={downloadMyResume} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                    <Download className="w-4 h-4" /> Download Resume
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-converge-blue" /> Academic Info
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-200/50 pb-2">
                            <span className="text-slate-500">Institution</span>
                            <span className="font-medium">{data.institution || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/50 pb-2">
                            <span className="text-slate-500">Department</span>
                            <span className="font-medium">{data.department || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/50 pb-2">
                            <span className="text-slate-500">Year</span>
                            <span className="font-medium">{data.year || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Availability</span>
                            <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${data.availability === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {data.availability || 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Code className="w-4 h-4 text-converge-violet" /> Skills & Stats
                    </h3>
                    {data.skills && (
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Detected Skills</p>
                            <div className="flex flex-wrap gap-2">
                                {(Array.isArray(data.skills) ? data.skills : (data.skills || '').split(',')).map((skill: string, i: number) => (
                                    <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-between text-sm bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500">Community Trust Score</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-4 h-4 fill-amber-500" />
                            <span>{data.rating || 'New'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100">
                 <UploadResumeTab />
            </div>
        </div>
    );
};

/**
 * ============================================================================
 * COMPONENT: GENERIC PROJECT FEED
 * ============================================================================
 */
interface ProjectFeedProps {
  title: string;
  fetchFunction: () => Promise<Opportunity[]>;
  emptyMessage: string;
  emptySubMessage?: string;
  onItemClick?: (item: Opportunity) => void;
  externalData?: Opportunity[];
  externalLoading?: boolean;
  onExternalRefresh?: () => void;
  renderActions?: (item: Opportunity) => React.ReactNode;
}

const ProjectFeed: React.FC<ProjectFeedProps> = ({ 
  title, fetchFunction, emptyMessage, emptySubMessage, onItemClick,
  externalData, externalLoading, onExternalRefresh, renderActions
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PROJECT' | 'RESEARCH' | 'OPEN_SOURCE'>('ALL');
  const [internalItems, setInternalItems] = useState<Opportunity[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);

  const isControlled = externalData !== undefined;
  const items = isControlled ? externalData! : internalItems;
  const loading = isControlled ? (externalLoading || false) : internalLoading;

  const fetchFeed = () => {
    if (isControlled && onExternalRefresh) {
        onExternalRefresh();
    } else if (!isControlled) {
        setInternalLoading(true);
        fetchFunction()
            .then(data => setInternalItems(data))
            .catch(err => console.error(err))
            .finally(() => setInternalLoading(false));
    }
  };

  useEffect(() => {
    if (!isControlled) {
        fetchFeed();
    }
  }, [fetchFunction, isControlled]);

  const filteredItems = items.filter(item => {
    if (filter === 'ALL') return true;
    return item.type === filter;
  });

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <h2 className="text-xl font-display font-bold text-slate-900 hidden sm:block">{title}</h2>
         <div className="flex flex-wrap gap-2">
            {['ALL', 'PROJECT', 'RESEARCH', 'OPEN_SOURCE'].map((f) => (
            <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all border ${
                filter === f 
                ? 'bg-converge-blue text-white border-converge-blue shadow-lg shadow-blue-500/20' 
                : 'bg-white text-slate-500 border-gray-200 hover:border-converge-blue/50 hover:text-converge-blue'
                }`}
            >
                {f.replace('_', ' ')}
            </button>
            ))}
            <button onClick={fetchFeed} className="p-2 text-slate-400 hover:text-converge-blue transition-colors rounded-full hover:bg-slate-100" title="Refresh">
              <Layers className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="space-y-4 pb-20">
        {loading ? (
           <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-converge-blue" /></div>
        ) : filteredItems.length === 0 ? (
           <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <p className="mb-2 font-medium">{emptyMessage}</p>
               {emptySubMessage && <p className="text-xs">{emptySubMessage}</p>}
           </div>
        ) : (
          filteredItems.map(item => {
            const isCompleted = item.status === 'COMPLETED';

            return (
                <div 
                    key={item.id} 
                    onClick={() => {
                        if (onItemClick) {
                            onItemClick(item);
                        }
                    }}
                    className={`bg-white border p-6 rounded-xl transition-all group relative overflow-hidden ${
                        isCompleted 
                        ? 'border-gray-100 opacity-80 cursor-default bg-slate-50/50' 
                        : 'border-gray-100 hover:shadow-md cursor-pointer hover:border-converge-blue/50'
                    }`}
                >
                <div className={`absolute top-0 left-0 w-1 h-full ${
                    isCompleted ? 'bg-slate-300' :
                    item.type === 'PROJECT' ? 'bg-converge-blue' : 
                    item.type === 'RESEARCH' ? 'bg-converge-violet' : 'bg-converge-emerald'
                }`}></div>
                
                {isCompleted && (
                    <div className="absolute top-0 right-0 bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> COMPLETED
                    </div>
                )}

                <div className="flex justify-between items-start mb-3 pl-3">
                    <div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded border mb-2 inline-block ${
                            isCompleted ? 'text-slate-500 bg-slate-100 border-slate-200' :
                            item.type === 'PROJECT' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                            item.type === 'RESEARCH' ? 'text-violet-600 bg-violet-50 border-violet-100' :
                            'text-emerald-600 bg-emerald-50 border-emerald-100'
                        }`}>
                        {item.type} {item.subType ? `• ${item.subType}` : ''}
                        </span>
                        <h3 className={`text-lg font-display font-bold transition-colors ${
                            isCompleted ? 'text-slate-600' : 'text-slate-900 group-hover:text-converge-blue'
                        }`}>{item.title}</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{item.date}</span>
                </div>

                <p className="text-slate-600 text-sm mb-4 leading-relaxed pl-3 max-w-3xl whitespace-pre-line line-clamp-3">{item.description}</p>

                <div className="flex flex-wrap gap-2 mb-4 pl-3">
                    {Array.isArray(item.technologies) && item.technologies.map((tech, idx) => (
                    <span key={`${tech}-${idx}`} className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {tech}
                    </span>
                    ))}
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2 pl-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 overflow-hidden">
                        <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] ${isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600'}`}>
                            {item.postedBy.substring(0,1).toUpperCase()}
                        </div>
                        <span className="truncate" title={item.postedBy}>{item.postedBy}</span>
                    </div>
                    
                    <div className="flex gap-3 shrink-0 items-center">
                        {renderActions && renderActions(item)}
                        
                        {item.githubUrl && (
                        <a href={item.githubUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-slate-400 hover:text-black transition-colors flex items-center gap-1 text-xs font-semibold">
                            <Github className="w-4 h-4" /> Code
                        </a>
                        )}
                    </div>
                </div>
                </div>
            )
          })
        )}
      </div>
    </div>
  );
};

/**
 * ============================================================================
 * HELPER: DETAILED MATCH CARD COMPONENT
 * ============================================================================
 */
interface DetailedMatchCardProps {
    match: MLMatchCandidate;
    onAdd: () => void;
    onView: () => void;
    onDownload: () => void; // New prop for download action
    isInvited: boolean;
    isTopMatch: boolean;
}

const ProgressBar = ({ label, value, subtext, colorClass }: any) => (
  <div className="flex-1">
    <div className="flex justify-between mb-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-bold text-slate-700">{Math.round(value)}/100</span>
    </div>
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${value}%` }}></div>
    </div>
    <p className="text-[10px] text-slate-400">{subtext}</p>
  </div>
);

const DetailedMatchCard: React.FC<DetailedMatchCardProps> = ({ match, onAdd, onView, onDownload, isInvited, isTopMatch }) => {
    return (
        <div 
            onClick={onView} 
            className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative cursor-pointer"
        >
            {isTopMatch && (
                <div className="absolute top-0 right-0 bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg z-10">
                    TOP MATCH
                </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Score */}
                <div className="flex flex-col items-center justify-center border-r border-gray-100 pr-6 min-w-[100px]">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xl mb-2">
                         {match.profile.name ? match.profile.name.substring(0,1) : '?'}
                    </div>
                    <span className="text-2xl font-bold text-converge-blue">
                        {(match.final_score * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">MATCH SCORE</span>
                    <div className="flex items-center gap-1 mt-1 bg-amber-50 px-2 py-0.5 rounded text-amber-600 text-xs font-bold border border-amber-100">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {(match.final_score * 5).toFixed(1)}
                    </div>
                </div>

                {/* Right: Content */}
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 uppercase">{match.profile.name || "Anonymous Candidate"}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Year {match.profile.year}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                    match.profile.availability === 'Available' || match.profile.availability?.toLowerCase().includes('high')
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {match.profile.availability?.toUpperCase() || 'UNKNOWN'}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onView(); }} 
                            className="text-slate-400 hover:text-converge-blue"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 mb-6 bg-slate-50/50 p-4 rounded-lg border border-slate-50">
                        <ProgressBar 
                            label="CAPABILITY (LAYER 1)" 
                            value={match.layer1_capability.capability_score * 100} 
                            colorClass="bg-converge-blue"
                            subtext={`Skills: ${Math.round(match.layer1_capability.s_skills * 100)}% • Semantic: ${Math.round(match.layer1_capability.s_semantic * 100)}%`}
                        />
                        <ProgressBar 
                            label="TRUST (LAYER 2)" 
                            value={match.layer2_trust.trust_score * 100} 
                            colorClass="bg-converge-violet"
                            subtext={`Reliability: ${Math.round(match.layer2_trust.s_reliability * 100)}%`}
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDownload(); }}
                            className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-slate-50 flex items-center gap-2"
                        >
                            <FileText className="w-3 h-3" /> RESUME
                        </button>
                        <button 
                             onClick={(e) => { e.stopPropagation(); onAdd(); }}
                             disabled={isInvited}
                             className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors ${
                                 isInvited 
                                 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default'
                                 : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200'
                             }`}
                        >
                            {isInvited ? <CheckCircle className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            {isInvited ? 'INVITED' : 'ADD TEAMMATE'}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onView(); }}
                            className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Mail className="w-3 h-3" /> CONTACT ME
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * ============================================================================
 * COMPONENT: MATCH RESULTS VIEW
 * ============================================================================
 */
interface MatchResultsViewProps {
    matchData: MLMatchResponse;
    onSelectCandidate: (id: number) => void;
    onAddTeammate: (id: number) => void;
    sentRequests: Set<number>;
}

const MatchResultsView: React.FC<MatchResultsViewProps> = ({ matchData, onSelectCandidate, onAddTeammate, sentRequests }) => {
    return (
        <div className="grid grid-cols-1 gap-4">
            {matchData.matches.map((match, idx) => (
                <DetailedMatchCard 
                    key={match.resume_id}
                    match={match}
                    onView={() => onSelectCandidate(match.resume_id)}
                    onDownload={() => downloadUserResume(match.resume_id)}
                    onAdd={() => onAddTeammate(match.resume_id)}
                    isInvited={sentRequests.has(match.resume_id)}
                    isTopMatch={idx === 0}
                />
            ))}
        </div>
    );
};

/**
 * ============================================================================
 * COMPONENT: PROJECT SUMMARY CARD
 * ============================================================================
 */
const ProjectSummaryCard = ({ project }: { project: any }) => {
    // Helper to safely extract skills as an array
    const getSkills = (): string[] => {
        const skillsRaw = project.technologies || project.requiredSkills;
        if (Array.isArray(skillsRaw)) return skillsRaw;
        if (typeof skillsRaw === 'string') return skillsRaw.split(',').map((s: string) => s.trim());
        return [];
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4 relative">
            <div className="absolute top-4 right-4 text-xs font-mono text-slate-300 border border-slate-100 px-2 py-1 rounded">
                ID: {project.id || project.project_id}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">{project.title}</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{project.description}</p>
            <div className="flex flex-wrap gap-2">
                {getSkills().map((t: string, i: number) => (
                    <span key={i} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">{t}</span>
                ))}
            </div>
        </div>
    );
};

/**
 * ============================================================================
 * COMPONENT: TEAMMATE DETAIL VIEW (Read-Only Profile)
 * ============================================================================
 */
export const TeammateDetailView: React.FC<{ userId: number | string, onBack: () => void }> = ({ userId, onBack }) => {
    const [profile, setProfile] = useState<ParsedProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUserProfileById(userId)
            .then(setProfile)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) return <div className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto text-slate-400" /></div>;
    if (!profile) return <div className="p-12 text-center text-red-500">User not found</div>;

    const getPdfSrc = () => {
        if (profile.resumePdf) {
            if (profile.resumePdf.startsWith('data:application/pdf')) {
                return profile.resumePdf;
            }
            return `data:application/pdf;base64,${profile.resumePdf}`;
        }
        return null;
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-[calc(100vh-140px)] flex flex-col">
            <button 
                onClick={onBack}
                className="flex items-center text-sm font-medium text-slate-500 hover:text-converge-blue transition-colors mb-4"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-y-auto custom-scrollbar p-6">
                    <div className="flex items-start gap-6 mb-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-slate-400">
                            {profile.name ? profile.name.substring(0,1) : '?'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                            <p className="text-slate-500 mb-2">{profile.email}</p>
                            <div className="flex gap-2">
                                <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600">{profile.department}</span>
                                <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600">Year {profile.year}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8">
                         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Skills</h3>
                         <div className="flex flex-wrap gap-2">
                            {(typeof profile.skills === 'string' ? profile.skills.split(',') : (profile.skills || [])).map((s: string, i: number) => (
                                <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700">{s.trim()}</span>
                            ))}
                         </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden relative">
                    <div className="p-3 bg-slate-900 border-b border-slate-700 flex justify-between items-center text-slate-400">
                        <span className="text-xs font-mono flex items-center gap-2">
                            <FileText className="w-4 h-4" /> RESUME_VIEWER
                        </span>
                        {getPdfSrc() && (
                            <a href={getPdfSrc()!} download="resume.pdf" className="text-xs hover:text-white flex items-center gap-1 transition-colors">
                                <Download className="w-3 h-3" /> Download
                            </a>
                        )}
                    </div>
                    
                    <div className="flex-1 bg-slate-900/50 relative overflow-auto custom-scrollbar">
                        {getPdfSrc() ? (
                            <iframe 
                                src={getPdfSrc()!} 
                                className="w-full h-full border-none"
                                title="Resume PDF"
                            />
                        ) : (
                            <div className="p-8 text-slate-300 font-mono text-sm whitespace-pre-wrap">
                                {profile.resumeText || "No resume text available."}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * ============================================================================
 * COMPONENT: RATING VIEW (8-Question Format)
 * ============================================================================
 */
interface RatingViewProps {
    teammate: Teammate;
    projectId: string | number;
    raterId: string | number;
    onClose: () => void;
}

const RatingView: React.FC<RatingViewProps> = ({ teammate, projectId, raterId, onClose }) => {
    const [rawScores, setRawScores] = useState<Record<string, number>>({
        q1: 2.5, q2: 2.5, q3: 2.5, q4: 2.5, 
        q5: 2.5, q6: 2.5, q7: 2.5, q8: 2.5
    });
    const [submitting, setSubmitting] = useState(false);

    const questions = [
        { id: 'q1', text: 'This teammate made meaningful technical contributions to the project.' },
        { id: 'q2', text: 'The quality of this teammate’s work met or exceeded project expectations.' },
        { id: 'q3', text: 'This teammate consistently met deadlines and commitments.' },
        { id: 'q4', text: 'This teammate followed through on assigned responsibilities without repeated reminders.' },
        { id: 'q5', text: 'This teammate communicated clearly and responded in a timely manner.' },
        { id: 'q6', text: 'This teammate was respectful, cooperative, and supportive of the team.' },
        { id: 'q7', text: 'This teammate took initiative beyond their assigned tasks when needed.' },
        { id: 'q8', text: 'I would be happy to collaborate with this teammate again on a future project.' },
    ];

    const handleSubmit = async () => {
        let rateeId = teammate.id;
        if (!rateeId) rateeId = (teammate as any).resumeId;
        if (!rateeId) rateeId = (teammate as any).userId;

        const finalRaterId = raterId || localStorage.getItem('userId');

        if (!rateeId || !finalRaterId) {
             alert("Error: Missing critical IDs for rating submission.");
             return;
        }

        setSubmitting(true);
        try {
            const categoryScores = {
                technical: (rawScores.q1 + rawScores.q2) / 2,     // Q1 + Q2
                reliability: (rawScores.q3 + rawScores.q4) / 2,   // Q3 + Q4
                communication: (rawScores.q5 + rawScores.q6) / 2, // Q5 + Q6
                initiative: rawScores.q7,                         // Q7
                overall: rawScores.q8                             // Q8
            };

            const payload: RatingSubmission = {
                rater_id: Number(finalRaterId),
                ratee_id: Number(rateeId),
                project_id: Number(projectId),
                category_scores: categoryScores
            };
            
            await submitTeammateRating(payload);
            
            alert(`Rating submitted for ${teammate.fullName}!`);
            onClose();
        } catch (e) {
            alert("Failed to submit rating. Please try again.");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleScoreChange = (key: string, value: string) => {
        setRawScores(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-slate-900">Rate Teammate Performance</h2>
                    <p className="text-sm text-slate-500 mt-1">Providing feedback for <span className="font-semibold text-slate-800">{teammate.fullName || (teammate as any).name || "Unknown Member"}</span></p>
                </div>
                
                <div className="p-6 space-y-6">
                    {questions.map((q, idx) => (
                        <div key={q.id}>
                            <div className="flex justify-between items-start mb-2 gap-4">
                                <label className="text-sm font-medium text-slate-800 leading-snug">
                                    <span className="font-bold text-slate-400 mr-2">{idx + 1}.</span>
                                    {q.text}
                                </label>
                                <span className="text-xs font-mono font-bold text-converge-blue bg-blue-50 px-2 py-0.5 rounded shrink-0">
                                    {rawScores[q.id]} / 5
                                </span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="5" 
                                step="0.5"
                                value={rawScores[q.id]}
                                onChange={(e) => handleScoreChange(q.id, e.target.value)}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-converge-blue"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono uppercase">
                                <span>Strongly Disagree (0)</span>
                                <span>Strongly Agree (5)</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-white font-medium text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-converge-blue text-white rounded-lg hover:bg-blue-600 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit Evaluation
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * ============================================================================
 * TAB: UPLOAD RESUME
 * ============================================================================
 */
export const UploadResumeTab: React.FC = () => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");

    useEffect(() => {
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert("Only PDF files are allowed.");
            return;
        }

        setUploading(true);
        setProgress(0);
        setStatusText("Initializing file stream...");
        
        // Progress Simulation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 5;
            });
        }, 500);

        try {
            // 2. Extract Text using PDF.js
            setStatusText("Extracting semantic text layers...");
            let fullText = '';
            
            if (window.pdfjsLib) {
                 const arrayBuffer = await file.arrayBuffer();
                 const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
                 const pdf = await loadingTask.promise;
                 
                 for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n\n';
                 }
            } else {
                console.warn("PDF.js not loaded, skipping text extraction.");
            }

            // 3. Upload to Backend (Text Only)
            setStatusText("Transmitting text payload...");
            await uploadUserResume(fullText);
            
            setProgress(100);
            setStatusText("Update Complete");
            alert("Resume updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to upload resume. Please try again.");
            setStatusText("Upload Failed");
        } finally {
            clearInterval(progressInterval);
            setTimeout(() => {
                setUploading(false);
                setProgress(0);
                setStatusText("");
            }, 1000);
        }
    };

    return (
        <div className="w-full">
            <div className="text-left mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-converge-blue" />
                    Update Resume
                </h2>
                <p className="text-sm text-slate-500">Refresh your neural embeddings by uploading a new resume.</p>
            </div>
            
            <div className={`bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center group transition-all relative overflow-hidden ${!uploading ? 'hover:bg-slate-100 hover:border-converge-blue' : ''}`}>
                
                {uploading ? (
                    <div className="w-full max-w-sm z-10 py-4">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                            <span>Processing</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                             <div 
                                className="h-full bg-gradient-to-r from-converge-blue to-converge-violet transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                             ></div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-converge-blue animate-pulse">
                             <Terminal className="w-3 h-3" />
                             <span className="text-xs font-mono">{statusText}</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6 text-converge-blue" />
                        </div>
                        <h3 className="text-base font-bold text-slate-700 mb-1">
                            Upload PDF Resume
                        </h3>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                            Drag and drop, or click to browse. Max 5MB.
                        </p>
                    </>
                )}
                
                <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {!uploading && (
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors pointer-events-none">
                        Select File
                    </button>
                )}
            </div>
            
            <div className="mt-4 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-snug">
                    <span className="font-bold">Note:</span> Resume updates trigger the Gemini extraction engine. It may take a moment for new skills to reflect in matching.
                </p>
            </div>
        </div>
    );
}

/**
 * ============================================================================
 * TAB: POST OPPORTUNITY (Split Flow: Create -> Find Teammates)
 * ============================================================================
 */
export const PostOpportunityTab: React.FC = () => {
    const [form, setForm] = useState({ title: '', description: '', skills: '', type: 'PROJECT', isPublic: true, github: '', preferredTech: '', domains: '' });
    const [loading, setLoading] = useState(false);
    const [createdProject, setCreatedProject] = useState<any>(null);
    const [matches, setMatches] = useState<MLMatchResponse | null>(null);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());
    const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); // START LOAD
        
        try {
            // 1. Create Project Only
            const project = await createProject(form);
            
            // 2. STATE SWITCH: Stop global loading and show success screen
            setCreatedProject(project);
            setLoading(false); // Stop loading here. Do not auto-fetch.
        } catch (err) {
            console.error(err);
            alert("Failed to create project.");
            setLoading(false); 
        }
    };

    const fetchMatches = async () => {
        if (!createdProject || !createdProject.id) return;
        setLoadingMatches(true);
        try {
            const matchData = await getTeammateMatches(createdProject.id);
            setMatches(matchData);
        } catch (mlErr) {
            console.error("ML Match failed:", mlErr);
            alert("Could not fetch recommendations at this time. Please try again later.");
        } finally {
            setLoadingMatches(false);
        }
    };

    const handleInviteCandidate = async (candidateId: number) => {
        if (!createdProject) return;
        try {
            const profile = await getUserProfileById(candidateId);
            if (profile && profile.email) {
                await addTeammate(createdProject.id, profile.email);
                setSentRequests(prev => new Set(prev).add(candidateId));
            }
        } catch (e) { console.error(e); }
    };

    if (selectedCandidate) {
        return <TeammateDetailView userId={selectedCandidate} onBack={() => setSelectedCandidate(null)} />;
    }

    // IF PROJECT CREATED -> SHOW SUCCESS VIEW & MATCH BUTTON
    if (createdProject) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                {/* 1. GREEN BANNER: Project Initialized */}
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl flex items-center justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-emerald-900">Project Initialized</h2>
                            <p className="text-emerald-700 text-sm">Your project "{createdProject.title}" is now active on the network.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { 
                            setCreatedProject(null); 
                            setMatches(null); 
                            setForm({ title: '', description: '', skills: '', type: 'PROJECT', isPublic: true, github: '', preferredTech: '', domains: '' }); 
                        }}
                        className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-lg hover:bg-emerald-50 text-sm"
                    >
                        Create Another
                    </button>
                </div>

                <h2 className="text-xl font-bold text-slate-900">Next Steps</h2>

                {/* 2. PROJECT SUMMARY CARD */}
                <ProjectSummaryCard project={createdProject} />

                {/* 3. BUTTON: SHOW SUITABLE TEAMMATES */}
                {!matches && !loadingMatches && (
                    <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <h3 className="text-lg font-bold text-slate-700 mb-2">Build Your Team</h3>
                        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">Use our Gemini-powered neural matcher to find candidates with the exact skills required for this project.</p>
                        <button 
                            onClick={fetchMatches}
                            className="px-6 py-3 bg-converge-violet text-white font-bold rounded-xl hover:bg-violet-600 shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2 mx-auto"
                        >
                            <Sparkles className="w-5 h-5" /> Find Teammates
                        </button>
                    </div>
                )}

                {/* 4. LOADING STATE FOR MATCHES */}
                {loadingMatches && (
                    <div className="flex justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-converge-blue" />
                            <p className="text-sm text-slate-400 font-mono">Running Neural Matcher...</p>
                        </div>
                    </div>
                )}

                {/* 5. MATCH RESULTS */}
                {matches && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-converge-violet/10 border border-converge-violet/20 p-3 rounded-lg flex justify-between items-center text-xs font-bold text-converge-violet mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                <span>AI Analysis Complete: Found {matches.count} candidates from {matches.stats.total_resumes} resumes.</span>
                            </div>
                            <span className="font-mono opacity-70">Alpha: {matches.alpha}</span>
                        </div>

                        <MatchResultsView 
                            matchData={matches} 
                            onSelectCandidate={setSelectedCandidate}
                            onAddTeammate={handleInviteCandidate}
                            sentRequests={sentRequests}
                        />
                    </div>
                )}
            </div>
        );
    }

    // DEFAULT: CREATE FORM
    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6">Post New Opportunity</h2>
            <form onSubmit={handleSubmit} className="bg-white p-8 border border-slate-200 rounded-xl shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
                    <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g. AI Research Initiative" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea required rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Describe the goals and requirements..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg bg-white">
                            <option value="PROJECT">Project</option>
                            <option value="RESEARCH">Research</option>
                            <option value="OPEN_SOURCE">Open Source</option>
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">GitHub (Optional)</label>
                         <input type="url" value={form.github} onChange={e => setForm({...form, github: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="https://github.com/..." />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills</label>
                         <input type="text" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g. Python, React" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Tech</label>
                         <input type="text" value={form.preferredTech} onChange={e => setForm({...form, preferredTech: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g. AWS, Docker" />
                     </div>
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Domains</label>
                     <input type="text" value={form.domains} onChange={e => setForm({...form, domains: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g. FinTech, AI, Health" />
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="public" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    <label htmlFor="public" className="text-sm text-slate-700">Make this project public to the global explore feed</label>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-70 transition-colors flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Creating...' : 'Launch Project'}
                </button>
            </form>
        </div>
    );
};

/**
 * ============================================================================
 * TAB: MY PROJECTS
 * ============================================================================
 */
export const MyProjectsTab: React.FC<{
    projects: Opportunity[];
    loading: boolean;
    onRefresh: () => void;
    currentUser: ParsedProfile | null;
}> = ({ projects, loading, onRefresh, currentUser }) => {
    const [selectedProject, setSelectedProject] = useState<Opportunity | null>(null);
    const [detailedProject, setDetailedProject] = useState<Opportunity | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    
    // NEW STATE: For handling Matches within My Projects
    const [matches, setMatches] = useState<MLMatchResponse | null>(null);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
    const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());

    // NEW: State to trigger Rating Modal for Project Owner
    const [ratingTarget, setRatingTarget] = useState<{ id: number, name: string } | null>(null);

    // Fetch full details (including teammates) and Matches when a project is selected
    useEffect(() => {
        if (selectedProject) {
            setLoadingDetail(true);
            setMatches(null); // Clear previous matches

            // 1. Fetch Details
            getProjectDetails(selectedProject.id)
                .then(details => {
                    setDetailedProject(details);
                    // 2. Fetch Matches if active
                    if (details.status !== 'COMPLETED') {
                        setLoadingMatches(true);
                        getTeammateMatches(details.id)
                            .then(setMatches)
                            .catch(err => console.error("Failed to load matches", err))
                            .finally(() => setLoadingMatches(false));
                    }
                })
                .catch(err => console.error("Failed to load details", err))
                .finally(() => setLoadingDetail(false));
        } else {
            setDetailedProject(null);
        }
    }, [selectedProject]);

    const handleComplete = async () => {
        if (!detailedProject) return;
        if (window.confirm("Are you sure you want to mark this project as complete? This will allow you to rate your teammates.")) {
            try {
                await completeProject(detailedProject.id);
                // Refresh detail
                const updated = await getProjectDetails(detailedProject.id);
                setDetailedProject(updated);
                onRefresh(); // Refresh list
            } catch (e) {
                alert("Failed to complete project");
            }
        }
    };
    
    // Handler for Adding Teammate from Match List
    const handleInviteCandidate = async (candidateId: number) => {
        if (!detailedProject) return;
        try {
            const profile = await getUserProfileById(candidateId);
            if (profile && profile.email) {
                await addTeammate(detailedProject.id, profile.email);
                setSentRequests(prev => new Set(prev).add(candidateId));
                // Optional: Refresh details to show new pending state if backend supported it immediately
                alert(`Invitation sent to ${profile.email}`);
            }
        } catch (e) { console.error(e); }
    };

    if (selectedCandidate) {
         return <TeammateDetailView userId={selectedCandidate} onBack={() => setSelectedCandidate(null)} />;
    }

    if (ratingTarget && detailedProject) {
        return (
            <RatingView 
                teammate={{ id: ratingTarget.id, fullName: ratingTarget.name, email: '' }}
                projectId={detailedProject.id}
                raterId={localStorage.getItem('userId') || ''}
                onClose={() => setRatingTarget(null)}
            />
        );
    }

    if (selectedProject) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <button onClick={() => { setSelectedProject(null); setMatches(null); }} className="flex items-center text-sm text-slate-500 hover:text-slate-900 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Projects
                </button>

                {loadingDetail || !detailedProject ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-slate-300" /></div>
                ) : (
                    <div className="space-y-8">
                        {/* HEADER SECTION */}
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                     <h2 className="text-2xl font-bold text-slate-900">{detailedProject.title}</h2>
                                     {detailedProject.status === 'COMPLETED' && (
                                         <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded flex items-center gap-1 border border-slate-200">
                                            <Lock className="w-3 h-3" /> COMPLETED
                                         </span>
                                     )}
                                </div>
                                <p className="text-slate-600 max-w-2xl">{detailedProject.description}</p>
                            </div>
                            {detailedProject.status !== 'COMPLETED' && (
                                <button 
                                    onClick={handleComplete}
                                    className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> Mark Complete
                                </button>
                            )}
                        </div>

                        {/* TEAMMATES SECTION */}
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Current Team
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {!detailedProject.teammates || detailedProject.teammates.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">No teammates have joined yet.</p>
                                ) : (
                                    detailedProject.teammates.map((member: Teammate) => (
                                        <div key={member.id} className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                                                    {member.fullName.substring(0,1)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{member.fullName}</p>
                                                    <p className="text-xs text-slate-500">{member.email}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Rating Action (Only if Completed and not me) */}
                                            {detailedProject.status === 'COMPLETED' && currentUser?.email !== member.email && (
                                                <button 
                                                    onClick={() => setRatingTarget({ id: Number(member.id), name: member.fullName })}
                                                    className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded hover:bg-amber-200 border border-amber-200"
                                                >
                                                    Rate Teammate
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* AI MATCHES SECTION (Only if Active) */}
                        {detailedProject.status !== 'COMPLETED' && (
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-converge-violet" /> Recommended Candidates
                                </h2>
                                
                                {loadingMatches ? (
                                    <div className="flex justify-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-converge-violet" />
                                            <span className="text-sm text-slate-500"> analyzing skill compatibility...</span>
                                        </div>
                                    </div>
                                ) : matches ? (
                                    <div className="space-y-4">
                                        <div className="bg-converge-violet/10 border border-converge-violet/20 p-3 rounded-lg flex justify-between items-center text-xs font-bold text-converge-violet">
                                            <span>AI Analysis Complete: Found {matches.count} candidates.</span>
                                            <span className="font-mono opacity-70">Alpha: {matches.alpha}</span>
                                        </div>
                                        <MatchResultsView 
                                            matchData={matches} 
                                            onSelectCandidate={setSelectedCandidate}
                                            onAddTeammate={handleInviteCandidate}
                                            sentRequests={sentRequests}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                                        <p className="text-slate-400 text-sm">No recommendations available at this time.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <ProjectFeed 
            title="My Projects" 
            fetchFunction={getMyProjects} // Fallback
            emptyMessage="You haven't posted any projects yet."
            emptySubMessage="Create a project to start collaborating."
            externalData={projects}
            externalLoading={loading}
            onExternalRefresh={onRefresh}
            onItemClick={(item) => setSelectedProject(item)}
            renderActions={(item) => (
                 <span className="text-xs font-bold text-slate-400">
                    {item.teammates?.length || 0} Members
                 </span>
            )}
        />
    );
};

/**
 * ============================================================================
 * TAB: GLOBAL EXPLORE
 * ============================================================================
 */
export const ExploreTab: React.FC = () => {
    return (
        <ProjectFeed 
            title="Global Explore" 
            fetchFunction={getExploreProjects}
            emptyMessage="No public projects found."
            emptySubMessage="Be the first to post a public opportunity!"
        />
    );
};

/**
 * ============================================================================
 * TAB: INBOX (REQUESTS)
 * ============================================================================
 */
export const TeammateRequestsTab: React.FC<{ onProjectUpdate: () => void }> = ({ onProjectUpdate }) => {
    const [requests, setRequests] = useState<TeammateRequest[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State to handle opening the rating modal from Inbox
    const [ratingRequest, setRatingRequest] = useState<{
        teammate: Teammate;
        projectId: string | number;
    } | null>(null);

    const loadRequests = () => {
        setLoading(true);
        getTeammateRequests()
            .then(setRequests)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleAccept = async (reqId: number) => {
        try {
            await acceptTeammateRequest(reqId);
            // Remove from list
            setRequests(prev => prev.filter(r => r.requestId !== reqId));
            onProjectUpdate(); // Refresh projects
            alert("Teammate accepted!");
        } catch (e) {
            alert("Failed to accept request.");
        }
    };

    // Handler to open rating modal from Inbox item
    const openRatingModal = async (req: TeammateRequest) => {
        // ID Retrieval Logic:
        // 1. Try direct ID from request
        if (req.rateeId) {
            setRatingRequest({
                teammate: {
                    id: req.rateeId,
                    fullName: req.rateeName || "Teammate",
                    email: req.rateeEmail || "Hidden" 
                },
                projectId: req.projectId!
            });
            return;
        }

        // 2. Fallback: Fetch project details to find user by email
        if (!req.projectId || !req.rateeEmail) {
            alert("Error: Missing critical data (Project ID or Email) to identify teammate.");
            return;
        }

        try {
            const project = await getProjectDetails(req.projectId);
            const foundTeammate = project.teammates?.find(t => t.email === req.rateeEmail);
            
            if (foundTeammate) {
                setRatingRequest({
                    teammate: foundTeammate,
                    projectId: req.projectId
                });
            } else {
                alert("Could not retrieve Teammate ID. Please try refreshing or contact support.");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to fetch project data for ID lookup.");
        }
    };

    if (ratingRequest) {
        return (
            <RatingView 
                teammate={ratingRequest.teammate}
                projectId={ratingRequest.projectId}
                raterId={localStorage.getItem('userId') || ''}
                onClose={() => { setRatingRequest(null); loadRequests(); }}
            />
        );
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-slate-300" /></div>;

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <Inbox className="w-12 h-12 mb-4 text-slate-300" />
                <p className="font-medium">No pending requests</p>
                <p className="text-xs">Incoming teammate requests will appear here.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Inbox className="w-5 h-5" /> Pending Requests
            </h2>
            <div className="grid gap-4">
                {requests.map((req) => {
                    const isRatingRequest = req.type === 'RATING_REQUEST';
                    return (
                        <div key={req.requestId} className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 ${isRatingRequest ? 'border-l-4 border-l-converge-violet' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isRatingRequest ? 'bg-violet-50 text-converge-violet' : 'bg-blue-50 text-blue-600'}`}>
                                    {isRatingRequest ? <Star className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                </div>
                                <div>
                                    {isRatingRequest ? (
                                        <>
                                            <p className="font-bold text-slate-900 text-lg">Rate Teammate</p>
                                            <p className="text-slate-500 text-sm">
                                                Please evaluate <span className="font-semibold text-slate-800">{req.rateeName || 'your teammate'}</span> for <span className="font-semibold text-slate-800">{req.projectTitle}</span>
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-bold text-slate-900 text-lg">{req.requesterEmail}</p>
                                            <p className="text-slate-500 text-sm">
                                                wants to join <span className="font-semibold text-slate-800">{req.projectTitle}</span>
                                            </p>
                                        </>
                                    )}
                                    <p className="text-xs text-slate-400 mt-1">{new Date(req.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {isRatingRequest ? (
                                    <button 
                                        onClick={() => openRatingModal(req)}
                                        className="px-6 py-2 bg-converge-violet text-white font-bold rounded-lg hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/20 text-sm flex items-center justify-center gap-2"
                                    >
                                        <Star className="w-4 h-4" /> Rate Now
                                    </button>
                                ) : (
                                    <>
                                        <button className="px-4 py-2 border border-slate-200 text-slate-500 font-bold text-sm rounded-lg hover:bg-slate-50">
                                            Ignore
                                        </button>
                                        <button 
                                            onClick={() => handleAccept(req.requestId)}
                                            className="px-4 py-2 bg-converge-blue text-white font-bold text-sm rounded-lg hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                                        >
                                            Accept Request
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * ============================================================================
 * TAB: HALL OF FAME
 * ============================================================================
 */
export const HallOfFameTab: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-20 text-center">
            <Trophy className="w-24 h-24 text-amber-300 mb-6 drop-shadow-lg" />
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Hall of Fame</h2>
            <p className="text-slate-500 max-w-md">Top performing projects and highest rated collaborators will be featured here.</p>
            <div className="mt-8 px-4 py-2 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
                COMING SOON
            </div>
        </div>
    );
};