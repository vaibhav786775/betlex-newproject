import { useEffect, useState, useRef } from "react";
import { apiRequest, loadStoredToken, setAuthToken } from "./api";
import { 
  Trophy, 
  Calendar, 
  Users, 
  Megaphone, 
  Award, 
  Layers, 
  LogOut, 
  RefreshCw, 
  Plus, 
  CheckCircle, 
  Trash2, 
  Clock, 
  FileText, 
  ShieldAlert, 
  UserCheck, 
  Activity, 
  BarChart 
} from "lucide-react";
import "./App.css";

type ApiResult = {
  success: boolean;
  message: string;
  statusCode: number;
  data?: any;
  error?: string;
};

type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
};

type User = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role?: "participant" | "judge" | "organizer" | "admin";
  avatarUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  bio?: string;
};

type EventCard = {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string;
  eventStart: string;
  eventEnd: string;
  registrationOpen: string;
  registrationClose: string;
  submissionDeadline: string;
  maxTeamSize: number;
  minTeamSize: number;
  timezone: string;
  tags?: string[];
  isPublic?: boolean;
  _count?: { registrations?: number; teams?: number; projects?: number; judges?: number };
};

type Team = {
  id: string;
  name: string;
  inviteCode: string;
  leaderId: string;
  track?: string;
  isOpen: boolean;
  members?: Array<{
    user: {
      id: string;
      username: string;
      fullName: string;
      email: string;
    };
    role: "leader" | "member";
  }>;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  priority: "info" | "warning" | "urgent";
  target: "all" | "participants" | "judges" | "organizers";
  isPublished: boolean;
  createdAt: string;
  reads?: any[];
};

