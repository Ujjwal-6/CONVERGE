
// types.ts

// Represents the parsed JSON data returned by the profile endpoint
export interface ParsedProfile {
  [key: string]: any;
}

// Enum for managing application view state
export enum AppView {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  DASHBOARD = 'DASHBOARD'
}

// Enum for Dashboard internal navigation
export enum DashboardTab {
  PROFILE = 'PROFILE',
  MY_PROJECTS = 'MY_PROJECTS', // Renamed from COLLAB
  EXPLORE = 'EXPLORE',         // New Global Feed
  INBOX = 'INBOX',             // New Teammate Request Inbox
  UPLOAD = 'UPLOAD',
  POST = 'POST',
  HOF = 'HOF'
}

// Types for the "Post Opportunity" feature
export type OpportunityType = 'PROJECT' | 'RESEARCH' | 'OPEN_SOURCE';

// --- ML BACKEND TYPES START ---

export interface MLProfile {
  name: string;
  year: string;
  availability: string;
  email?: string;
}

export interface MLLayer1 {
  capability_score: number;
  s_semantic: number;
  s_skills: number;
  s_experience: number;
}

export interface MLLayer2 {
  trust_score: number;
  s_rating: number;
  s_reliability: number;
  completion_ratio: number;
}

export interface MLScoring {
  final_score: number;
  alpha: number;
  formula: string;
}

export interface MLMatchCandidate {
  resume_id: number;
  final_score: number;
  layer1_capability: MLLayer1;
  layer2_trust: MLLayer2;
  scoring_formula: MLScoring;
  profile: MLProfile;
  ratings?: any; // Updated to match backend "ratings": global_rating_data
}

export interface MLProjectMetadata {
  title: string;
  description: string;
  required_skills: string[];
  preferred_technologies: string[];
  domains: string[];
  project_type: string;
}

export interface MLStats {
  total_resumes: number;
  with_embeddings: number;
  passed_filter: number;
}

export interface MLMatchResponse {
  project_id: number;
  project_type: string;
  alpha: number;
  matches: MLMatchCandidate[];
  count: number;
  top_n_requested: number;
  project_metadata: MLProjectMetadata;
  stats: MLStats;
}

// --- ML BACKEND TYPES END ---

export interface TeammateMatch {
  id: string;
  name: string;
  year: string;
  department: string;
  regNo: string;
  matchScore: number; // 0-100
  profilePicUrl?: string;
}

// Represents a teammate already added to a project
export interface Teammate {
  id?: number | string;
  fullName: string;
  email: string;
  role?: string;
}

// Types for the "Collab" feed
export interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: OpportunityType;
  subType?: 'EXTERNAL' | 'CAMPUS'; // For Open Source
  technologies: string[];
  postedBy: string;
  ownerEmail?: string; // Added to identify ownership
  date: string;
  isPublic: boolean;
  githubUrl?: string;
  teammates?: Teammate[]; // List of current team members
  status?: 'ACTIVE' | 'COMPLETED'; // Added status field
}

// Represents an incoming teammate request
export interface TeammateRequest {
    requestId: number; // Changed from id to match backend
    projectTitle: string;
    requesterEmail: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
    // Added fields for Rating Requests and generic request metadata
    projectId?: number;
    type?: string; 
    rateeId?: number;
    rateeName?: string;
    rateeEmail?: string; // Added for robust ID lookup
}

// --- RATING TYPES ---
export interface RatingCategoryScores {
  technical: number;
  reliability: number;
  communication: number;
  initiative: number;
  overall: number;
}

export interface RatingSubmission {
  rater_id: number;
  ratee_id: number;
  project_id: number;
  category_scores: RatingCategoryScores;
}
