import { ParsedProfile, TeammateMatch, Opportunity, MLMatchResponse, TeammateRequest, RatingSubmission } from '../types';

// ==============================================================================
// CONFIGURATION
// ==============================================================================
const BASE_URL = 'http://localhost:8080';
const AUTH_URL = `${BASE_URL}/auth`;
const API_URL  = `${BASE_URL}/api`;

// The Django ML Backend URL provided
const ML_BACKEND_BASE = 'https://fundamentally-historiographic-leif.ngrok-free.dev';
const ML_MATCH_URL = `${ML_BACKEND_BASE}/api/project/match`;
// Added trailing slash to ensure Django matches the route correctly (fixes 404)
const ML_RATING_URL = `${ML_BACKEND_BASE}/api/ratings/submit/`;

/**
 * HELPER: Convert File to Base64 String (Raw)
 * Removes the "data:application/pdf;base64," prefix for backend compatibility.
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Split to get only the base64 data
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

/**
 * Helper: Maps Backend JSON to Frontend Opportunity Interface
 */
const mapToFrontendOpportunity = (item: any): Opportunity => {
    // Helper to process skills which might be array OR comma-separated string
    let skills: string[] = [];
    if (Array.isArray(item.requiredSkills)) { // if required skills is present in json as an array
        skills = item.requiredSkills;
    } else if (typeof item.requiredSkills === 'string') { // if skills are present in json as individual strings
        skills = item.requiredSkills.split(',').map((s:string) => s.trim());
    } else if (Array.isArray(item.technologies)) {
        skills = item.technologies;
    }

    // Process Posted By to include Name and Email
    let postedByStr = 'Anonymous';
    let ownerEmail = '';

    if (item.postedBy) {
        if (typeof item.postedBy === 'object') {
            const name = item.postedBy.fullName || item.postedBy.name || null;
            const email = item.postedBy.email || null;
            
            if (email) ownerEmail = email;

            if (name && email) {
                postedByStr = `${name} (${email})`;
            } else if (name) {
                postedByStr = name;
            } else if (email) {
                postedByStr = email;
            }
        } else if (typeof item.postedBy === 'string') {
            postedByStr = item.postedBy;
        }
    }

    // Process Date with fallback
    let dateStr = 'Recently';
    const rawDate = item.createdAt || item.created_at || item.date;
    if (rawDate) {
        try {
            dateStr = new Date(rawDate).toLocaleDateString(undefined, {
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
            });
        } catch (e) {
            console.warn("Invalid date format", rawDate);
        }
    }

    // Process Teammates if available
    // Robustly map IDs to ensure we can rate them later
    const teammates = (item.teammates || []).map((t: any) => {
        // Extract ID searching multiple common field names
        // Note: Check for !== undefined because ID could be 0 (though rare for PK)
        let extractedId = t.id;
        if (extractedId === undefined) extractedId = t.resumeId; // because Different APIs / DB layers / serializers may name IDs differently
        if (extractedId === undefined) extractedId = t.resume_id;
        if (extractedId === undefined) extractedId = t.userId;
        if (extractedId === undefined) extractedId = t.user_id;
        if (extractedId === undefined && t.user) extractedId = t.user.id;
        if (extractedId === undefined) extractedId = t.pk;
        if (extractedId === undefined) extractedId = t.uuid;
        if (extractedId === undefined) extractedId = t.memberId;

        // NEW: Normalize Name to ensure 'fullName' is never undefined
        const displayName = t.fullName || t.name || (t.user && (t.user.fullName || t.user.name)) || "Unknown Member";

        return {
            ...t,
            id: extractedId,
            fullName: displayName // Ensure this matches the Teammate interface
        };
    });

    return {
        id: item.id?.toString() || Math.random().toString(),
        title: item.title || "Untitled Project",
        description: item.description || "No description provided.",
        type: item.type || "PROJECT", 
        subType: item.subType || undefined,
        technologies: skills, 
        postedBy: postedByStr,
        ownerEmail: ownerEmail,
        date: dateStr,
        isPublic: (item.visibility === 'PUBLIC') || item.isPublic === true, 
        githubUrl: item.githubRepo || item.githubUrl,
        teammates: teammates,
        status: item.status // Map status from backend
    };
};

