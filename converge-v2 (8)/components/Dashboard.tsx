
import React, { useState, useEffect, useCallback } from 'react';
import { getProfile, getMyProjects } from '../services/api.service';
import { ParsedProfile, DashboardTab, Opportunity } from '../types';
import { 
  Hexagon, LogOut, Terminal, Layers, 
  User, UploadCloud, Search, PlusCircle, Trophy,
  FolderGit2, Globe, Inbox
} from 'lucide-react';

// Import Tabs
import { 
  ProfileTab, 
  MyProjectsTab,
  ExploreTab,
  TeammateRequestsTab, // Imported new tab
  UploadResumeTab, 
  PostOpportunityTab, 
  HallOfFameTab 
} from './DashboardTabs';

interface DashboardProps {
  onLogout: () => void;
}

/**
 * Dashboard Component (Main Shell)
 * 
 * Manages the layout, sidebar navigation, and fetching of the main user profile.
 * Renders sub-components based on the active tab.
 */
export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  // Default to EXPLORE as it is now the first item
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.EXPLORE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ParsedProfile | null>(null);

  // State for My Projects (Lifted up to allow updates from Inbox)
  const [myProjects, setMyProjects] = useState<Opportunity[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProfile();
      setProfileData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load profile data.");
      if (err.message.includes("Session expired") || err.message.includes("No access token")) {
          // Optional: Auto-logout could happen here
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
        const data = await getMyProjects();
        setMyProjects(data);
    } catch (e) {
        console.error("Failed to load projects", e);
    } finally {
        setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Fetch projects when My Projects tab becomes active
  useEffect(() => {
    if (activeTab === DashboardTab.MY_PROJECTS) {
        fetchMyProjects();
    }
  }, [activeTab, fetchMyProjects]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  /**
   * Renders the content of the currently selected tab
   */
  const renderContent = () => {
    switch(activeTab) {
      case DashboardTab.PROFILE:
        return <ProfileTab data={profileData} loading={loading} error={error} onRetry={loadProfile} />;
      case DashboardTab.MY_PROJECTS:
        return <MyProjectsTab projects={myProjects} loading={projectsLoading} onRefresh={fetchMyProjects} currentUser={profileData} />;
      case DashboardTab.EXPLORE:
        return <ExploreTab />;
      case DashboardTab.INBOX: 
        return <TeammateRequestsTab onProjectUpdate={fetchMyProjects} />;
      case DashboardTab.UPLOAD:
        return <UploadResumeTab />; // Kept for safety, though link is removed
      case DashboardTab.POST:
        return <PostOpportunityTab />;
      case DashboardTab.HOF:
        return <HallOfFameTab />;
      default:
        return <div>Unknown Tab</div>;
    }
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: DashboardTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-xl mb-1
        ${activeTab === tab 
          ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/10' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      <Icon className={`w-5 h-5 ${activeTab === tab ? 'text-converge-emerald' : 'text-slate-400'}`} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col md:flex-row">
      
      {/* 
        SIDEBAR NAVIGATION 
      */}
      <aside className="w-full md:w-64 bg-slate-50 border-r border-gray-200 flex-shrink-0 flex flex-col h-screen sticky top-0 z-40">
        {/* Brand */}
        <div className="h-20 flex items-center px-6 border-b border-gray-100 bg-white">
            <div className="bg-converge-bg p-1.5 rounded-lg">
                <Hexagon className="h-5 w-5 text-converge-blue fill-converge-blue/20" />
            </div>
            <span className="ml-2 text-lg font-display font-bold text-slate-900 tracking-tight">Converge</span>
        </div>

        {/* Navigation Items */}
        <div className="flex-grow p-4 space-y-2 overflow-y-auto">
           
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2 mt-4">Discover</div>
           <NavItem tab={DashboardTab.EXPLORE} icon={Globe} label="Global Explore" />
           <NavItem tab={DashboardTab.HOF} icon={Trophy} label="Hall of Fame" />
           
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2 mt-6">Collaborate</div>
           <NavItem tab={DashboardTab.MY_PROJECTS} icon={FolderGit2} label="My Projects" />
           <NavItem tab={DashboardTab.POST} icon={PlusCircle} label="Post Opportunity" />
           
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2 mt-6">Account</div>
           <NavItem tab={DashboardTab.PROFILE} icon={Terminal} label="My Profile" />
           <NavItem tab={DashboardTab.INBOX} icon={Inbox} label="Requests Inbox" />
           
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-200 bg-white">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                 {profileData?.name ? profileData.name.substring(0,1) : <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-slate-900 truncate">
                    {profileData?.name || 'User'}
                 </p>
                 <p className="text-xs text-slate-500 truncate">
                    {profileData?.email || 'Loading...'}
                 </p>
              </div>
           </div>
           <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors"
            >
                <LogOut className="w-3 h-3" /> Sign out
            </button>
        </div>
      </aside>

      {/* 
        MAIN CONTENT AREA
      */}
      <main className="flex-1 min-w-0 bg-white h-screen overflow-y-auto">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="md:hidden h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-white sticky top-0 z-30">
             <div className="flex items-center gap-2">
                <Hexagon className="h-5 w-5 text-converge-blue" />
                <span className="font-bold">Converge</span>
             </div>
             <button onClick={handleLogout}><LogOut className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="max-w-5xl mx-auto p-6 md:p-12">
           {renderContent()}
        </div>
      </main>

    </div>
  );
};