function App() {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [, setAccessTokenState] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<"events" | "team" | "announcements" | "judging" | "organizer" | "leaderboard">("events");
  
  // Data lists
  const [events, setEvents] = useState<EventCard[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventCard | null>(null);
  const [myRegistration, setMyRegistration] = useState<any>(null);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [myProject, setMyProject] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadAnnCount, setUnreadAnnCount] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // Judge Data
  const [judgeProjects, setJudgeProjects] = useState<any[]>([]);
  const [selectedJudgeProject, setSelectedJudgeProject] = useState<any>(null);
  
  // Organizer Stats
  const [organizerStats, setOrganizerStats] = useState<any>(null);
  const [eventScores, setEventScores] = useState<any[]>([]);


  // Forms
  const [isLoginView, setIsLoginView] = useState(true);
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    fullName: "",
    username: "",
    role: "participant" as User["role"],
  });

  const [createEventForm, setCreateEventForm] = useState({
    title: "",
    slug: "",
    description: "",
    registrationOpen: new Date().toISOString().slice(0, 16),
    registrationClose: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    eventStart: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 16),
    eventEnd: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 16),
    submissionDeadline: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 16),
    timezone: "UTC",
    maxTeamSize: 4,
    minTeamSize: 1,
    tags: "",
    prizePool: '{"tracks": []}',
  });

  const [teamForm, setTeamForm] = useState({
    name: "",
    track: "",
    inviteCode: "",
  });

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    techStack: "",
    demoUrl: "",
    repoUrl: "",
    videoUrl: "",
  });

  const [scoreForm, setScoreForm] = useState({
    innovation: 5,
    technical: 5,
    impact: 5,
    presentation: 5,
    comments: "",
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
    priority: "info" as Announcement["priority"],
    target: "all" as Announcement["target"],
  });

  const notificationTimeout = useRef<any>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    setNotification({ text, type });
    notificationTimeout.current = setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const token = loadStoredToken();
    if (token) {
      setAccessTokenState(token);
      fetchCurrentUser();
    }
    fetchEvents();
  }, []);

  // Fetch initial event dependencies when user logs in/out or changes event
  useEffect(() => {
    if (selectedEvent) {
      fetchRegistrationStatus();
      fetchAnnouncements();
      fetchLeaderboard();
      if (user?.role === "organizer" || user?.role === "admin") {
        fetchEventStats();
        fetchEventScores();
      }
    } else {
      setMyRegistration(null);
      setMyTeam(null);
      setMyProject(null);
      setAnnouncements([]);
      setLeaderboard([]);
    }
  }, [selectedEvent, user]);

  useEffect(() => {
    if (myRegistration?.teamId) {
      fetchTeamDetails(myRegistration.teamId);
    } else {
      setMyTeam(null);
      setMyProject(null);
    }
  }, [myRegistration]);

  useEffect(() => {
    if (user?.role === "judge") {
      fetchJudgeProjects();
    }
  }, [user, activeTab]);

  const setToken = (token?: string) => {
    if (token) {
      localStorage.setItem("accessToken", token);
      setAuthToken(token);
      setAccessTokenState(token);
    } else {
      localStorage.removeItem("accessToken");
      setAuthToken(undefined);
      setAccessTokenState(null);
      setUser(null);
      setMyRegistration(null);
      setMyTeam(null);
      setMyProject(null);
    }
  };

  const sendRequest = async <T = any>(method: string, url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      setLoading(true);
      const response = await apiRequest<ApiResponse<T>>(method, url, data);
      setApiResult(response.data as ApiResult);
      return response.data as ApiResponse<T>;
    } catch (error: any) {
      const failed = error?.response?.data || {
        success: false,
        message: error?.message || "Request failed",
        error: error?.message || "Request failed",
        statusCode: error?.response?.status || 500,
      };
      setApiResult(failed);
      showToast(failed.error || failed.message || "An error occurred", "error");
      return failed as ApiResponse<T>;
    } finally {
      setLoading(false);
    }
  };


  // Auth Operations
  const fetchCurrentUser = async () => {
    const result = await sendRequest<User>("GET", "/auth/me");
    if (result?.success && result.data) {
      setUser(result.data);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await sendRequest("POST", "/auth/register", {
      email: authForm.email,
      password: authForm.password,
      fullName: authForm.fullName,
      username: authForm.username,
      role: authForm.role,
    });
    if (result?.success) {
      showToast("Account created successfully! Please log in.");
      setIsLoginView(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await sendRequest<{ accessToken?: string; user?: User }>("POST", "/auth/login", {
      email: authForm.email,
      password: authForm.password,
    });
    if (result?.success && result.data?.accessToken) {
      setToken(result.data.accessToken);
      setUser(result.data.user ?? null);
      showToast(`Welcome back, ${result.data.user?.fullName}!`);
    }
  };

  const handleLogout = async () => {
    await sendRequest("POST", "/auth/logout");
    setToken(undefined);
    showToast("Signed out successfully.");
  };

  const handleRefresh = async () => {
    const result = await sendRequest<{ accessToken?: string; user?: User }>("POST", "/auth/refresh");
    if (result?.success && result.data?.accessToken) {
      setToken(result.data.accessToken);
      setUser(result.data.user ?? null);
      showToast("Session refreshed successfully!");
    }
  };

  // Event Operations
  const fetchEvents = async () => {
    const result = await sendRequest<EventCard[]>("GET", "/events");
    if (result?.success && result.data) {
      setEvents(result.data);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsedPrize = {};
    try {
      parsedPrize = JSON.parse(createEventForm.prizePool);
    } catch {
      showToast("Prize Pool must be valid JSON", "error");
      return;
    }
    const tagsArray = createEventForm.tags.split(",").map(t => t.trim()).filter(Boolean);

    const result = await sendRequest("POST", "/events", {
      title: createEventForm.title,
      slug: createEventForm.slug,
      description: createEventForm.description,
      registrationOpen: new Date(createEventForm.registrationOpen).toISOString(),
      registrationClose: new Date(createEventForm.registrationClose).toISOString(),
      eventStart: new Date(createEventForm.eventStart).toISOString(),
      eventEnd: new Date(createEventForm.eventEnd).toISOString(),
      submissionDeadline: new Date(createEventForm.submissionDeadline).toISOString(),
      timezone: createEventForm.timezone,
      maxTeamSize: Number(createEventForm.maxTeamSize),
      minTeamSize: Number(createEventForm.minTeamSize),
      tags: tagsArray,
      prizePool: parsedPrize,
    });

    if (result?.success) {
      showToast("Hackathon event created successfully!");
      fetchEvents();
      setCreateEventForm({
        title: "",
        slug: "",
        description: "",
        registrationOpen: new Date().toISOString().slice(0, 16),
        registrationClose: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
        eventStart: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 16),
        eventEnd: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 16),
        submissionDeadline: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 16),
        timezone: "UTC",
        maxTeamSize: 4,
        minTeamSize: 1,
        tags: "",
        prizePool: '{"tracks": []}',
      });
    }
  };

  // Registration Operations
  const fetchRegistrationStatus = async () => {
    if (!selectedEvent) return;
    const result = await sendRequest<any>("GET", `/events/${selectedEvent.id}/registration`);
    if (result?.success) {
      setMyRegistration(result.data);
    } else {
      setMyRegistration(null);
    }
  };

  const handleRegisterForEvent = async () => {
    if (!selectedEvent) return;
    const result = await sendRequest<any>("POST", `/events/${selectedEvent.id}/register`, {
      registrationData: { experience: "Intermediate", skills: ["React", "Node.js"] }
    });
    if (result?.success) {
      showToast("Registered successfully for this event!");
      fetchRegistrationStatus();
    }
  };

  const handleCancelRegistration = async () => {
    if (!selectedEvent) return;
    if (window.confirm("Are you sure you want to cancel your registration?")) {
      const result = await sendRequest("DELETE", `/events/${selectedEvent.id}/registration`);
      if (result?.success) {
        showToast("Registration cancelled.");
        setMyRegistration(null);
        setMyTeam(null);
        setMyProject(null);
      }
    }
  };

  // Team Operations
  const fetchTeamDetails = async (teamId: string) => {
    const result = await sendRequest<Team>("GET", `/teams/${teamId}`);
    if (result?.success && result.data) {
      setMyTeam(result.data);
      fetchProjectDetails(teamId);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const result = await sendRequest<any>("POST", `/events/${selectedEvent.id}/teams`, {
      name: teamForm.name,
      track: teamForm.track || undefined,
    });
    if (result?.success) {
      showToast("Team created successfully!");
      fetchRegistrationStatus();
      setTeamForm({ name: "", track: "", inviteCode: "" });
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await sendRequest<any>("POST", "/teams/join", {
      inviteCode: teamForm.inviteCode,
    });
    if (result?.success) {
      showToast("Joined team successfully!");
      fetchRegistrationStatus();
      setTeamForm({ name: "", track: "", inviteCode: "" });
    }
  };

  const handleDisbandTeam = async () => {
    if (!myTeam) return;
    if (window.confirm("Are you sure you want to disband this team?")) {
      const result = await sendRequest("DELETE", `/teams/${myTeam.id}`);
      if (result?.success) {
        showToast("Team disbanded.");
        fetchRegistrationStatus();
      }
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!myTeam) return;
    if (window.confirm("Remove this member from the team?")) {
      const result = await sendRequest("DELETE", `/teams/${myTeam.id}/members/${userId}`);
      if (result?.success) {
        showToast("Member removed.");
        fetchTeamDetails(myTeam.id);
      }
    }
  };

  // Project Operations
  const fetchProjectDetails = async (teamId: string) => {
    const result = await sendRequest("GET", `/teams/${teamId}/project`);
    if (result?.success && result.data) {
      setMyProject(result.data);
      setProjectForm({
        title: result.data.title || "",
        description: result.data.description || "",
        techStack: result.data.techStack?.join(", ") || "",
        demoUrl: result.data.demoUrl || "",
        repoUrl: result.data.repoUrl || "",
        videoUrl: result.data.videoUrl || "",
      });
    } else {
      setMyProject(null);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTeam) return;
    const data = {
      title: projectForm.title,
      description: projectForm.description,
      techStack: projectForm.techStack.split(",").map(s => s.trim()).filter(Boolean),
      demoUrl: projectForm.demoUrl || undefined,
      repoUrl: projectForm.repoUrl || undefined,
      videoUrl: projectForm.videoUrl || undefined,
    };

    let result;
    if (myProject) {
      result = await sendRequest("PATCH", `/teams/${myTeam.id}/project`, data);
    } else {
      result = await sendRequest("POST", `/teams/${myTeam.id}/project`, data);
    }

    if (result?.success) {
      showToast("Project details saved successfully!");
      fetchProjectDetails(myTeam.id);
    }
  };

  const handleSubmitProject = async () => {
    if (!myTeam) return;
    if (window.confirm("Are you sure you want to finalize your submission? You cannot edit details after submitting!")) {
      const result = await sendRequest("POST", `/teams/${myTeam.id}/project/submit`);
      if (result?.success) {
        showToast("Project submitted successfully! Good luck!");
        fetchProjectDetails(myTeam.id);
      }
    }
  };

  const handleUploadDeck = async () => {
    if (!myTeam) return;
    const result = await sendRequest("POST", `/teams/${myTeam.id}/project/deck`);
    if (result?.success && result.data) {
      showToast("Pitch deck uploaded successfully!");
      fetchProjectDetails(myTeam.id);
    }
  };

  // Announcements Operations
  const fetchAnnouncements = async () => {
    if (!selectedEvent) return;
    const result = await sendRequest<Announcement[]>("GET", `/events/${selectedEvent.id}/announcements`);
    if (result?.success && result.data) {
      setAnnouncements(result.data);
    }
    fetchUnreadAnnCount();
  };

  const fetchUnreadAnnCount = async () => {
    if (!selectedEvent) return;
    const result = await sendRequest<number>("GET", `/events/${selectedEvent.id}/announcements/unread-count`);
    if (result?.success && typeof result.data === "number") {
      setUnreadAnnCount(result.data);
    }
  };

  const handleMarkAnnAsRead = async (annId: string) => {
    if (!selectedEvent) return;
    const result = await sendRequest("POST", `/events/${selectedEvent.id}/announcements/${annId}/read`);
    if (result?.success) {
      fetchAnnouncements();
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const result = await sendRequest<Announcement>("POST", `/events/${selectedEvent.id}/announcements`, {
      title: announcementForm.title,
      body: announcementForm.body,
      priority: announcementForm.priority,
      target: announcementForm.target,
    });
    if (result?.success) {
      showToast("Draft announcement created!");
      fetchAnnouncements();
      setAnnouncementForm({ title: "", body: "", priority: "info", target: "all" });
    }
  };

  const handlePublishAnnouncement = async (annId: string) => {
    if (!selectedEvent) return;
    const result = await sendRequest("POST", `/events/${selectedEvent.id}/announcements/${annId}/publish`);
    if (result?.success) {
      showToast("Announcement published & broadcasted successfully!");
      fetchAnnouncements();
    }
  };

  // Leaderboard Operations
  const fetchLeaderboard = async () => {
    if (!selectedEvent) return;
    const result = await sendRequest<any>("GET", `/events/${selectedEvent.id}/leaderboard`);
    if (result?.success && result.data) {
      setLeaderboard(result.data?.results || []);
    }
  };



  // Judge Operations
  const fetchJudgeProjects = async () => {
    const result = await sendRequest<any[]>("GET", "/judge/projects");
    if (result?.success && result.data) {
      setJudgeProjects(result.data);
    }
  };

  const handleSelectJudgeProject = async (projectId: string) => {
    const result = await sendRequest("GET", `/judge/projects/${projectId}`);
    if (result?.success && result.data) {
      setSelectedJudgeProject(result.data);
      const score = result.data.scores?.[0]; // Existing score for current judge
      setScoreForm({
        innovation: score?.innovation || 5,
        technical: score?.technical || 5,
        impact: score?.impact || 5,
        presentation: score?.presentation || 5,
        comments: score?.comments || "",
      });
    }
  };

  const handleScoreProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJudgeProject) return;
    const result = await sendRequest("POST", `/judge/projects/${selectedJudgeProject.id}/score`, {
      innovation: Number(scoreForm.innovation),
      technical: Number(scoreForm.technical),
      impact: Number(scoreForm.impact),
      presentation: Number(scoreForm.presentation),
      comments: scoreForm.comments || undefined,
    });
    if (result?.success) {
      showToast("Scores submitted successfully!");
      fetchJudgeProjects();
      setSelectedJudgeProject(null);
    }
  };

  // Organizer Operations
  const fetchEventStats = async () => {
    if (!selectedEvent) return;
    const result = await sendRequest("GET", `/events/${selectedEvent.id}/stats`);
    if (result?.success && result.data) {
      setOrganizerStats(result.data);
    }
  };

  const fetchEventScores = async () => {
    if (!selectedEvent) return;
    const result = await sendRequest<any[]>("GET", `/events/${selectedEvent.id}/scores`);
    if (result?.success && result.data) {
      setEventScores(result.data);
    }
  };

  const handleToggleEventPublic = async (eventId: string, isPublic: boolean) => {
    const result = await sendRequest("PATCH", `/events/${eventId}`, { isPublic });
    if (result?.success) {
      showToast(`Event visibility updated.`);
      fetchEvents();
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(prev => prev ? { ...prev, isPublic } : null);
      }
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`toast-message toast-${notification.type}`}>
          {notification.type === "success" ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Navigation Side Panel */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <Trophy className="logo-icon animate-pulse" />
          <span className="logo-text">Beetle<span>X</span></span>
        </div>

        {user && (
          <div className="sidebar-user">
            <div className="avatar">{(user.fullName[0] || "?").toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name">{user.fullName}</span>
              <span className="user-role-badge role-badge">{user.role}</span>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            <Calendar size={18} />
            <span>Events Catalog</span>
          </button>

          {user && (
            <>
              <button 
                className={`nav-item ${activeTab === "team" ? "active" : ""}`}
                onClick={() => setActiveTab("team")}
                disabled={!selectedEvent}
              >
                <Users size={18} />
                <span>My Team & Project</span>
                {!selectedEvent && <span className="locked">Select Event</span>}
              </button>

              <button 
                className={`nav-item ${activeTab === "announcements" ? "active" : ""}`}
                onClick={() => setActiveTab("announcements")}
                disabled={!selectedEvent}
              >
                <Megaphone size={18} />
                <span>Announcements</span>
                {unreadAnnCount > 0 && <span className="ann-badge">{unreadAnnCount}</span>}
                {!selectedEvent && <span className="locked">Select Event</span>}
              </button>

              {user.role === "judge" && (
                <button 
                  className={`nav-item ${activeTab === "judging" ? "active" : ""}`}
                  onClick={() => setActiveTab("judging")}
                >
                  <Award size={18} />
                  <span>Judging Panel</span>
                </button>
              )}

              {(user.role === "organizer" || user.role === "admin") && (
                <button 
                  className={`nav-item ${activeTab === "organizer" ? "active" : ""}`}
                  onClick={() => setActiveTab("organizer")}
                >
                  <Layers size={18} />
                  <span>Organizer Console</span>
                </button>
              )}

            </>
          )}

          <button 
            className={`nav-item ${activeTab === "leaderboard" ? "active" : ""}`}
            onClick={() => setActiveTab("leaderboard")}
            disabled={!selectedEvent}
          >
            <Trophy size={18} />
            <span>Leaderboard</span>
            {!selectedEvent && <span className="locked">Select Event</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <button className="btn-logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          ) : (
            <p className="footer-guest">Guest Mode</p>
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <main className="app-main-content">
        <header className="main-header">
          <div className="header-meta">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Workspace</h1>
            {selectedEvent && (
              <div className="active-event-indicator">
                <Activity size={14} className="text-emerald-400" />
                <span>Active Event: <strong>{selectedEvent.title}</strong></span>
              </div>
            )}
          </div>
          <div className="header-actions">
            {user && (
              <button className="btn-icon-label" onClick={handleRefresh} title="Refresh Session" disabled={loading}>
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>Sync</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="content-container">
          
          {/* USER NOT SIGNED IN SHIELD */}
          {!user && activeTab !== "events" && activeTab !== "leaderboard" && (
            <div className="auth-shield">
              <ShieldAlert size={48} className="shield-icon" />
              <h2>Authentication Required</h2>
              <p>You need to sign in to access team management, project submission, and organizer tools.</p>
              <button className="btn-primary" onClick={() => {
                setActiveTab("events");
                // Focus auth section
                document.getElementById("auth-card")?.scrollIntoView({ behavior: "smooth" });
              }}>
                Sign In / Register
              </button>
            </div>
          )}

          {/* TAB 1: EVENTS CATALOG */}
          {activeTab === "events" && (
            <div className="grid-2-cols">
              <div className="events-column">
                <div className="panel-card">
                  <div className="panel-header">
                    <Calendar className="header-icon" />
                    <h2>Active Hackathons</h2>
                  </div>
                  
                  {events.length === 0 ? (
                    <div className="empty-state">
                      <p>No hackathon events are currently active.</p>
                      <button className="btn-secondary" onClick={fetchEvents}>
                        <RefreshCw size={14} /> Retry Load
                      </button>
                    </div>
                  ) : (
                    <div className="events-grid">
                      {events.map((evt) => (
                        <div 
                          key={evt.id} 
                          className={`event-item-card ${selectedEvent?.id === evt.id ? "active-card" : ""}`}
                          onClick={() => setSelectedEvent(evt)}
                        >
                          <div className="event-meta">
                            <span className="slug">/{evt.slug}</span>
                            {!evt.isPublic && <span className="badge-private">Draft</span>}
                          </div>
                          <h3>{evt.title}</h3>
                          <p className="line-clamp-2">{evt.description}</p>
                          <div className="tags-row">
                            {evt.tags?.map(t => <span key={t} className="tag">{t}</span>)}
                          </div>
                          <div className="event-footer">
                            <div className="footer-metric">
                              <Users size={12} />
                              <span>{evt._count?.registrations ?? 0} Registrants</span>
                            </div>
                            <span className="btn-text">Manage →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="side-column">
                {/* Auth Screen card */}
                {!user && (
                  <div className="panel-card" id="auth-card">
                    <div className="panel-header">
                      <UserCheck className="header-icon" />
                      <h2>{isLoginView ? "Welcome Back" : "Create Account"}</h2>
                    </div>

                    <form onSubmit={isLoginView ? handleLogin : handleRegister} className="form-stack">
                      {!isLoginView && (
                        <>
                          <div className="form-group">
                            <label>Full Name</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. John Doe"
                              value={authForm.fullName}
                              onChange={e => setAuthForm({ ...authForm, fullName: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Username</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. johndoe"
                              value={authForm.username}
                              onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Account Role</label>
                            <select 
                              value={authForm.role}
                              onChange={e => setAuthForm({ ...authForm, role: e.target.value as User["role"] })}
                            >
                              <option value="participant">Participant</option>
                              <option value="judge">Judge</option>
                              <option value="organizer">Organizer</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </div>
                        </>
                      )}
                      <div className="form-group">
                        <label>Email Address</label>
                        <input 
                          type="email" 
                          required 
                          placeholder="e.g. john@beetlex.com"
                          value={authForm.email}
                          onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Password</label>
                        <input 
                          type="password" 
                          required 
                          placeholder="••••••••"
                          value={authForm.password}
                          onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {isLoginView ? "Sign In" : "Register"}
                      </button>
                    </form>

                    <div className="auth-toggle">
                      <button className="btn-link" onClick={() => setIsLoginView(!isLoginView)}>
                        {isLoginView ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Event Details */}
                {selectedEvent && (
                  <div className="panel-card event-details-panel">
                    <h3>{selectedEvent.title}</h3>
                    <p className="desc-preview">{selectedEvent.description}</p>
                    
                    <div className="meta-list">
                      <div className="meta-item">
                        <Clock size={16} />
                        <div>
                          <strong>Event Starts:</strong>
                          <span>{new Date(selectedEvent.eventStart).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="meta-item">
                        <Clock size={16} />
                        <div>
                          <strong>Submission Deadline:</strong>
                          <span className="text-red-500 font-bold">{new Date(selectedEvent.submissionDeadline).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="meta-item">
                        <Users size={16} />
                        <div>
                          <strong>Team Constraints:</strong>
                          <span>{selectedEvent.minTeamSize} - {selectedEvent.maxTeamSize} members</span>
                        </div>
                      </div>
                    </div>

                    {user && (
                      <div className="event-registration-actions">
                        {myRegistration ? (
                          <div className="registered-badge-box">
                            <span className="success-badge">✓ Registered for this Hackathon</span>
                            {myRegistration.teamId ? (
                              <p className="hint-text">Team: {myTeam?.name || "Loading..."}</p>
                            ) : (
                              <p className="hint-text">No team joined yet. Head to the Team tab.</p>
                            )}
                            <button className="btn-destructive-link" onClick={handleCancelRegistration}>
                              Cancel Registration
                            </button>
                          </div>
                        ) : (
                          <button className="btn-primary w-full" onClick={handleRegisterForEvent} disabled={loading}>
                            Register for Hackathon
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY TEAM & PROJECT */}
          {activeTab === "team" && selectedEvent && (
            <div className="grid-2-cols">
              <div className="team-column">
                
                {/* No Team State */}
                {!myRegistration?.teamId && (
                  <div className="panel-card">
                    <div className="panel-header">
                      <Users className="header-icon" />
                      <h2>Form or Join a Team</h2>
                    </div>
                    <p className="hint-text mb-6">To participate in this hackathon, you must either create a new team as a leader or join an existing one using an invite code.</p>

                    <div className="grid-2-cols gap-6">
                      <form onSubmit={handleCreateTeam} className="form-stack">
                        <h3>Create a Team</h3>
                        <div className="form-group">
                          <label>Team Name</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Code Hackers"
                            value={teamForm.name}
                            onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Target Track (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. AI track"
                            value={teamForm.track}
                            onChange={e => setTeamForm({ ...teamForm, track: e.target.value })}
                          />
                        </div>
                        <button type="submit" className="btn-primary w-full">Create Team</button>
                      </form>

                      <form onSubmit={handleJoinTeam} className="form-stack border-l">
                        <h3>Join with Invite Code</h3>
                        <div className="form-group">
                          <label>Invite Code</label>
                          <input 
                            type="text" 
                            required 
                            maxLength={12}
                            placeholder="e.g. TEAM123CODE"
                            value={teamForm.inviteCode}
                            onChange={e => setTeamForm({ ...teamForm, inviteCode: e.target.value.toUpperCase() })}
                          />
                        </div>
                        <button type="submit" className="btn-secondary w-full">Join Team</button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Team Details State */}
                {myTeam && (
                  <div className="panel-card">
                    <div className="panel-header">
                      <Users className="header-icon" />
                      <h2>Team: {myTeam.name}</h2>
                      <span className="badge-invite-code">Invite Code: <strong>{myTeam.inviteCode}</strong></span>
                    </div>

                    {myTeam.track && <p className="team-track-indicator">Track: <strong>{myTeam.track}</strong></p>}

                    <div className="members-section">
                      <h3>Team Members</h3>
                      <div className="members-list">
                        {myTeam.members?.map((member) => (
                          <div key={member.user.id} className="member-item">
                            <div className="member-meta">
                              <strong>{member.user.fullName}</strong>
                              <span>@{member.user.username}</span>
                            </div>
                            <div className="member-actions">
                              <span className={`role-tag role-${member.role}`}>{member.role}</span>
                              {myTeam.leaderId === user?.id && member.user.id !== user?.id && (
                                <button 
                                  className="btn-icon-destructive" 
                                  onClick={() => handleRemoveMember(member.user.id)}
                                  title="Remove Member"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {myTeam.leaderId === user?.id && (
                      <div className="team-admin-actions border-t">
                        <button className="btn-destructive" onClick={handleDisbandTeam}>
                          Disband Team
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Project Workspace */}
              <div className="project-column">
                {myTeam && (
                  <div className="panel-card">
                    <div className="panel-header">
                      <FileText className="header-icon" />
                      <h2>Project Submission</h2>
                    </div>

                    <form onSubmit={handleSaveProject} className="form-stack">
                      <div className="form-group">
                        <label>Project Title</label>
                        <input 
                          type="text" 
                          required 
                          disabled={myProject?.status === "submitted" || myProject?.status === "scored"}
                          placeholder="e.g. BeetleX Portal"
                          value={projectForm.title}
                          onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Short Pitch & Description</label>
                        <textarea 
                          rows={4} 
                          required
                          disabled={myProject?.status === "submitted" || myProject?.status === "scored"}
                          placeholder="Describe your project, features, and how it solves the prompt."
                          value={projectForm.description}
                          onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Tech Stack (comma separated)</label>
                        <input 
                          type="text" 
                          disabled={myProject?.status === "submitted" || myProject?.status === "scored"}
                          placeholder="React, Node.js, PostgreSQL, Prisma"
                          value={projectForm.techStack}
                          onChange={e => setProjectForm({ ...projectForm, techStack: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Demo URL (Optional)</label>
                        <input 
                          type="url" 
                          disabled={myProject?.status === "submitted" || myProject?.status === "scored"}
                          placeholder="https://..."
                          value={projectForm.demoUrl}
                          onChange={e => setProjectForm({ ...projectForm, demoUrl: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Repository URL (Optional)</label>
                        <input 
                          type="url" 
                          disabled={myProject?.status === "submitted" || myProject?.status === "scored"}
                          placeholder="https://github.com/..."
                          value={projectForm.repoUrl}
                          onChange={e => setProjectForm({ ...projectForm, repoUrl: e.target.value })}
                        />
                      </div>

                      {myProject?.status !== "submitted" && myProject?.status !== "scored" ? (
                        <div className="button-group-row">
                          <button type="submit" className="btn-primary flex-1" disabled={loading}>
                            Save Draft Project
                          </button>
                          {myProject && (
                            <>
                              <button type="button" className="btn-secondary" onClick={handleUploadDeck} disabled={loading}>
                                Upload Deck (Mock)
                              </button>
                              <button type="button" className="btn-accent" onClick={handleSubmitProject} disabled={loading}>
                                Finalize & Submit
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="submitted-banner">
                          <span className="success-badge">✓ Submitted & Locked</span>
                          {myProject.deckUrl && (
                            <p>Pitch Deck: <a href={myProject.deckUrl} target="_blank" rel="noreferrer">Open PDF</a></p>
                          )}
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ANNOUNCEMENTS */}
          {activeTab === "announcements" && selectedEvent && (
            <div className="grid-2-cols">
              <div className="announcements-column">
                <div className="panel-card">
                  <div className="panel-header">
                    <Megaphone className="header-icon" />
                    <h2>Broadcasts</h2>
                  </div>

                  {announcements.length === 0 ? (
                    <div className="empty-state">
                      <p>No announcements published yet for this event.</p>
                    </div>
                  ) : (
                    <div className="announcements-stack">
                      {announcements.map((ann) => {
                        const isRead = ann.reads && ann.reads.length > 0;
                        return (
                          <div key={ann.id} className={`ann-card priority-${ann.priority} ${isRead ? "ann-read" : "ann-unread"}`}>
                            <div className="ann-meta">
                              <span className={`priority-badge`}>{ann.priority}</span>
                              <span className="target">To: {ann.target}</span>
                              <span className="time">{new Date(ann.createdAt).toLocaleString()}</span>
                            </div>
                            <h3>{ann.title}</h3>
                            <p>{ann.body}</p>
                            {!isRead && (
                              <button className="btn-read-mark" onClick={() => handleMarkAnnAsRead(ann.id)}>
                                Mark as Read
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Organizer Announcements Creator */}
              <div className="announcement-creator-column">
                {(user?.role === "organizer" || user?.role === "admin") && (
                  <div className="panel-card">
                    <div className="panel-header">
                      <Plus className="header-icon" />
                      <h2>Create Announcement</h2>
                    </div>

                    <form onSubmit={handleCreateAnnouncement} className="form-stack">
                      <div className="form-group">
                        <label>Title</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Final Submission Deadline Extension"
                          value={announcementForm.title}
                          onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Body Content</label>
                        <textarea 
                          rows={4} 
                          required 
                          placeholder="Enter announcement details..."
                          value={announcementForm.body}
                          onChange={e => setAnnouncementForm({ ...announcementForm, body: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Priority</label>
                        <select 
                          value={announcementForm.priority}
                          onChange={e => setAnnouncementForm({ ...announcementForm, priority: e.target.value as Announcement["priority"] })}
                        >
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Target Audience</label>
                        <select 
                          value={announcementForm.target}
                          onChange={e => setAnnouncementForm({ ...announcementForm, target: e.target.value as Announcement["target"] })}
                        >
                          <option value="all">All Users</option>
                          <option value="participants">Participants</option>
                          <option value="judges">Judges</option>
                          <option value="organizers">Organizers</option>
                        </select>
                      </div>
                      <button type="submit" className="btn-primary w-full">Save Draft Announcement</button>
                    </form>

                    <div className="draft-list-section border-t mt-6 pt-4">
                      <h3>Draft Announcements</h3>
                      <div className="drafts-stack">
                        {announcements.filter(a => !a.isPublished).map(draft => (
                          <div key={draft.id} className="draft-ann-item">
                            <div>
                              <h4>{draft.title}</h4>
                              <span className="meta">{draft.priority} | To: {draft.target}</span>
                            </div>
                            <button className="btn-accent" onClick={() => handlePublishAnnouncement(draft.id)}>
                              Publish
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: JUDGING PORTAL */}
          {activeTab === "judging" && user?.role === "judge" && (
            <div className="grid-2-cols">
              <div className="assigned-projects-column">
                <div className="panel-card">
                  <div className="panel-header">
                    <Award className="header-icon" />
                    <h2>Assigned Submissions</h2>
                  </div>

                  {judgeProjects.length === 0 ? (
                    <div className="empty-state">
                      <p>You have no assigned projects to grade.</p>
                    </div>
                  ) : (
                    <div className="assigned-grid">
                      {judgeProjects.map((proj) => {
                        const graded = proj.scores && proj.scores.length > 0;
                        return (
                          <div 
                            key={proj.id} 
                            className={`judge-project-card ${selectedJudgeProject?.id === proj.id ? "active-card" : ""} ${graded ? "project-graded" : ""}`}
                            onClick={() => handleSelectJudgeProject(proj.id)}
                          >
                            <div className="meta">
                              <span>Track: {proj.team?.track || "General"}</span>
                              {graded && <span className="success-badge">Graded: {proj.scores[0].total.toFixed(2)}</span>}
                            </div>
                            <h3>{proj.title}</h3>
                            <p className="line-clamp-2">{proj.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Scoring form */}
              <div className="scoring-column">
                {selectedJudgeProject ? (
                  <div className="panel-card">
                    <div className="panel-header">
                      <Award className="header-icon" />
                      <h2>Grade: {selectedJudgeProject.title}</h2>
                    </div>
                    <p className="desc-preview">{selectedJudgeProject.description}</p>
                    
                    <form onSubmit={handleScoreProject} className="form-stack mt-6">
                      <div className="criteria-sliders">
                        <div className="slider-group">
                          <div className="slider-label">
                            <span>Innovation</span>
                            <strong>{scoreForm.innovation} / 10</strong>
                          </div>
                          <input 
                            type="range" min={1} max={10} step={1}
                            value={scoreForm.innovation}
                            onChange={e => setScoreForm({ ...scoreForm, innovation: Number(e.target.value) })}
                          />
                        </div>
                        <div className="slider-group">
                          <div className="slider-label">
                            <span>Technical Execution</span>
                            <strong>{scoreForm.technical} / 10</strong>
                          </div>
                          <input 
                            type="range" min={1} max={10} step={1}
                            value={scoreForm.technical}
                            onChange={e => setScoreForm({ ...scoreForm, technical: Number(e.target.value) })}
                          />
                        </div>
                        <div className="slider-group">
                          <div className="slider-label">
                            <span>Impact</span>
                            <strong>{scoreForm.impact} / 10</strong>
                          </div>
                          <input 
                            type="range" min={1} max={10} step={1}
                            value={scoreForm.impact}
                            onChange={e => setScoreForm({ ...scoreForm, impact: Number(e.target.value) })}
                          />
                        </div>
                        <div className="slider-group">
                          <div className="slider-label">
                            <span>Presentation</span>
                            <strong>{scoreForm.presentation} / 10</strong>
                          </div>
                          <input 
                            type="range" min={1} max={10} step={1}
                            value={scoreForm.presentation}
                            onChange={e => setScoreForm({ ...scoreForm, presentation: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Judge Comments</label>
                        <textarea 
                          rows={3} 
                          placeholder="Provide feedback to the team..."
                          value={scoreForm.comments}
                          onChange={e => setScoreForm({ ...scoreForm, comments: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="btn-primary w-full">Submit Score Matrix</button>
                    </form>
                  </div>
                ) : (
                  <div className="panel-card empty-state-card">
                    <p className="hint-text">Select a submission from the list to begin grading.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ORGANIZER CONSOLE */}
          {activeTab === "organizer" && (user?.role === "organizer" || user?.role === "admin") && (
            selectedEvent ? (
              <div className="grid-2-cols">
                <div className="stats-column">
                  <div className="panel-card">
                    <div className="panel-header">
                      <BarChart className="header-icon" />
                      <h2>Live Hackathon Stats</h2>
                    </div>

                    {organizerStats ? (
                      <div className="stats-metrics-grid">
                        <div className="metric-box">
                          <strong>Registrations</strong>
                          <p>{organizerStats.registrations ?? 0}</p>
                        </div>
                        <div className="metric-box">
                          <strong>Teams Formed</strong>
                          <p>{organizerStats.teams ?? 0}</p>
                        </div>
                        <div className="metric-box">
                          <strong>Submissions</strong>
                          <p>{organizerStats.submissions ?? 0}</p>
                        </div>
                        <div className="metric-box">
                          <strong>Assigned Judges</strong>
                          <p>{organizerStats.judges ?? 0}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="hint-text">No stats available.</p>
                    )}

                    {/* Public visibility toggle */}
                    <div className="event-settings-box border-t mt-6 pt-4">
                      <h3>Visibility settings</h3>
                      <div className="toggle-row">
                        <span>Public leaderboard visibility:</span>
                        <button 
                          className={`btn-toggle ${selectedEvent.isPublic ? "toggle-active" : ""}`}
                          onClick={() => handleToggleEventPublic(selectedEvent.id, !selectedEvent.isPublic)}
                        >
                          {selectedEvent.isPublic ? "Public" : "Private (Draft)"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Event Creation Form */}
                  <div className="panel-card mt-6">
                    <div className="panel-header">
                      <Plus className="header-icon" />
                      <h2>Host a New Event</h2>
                    </div>

                    <form onSubmit={handleCreateEvent} className="form-stack">
                      <div className="form-group">
                        <label>Title</label>
                        <input 
                          type="text" required placeholder="e.g. BuildIRL Hackathon"
                          value={createEventForm.title}
                          onChange={e => setCreateEventForm({ ...createEventForm, title: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Slug (URL Identifier)</label>
                        <input 
                          type="text" required placeholder="e.g. buildirl-2026"
                          value={createEventForm.slug}
                          onChange={e => setCreateEventForm({ ...createEventForm, slug: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea 
                          rows={3} required placeholder="Description of the event..."
                          value={createEventForm.description}
                          onChange={e => setCreateEventForm({ ...createEventForm, description: e.target.value })}
                        />
                      </div>
                      <div className="grid-2-cols gap-4">
                        <div className="form-group">
                          <label>Registration Open</label>
                          <input 
                            type="datetime-local" required
                            value={createEventForm.registrationOpen}
                            onChange={e => setCreateEventForm({ ...createEventForm, registrationOpen: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Registration Close</label>
                          <input 
                            type="datetime-local" required
                            value={createEventForm.registrationClose}
                            onChange={e => setCreateEventForm({ ...createEventForm, registrationClose: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid-2-cols gap-4">
                        <div className="form-group">
                          <label>Event Start</label>
                          <input 
                            type="datetime-local" required
                            value={createEventForm.eventStart}
                            onChange={e => setCreateEventForm({ ...createEventForm, eventStart: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Event End</label>
                          <input 
                            type="datetime-local" required
                            value={createEventForm.eventEnd}
                            onChange={e => setCreateEventForm({ ...createEventForm, eventEnd: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Submission Deadline</label>
                        <input 
                          type="datetime-local" required
                          value={createEventForm.submissionDeadline}
                          onChange={e => setCreateEventForm({ ...createEventForm, submissionDeadline: e.target.value })}
                        />
                      </div>
                      <div className="grid-2-cols gap-4">
                        <div className="form-group">
                          <label>Min Team Size</label>
                          <input 
                            type="number" required min={1}
                            value={createEventForm.minTeamSize}
                            onChange={e => setCreateEventForm({ ...createEventForm, minTeamSize: Number(e.target.value) })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Max Team Size</label>
                          <input 
                            type="number" required min={1}
                            value={createEventForm.maxTeamSize}
                            onChange={e => setCreateEventForm({ ...createEventForm, maxTeamSize: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Tags (Comma separated)</label>
                        <input 
                          type="text" placeholder="web, mobile, ai"
                          value={createEventForm.tags}
                          onChange={e => setCreateEventForm({ ...createEventForm, tags: e.target.value })}
                        />
                      </div>
                      <button type="submit" className="btn-primary w-full">Publish Hackathon Event</button>
                    </form>
                  </div>
                </div>

                {/* Scores List */}
                <div className="scores-column">
                  <div className="panel-card">
                    <div className="panel-header">
                      <Award className="header-icon" />
                      <h2>Judge Evaluation Matrices</h2>
                    </div>

                    {eventScores.length === 0 ? (
                      <div className="empty-state">
                        <p>No evaluation scores have been submitted yet.</p>
                      </div>
                    ) : (
                      <div className="scores-table-container">
                        <table className="eval-table">
                          <thead>
                            <tr>
                              <th>Project</th>
                              <th>Innov</th>
                              <th>Tech</th>
                              <th>Imp</th>
                              <th>Pres</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eventScores.map((score, idx) => (
                              <tr key={score.id ?? idx}>
                                <td><strong>{score.project?.title}</strong></td>
                                <td>{score.innovation}</td>
                                <td>{score.technical}</td>
                                <td>{score.impact}</td>
                                <td>{score.presentation}</td>
                                <td className="text-blue-500 font-bold">{score.total.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="panel-card w-full max-w-lg mx-auto">
                <div className="panel-header">
                  <Plus className="header-icon" />
                  <h2>Host a New Event</h2>
                </div>
                <p className="hint-text mb-4">No event selected. Fill out the form below to create your first hackathon event!</p>

                <form onSubmit={handleCreateEvent} className="form-stack">
                  <div className="form-group">
                    <label>Title</label>
                    <input 
                      type="text" required placeholder="e.g. BuildIRL Hackathon"
                      value={createEventForm.title}
                      onChange={e => setCreateEventForm({ ...createEventForm, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Slug (URL Identifier)</label>
                    <input 
                      type="text" required placeholder="e.g. buildirl-2026"
                      value={createEventForm.slug}
                      onChange={e => setCreateEventForm({ ...createEventForm, slug: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      rows={3} required placeholder="Description of the event..."
                      value={createEventForm.description}
                      onChange={e => setCreateEventForm({ ...createEventForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid-2-cols gap-4">
                    <div className="form-group">
                      <label>Registration Open</label>
                      <input 
                        type="datetime-local" required
                        value={createEventForm.registrationOpen}
                        onChange={e => setCreateEventForm({ ...createEventForm, registrationOpen: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Registration Close</label>
                      <input 
                        type="datetime-local" required
                        value={createEventForm.registrationClose}
                        onChange={e => setCreateEventForm({ ...createEventForm, registrationClose: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid-2-cols gap-4">
                    <div className="form-group">
                      <label>Event Start</label>
                      <input 
                        type="datetime-local" required
                        value={createEventForm.eventStart}
                        onChange={e => setCreateEventForm({ ...createEventForm, eventStart: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Event End</label>
                      <input 
                        type="datetime-local" required
                        value={createEventForm.eventEnd}
                        onChange={e => setCreateEventForm({ ...createEventForm, eventEnd: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Submission Deadline</label>
                    <input 
                      type="datetime-local" required
                      value={createEventForm.submissionDeadline}
                      onChange={e => setCreateEventForm({ ...createEventForm, submissionDeadline: e.target.value })}
                    />
                  </div>
                  <div className="grid-2-cols gap-4">
                    <div className="form-group">
                      <label>Min Team Size</label>
                      <input 
                        type="number" required min={1}
                        value={createEventForm.minTeamSize}
                        onChange={e => setCreateEventForm({ ...createEventForm, minTeamSize: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Team Size</label>
                      <input 
                        type="number" required min={1}
                        value={createEventForm.maxTeamSize}
                        onChange={e => setCreateEventForm({ ...createEventForm, maxTeamSize: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Tags (Comma separated)</label>
                    <input 
                      type="text" placeholder="web, mobile, ai"
                      value={createEventForm.tags}
                      onChange={e => setCreateEventForm({ ...createEventForm, tags: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full">Publish Hackathon Event</button>
                </form>
              </div>
            )
          )}


          {/* TAB 6: LEADERBOARD */}
          {activeTab === "leaderboard" && selectedEvent && (
            <div className="panel-card">
              <div className="panel-header">
                <Trophy className="header-icon text-yellow-500" />
                <h2>Leaderboard Rankings</h2>
                <button className="btn-secondary ml-auto" onClick={fetchLeaderboard} disabled={loading}>
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Rankings
                </button>
              </div>

              {leaderboard.length === 0 ? (
                <div className="empty-state">
                  <p>The leaderboard is currently empty. This happens if scores haven't been submitted, or the organizer hasn't published results yet.</p>
                </div>
              ) : (
                <div className="leaderboard-table-wrapper">
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th className="rank-col">Rank</th>
                        <th>Team Name</th>
                        <th>Track</th>
                        <th>Project</th>
                        <th className="score-col">Aggregate Score</th>
                        <th>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((item, index) => (
                        <tr key={item.id || index} className={`rank-row-${index + 1}`}>
                          <td className="rank-col">
                            <span className={`rank-badge badge-${index + 1}`}>{index + 1}</span>
                          </td>
                          <td><strong>{item.team?.name || item.name}</strong></td>
                          <td><span className="track-badge">{item.team?.track || "General"}</span></td>
                          <td>{item.title}</td>
                          <td className="score-col font-bold text-lg">{item.averageScore?.toFixed(2) || item.score?.toFixed(2) || "0.00"}</td>
                          <td className="date-col">{item.submittedAt ? new Date(item.submittedAt).toLocaleTimeString() : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* API Log details section */}
          <section className="panel-card api-response-panel mt-6">
            <div className="panel-header cursor-pointer" onClick={() => {
              const el = document.getElementById("api-res-box");
              if (el) el.classList.toggle("hidden");
            }}>
              <Activity className="header-icon" />
              <h2>Developer Console & API Response Logs</h2>
              <span className="badge">Status: {apiResult?.statusCode ?? "Idle"}</span>
            </div>
            <div id="api-res-box" className="api-response-content mt-4">
              <pre className="response-pre">
                {apiResult ? JSON.stringify(apiResult, null, 2) : "// Perform actions to see backend logs here."}
              </pre>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default App;