/**
 * ==============================================================================
 * 1. AUTHENTICATION SERVICE (LOGIN)
 * ==============================================================================
 */
export const loginUser = async (email: string, password: string): Promise<boolean> => {
  console.log(`[Auth Service] Attempting login for ${email}...`);

  try {
    const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Invalid credentials');
    }

    const data = await response.json();
    
    if (data.token) {
        localStorage.setItem('token', data.token);
        
        // Capture User ID if present (Crucial for Ratings)
        const uId = data.id || data.userId || data.user_id;
        if (uId) {
            localStorage.setItem('userId', uId.toString());
        }

        console.log("[Auth Service] Authentication successful. Token stored.");
    } else {
        console.warn("[Auth Service] No token received in login response.");
    }
    
    return true;

  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

/**
 * ==============================================================================
 * 2. REGISTRATION SERVICE
 * ==============================================================================
 */
export const registerUser = async (
  fullName: string, 
  email: string, 
  password: string, 
  resumeText: string,
  institution: string,
  department: string,
  year: string,
  availability: string,
  resumePdfBase64: string // New Parameter for PDF
): Promise<boolean> => {
  console.log(`[Auth Service] Registering user ${email}...`);

  try {
    const payload = {
      fullName,
      email,
      password,
      resumeText,
      resumePdf: resumePdfBase64, // Send as JSON Base64
      institution,
      department,
      year,
      availability
    };

    const response = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Registration failed');
    }

    const data = await response.json();
    if (data.token) {
        localStorage.setItem('token', data.token);
        
        // Capture User ID if present
        const uId = data.id || data.userId || data.user_id;
        if (uId) {
            localStorage.setItem('userId', uId.toString());
        }

        console.log("[Auth Service] Registration successful. Token stored.");
    }

    return true;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
};

/**
 * ==============================================================================
 * 3. GET PROFILE (CURRENT USER)
 * ==============================================================================
 */
export const getProfile = async (): Promise<ParsedProfile> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error("No access token found. Please login again.");
    }

    const response = await fetch(`${API_URL}/profile`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
        if (response.status === 401) {
             localStorage.removeItem('token');
             localStorage.removeItem('userId');
             throw new Error("Session expired. Please login again.");
        }
        throw new Error("Access Denied (403). Backend rejected the request. Check Backend CORS logs.");
    }

    if (!response.ok) {
      let errMsg = `Failed to fetch profile. Status: ${response.status}`;
      try {
          const text = await response.text();
          if (text) errMsg = text;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const data = await response.json();

    // --- ID NORMALIZATION & SELF-HEALING ---
    // Check all possible fields where an ID might be hiding
    const foundId = data.id || data.userId || data.user_id || data.resume_id || data.resumeId;

    if (foundId) {
        // 1. Ensure the object returned to frontend has a standard 'id' property
        data.id = foundId;

        // 2. Heal LocalStorage: If missing, save it now.
        // This handles cases where user logged in BEFORE we added the localStorage logic.
        if (!localStorage.getItem('userId')) {
            console.log(`[API] Recovered missing User ID (${foundId}) and saved to storage.`);
            localStorage.setItem('userId', foundId.toString());
        }
    } else {
        console.warn("[API] Warning: Profile fetched but no ID field found in response.", data);
    }

    return data;

  } catch (error: any) {
    console.error('Profile Service Error:', error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error("Network Error: Could not connect to Backend. \nPOSSIBLE CAUSE: Backend is blocking CORS requests.");
    }
    throw error;
  }
};

/**
 * ==============================================================================
 * 3.1 GET USER PROFILE BY ID
 * ==============================================================================
 * Fetches the public profile details of a specific user.
 * Used for the "Teammate Detail View".
 */
export const getUserProfileById = async (userId: string | number): Promise<ParsedProfile> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication required.");

    try {
        const response = await fetch(`${API_URL}/profile/${userId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user profile: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Get User Profile (${userId}) Failed:`, error);
        throw error;
    }
};

/**
 * ==============================================================================
 * 4. CREATE PROJECT (POST OPPORTUNITY)
 * ==============================================================================
 * Returns the created project object (containing ID) instead of mock matches.
 */
export const createProject = async (formData: any): Promise<any> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication required to post opportunities.");

    console.log("[Project Service] Creating project...", formData);

    const backendPayload = {
        title: formData.title,
        type: formData.type, 
        visibility: formData.isPublic ? "PUBLIC" : "PRIVATE",
        requiredSkills: formData.skills ? formData.skills.split(',').map((s: string) => s.trim()) : [],
        preferredSkills: formData.preferredTech ? formData.preferredTech.split(',').map((s: string) => s.trim()) : [],
        domains: formData.domains ? formData.domains.split(',').map((s: string) => s.trim()) : [],
        githubRepo: formData.github || "",
        description: formData.description
    };

    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(backendPayload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || "Failed to create project.");
        }
        
        // Return the actual created project from Spring Boot (which has the ID)
        const createdProject = await response.json();
        console.log("[Project Service] Project created:", createdProject);
        
        return createdProject;

    } catch (error) {
        console.error("Create Project Failed:", error);
        throw error;
    }
};

/**
 * ==============================================================================
 * 4.1. GET TEAMMATE MATCHES (ML BACKEND)
 * ==============================================================================
 * Calls the Django ML Microservice to get recommendations.
 */
export const getTeammateMatches = async (projectId: string | number): Promise<MLMatchResponse> => {
    // Ensure projectId is valid
    if (!projectId) throw new Error("Project ID is required for matching.");

    const url = `${ML_MATCH_URL}/${projectId}/?top=5`;
    console.log(`[ML Service] Fetching matches from: ${url}`);

    try {
        // User requested POST method for this specific endpoint
        const response = await fetch(url, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`ML Service Error: ${response.status}`);
        }

        const data: MLMatchResponse = await response.json();
        console.log("[ML Service] Matches received:", data);
        return data;

    } catch (error) {
        console.error("Failed to fetch teammate matches:", error);
        throw error;
    }
};

/**
 * ==============================================================================
 * 4.2. SEND TEAMMATE REQUEST (Was Add Teammate)
 * ==============================================================================
 * Sends a request to the user. User must accept before joining.
 * POST /api/projects/{id}/teammates
 */
export const addTeammate = async (projectId: string | number, memberEmail: string): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication required.");

    try {
        const response = await fetch(`${API_URL}/projects/${projectId}/teammates`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: memberEmail }) // Sending simple body as requested
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || `Failed to send request: ${response.status}`);
        }

        console.log(`[Project Service] Request sent to ${memberEmail} for project ${projectId}`);
        return true;
    } catch (error) {
        console.error("Add Teammate Request Failed:", error);
        throw error;
    }
};

/**
 * ==============================================================================
 * 4.3. GET TEAMMATE REQUESTS (INBOX)
 * ==============================================================================
 * Fetches pending requests for the logged in user.
 * GET /api/projects/teammates/requests
 */
export const getTeammateRequests = async (): Promise<TeammateRequest[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication required.");

    try {
        const response = await fetch(`${API_URL}/projects/teammates/requests`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch requests: ${response.status}`);
        }

        const data = await response.json();
        // Return raw data, assuming it matches the structure or mapper isn't strictly needed if backend aligns
        return data;
    } catch (error) {
        console.error("Get Teammate Requests Failed:", error);
        return [];
    }
};

/**
 * ==============================================================================
 * 4.4. ACCEPT TEAMMATE REQUEST
 * ==============================================================================
 * Accepts a specific request.
 * POST /api/projects/teammates/requests/{requestId}/accept
 */
export const acceptTeammateRequest = async (requestId: number): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication required.");

    try {
        const response = await fetch(`${API_URL}/projects/teammates/requests/${requestId}/accept`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to accept request: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error("Accept Request Failed:", error);
        throw error;
    }
};

/**
 * ==============================================================================
 * 4.5. SUBMIT TEAMMATE RATING (DJANGO BACKEND)
 * ==============================================================================
 * POST /api/ratings/submit
 */
export const submitTeammateRating = async (rating: RatingSubmission): Promise<boolean> => {
    console.log("[Rating Service] Submitting rating to Django backend...", rating);
    
    try {
        const response = await fetch(ML_RATING_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Ngrok Skip Warning: Essential when calling ngrok free tier programmatically
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(rating)
        });
        console.log("Rating payload being sent:", JSON.stringify(rating, null, 2));
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || `Failed to submit rating: ${response.status}`);
        }

        console.log("[Rating Service] Rating submitted successfully.");
        return true;
    } catch (error) {
        console.error("Submit Rating Failed:", error);
        throw error;
    }
};

/**
 * ==============================================================================
 * 4.6. COMPLETE PROJECT
 * ==============================================================================
 * Marks project as completed and deletes it.
 * POST /api/projects/{id}/complete
 */
export const completeProject = async (projectId: string | number): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication required.");

    try {
        const response = await fetch(`${API_URL}/projects/${projectId}/complete`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || `Failed to complete project: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error("Complete Project Failed:", error);
        throw error;
    }
}

/**
 * ==============================================================================
 * 5. GET MY PROJECTS (MY PROJECTS TAB)
 * ==============================================================================
 * Fetches projects created by the logged-in user.
 * BACKEND INTEGRATION: @GetMapping("/projects") returns List<Project> for current user.
 */
export const getMyProjects = async (): Promise<Opportunity[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication required.");

    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Failed to fetch my projects: ${response.status}`);

        const data = await response.json();
        return data.map(mapToFrontendOpportunity);

    } catch (error) {
        console.error("Get My Projects Failed:", error);
        return [];
    }
}

/**
 * ==============================================================================
 * 5.1 GET PROJECT DETAILS (Single Project + Teammates)
 * ==============================================================================
 * Fetches detailed info for a single project, including the teammate list.
 * GET /api/projects/{id}
 */
export const getProjectDetails = async (projectId: string | number): Promise<Opportunity> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication required.");

    try {
        const response = await fetch(`${API_URL}/projects/${projectId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Failed to fetch project details: ${response.status}`);

        const data = await response.json();
        console.log("[DEBUG] Raw Project Data:", data); // Add logging for debugging
        return mapToFrontendOpportunity(data);
    } catch (error) {
         console.error(`Get Project Details (${projectId}) Failed:`, error);
         throw error;
    }
}

/**
 * ==============================================================================
 * 6. GET EXPLORE PROJECTS (GLOBAL EXPLORE TAB)
 * ==============================================================================
 * Fetches ALL projects from the database (public ones).
 * BACKEND INTEGRATION: Create @GetMapping("/projects/explore") in Spring Boot.
 */
export const getExploreProjects = async (): Promise<Opportunity[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication required.");

    try {
        const response = await fetch(`${API_URL}/projects/explore`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Failed to fetch explore feed: ${response.status}`);

        const data = await response.json();
        return data.map(mapToFrontendOpportunity);

    } catch (error) {
        console.error("Get Explore Projects Failed:", error);
        return [];
    }
}

/**
 * ==============================================================================
 * 7. DOWNLOAD MY RESUME
 * ==============================================================================
 * Downloads the current user's resume as a PDF file.
 */
export const downloadMyResume = async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication required.");

    const response = await fetch(`${API_URL}/resume/download`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Failed to download resume.");

    // Handle Blob
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "my_resume.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * ==============================================================================
 * 7.1 DOWNLOAD USER RESUME
 * ==============================================================================
 * Downloads a specific user's resume as a PDF file (e.g. from match list).
 */
export const downloadUserResume = async (userId: string | number): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication required.");

    const response = await fetch(`${API_URL}/resume/download/${userId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Failed to download resume.");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${userId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * ==============================================================================
 * 8. UPLOAD USER RESUME
 * ==============================================================================
 * Uploads a PDF file to update the user's resume.
 * Expects a POST to /api/resume/upload with JSON { resumePdf: base64 }
 */
export const uploadUserResume = async (resumeBase64: string): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication required.");

    try {
        const response = await fetch(`${API_URL}/resume/upload`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ resumePdf: resumeBase64 })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || "Failed to upload resume.");
        }
        
        console.log("[Upload Service] Resume uploaded successfully.");
        return true;
    } catch (error) {
        console.error("Resume Upload Failed:", error);
        throw error;
    }
};
