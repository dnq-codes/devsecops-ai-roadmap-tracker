import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import Markdown from 'react-markdown';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Flame,
  Award,
  Settings,
  RotateCcw,
  TrendingUp,
  ExternalLink,
  Lock,
  Unlock,
  BookOpen,
  Layers,
  ArrowRight,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  MessageSquareCode,
  Sun,
  Moon,
  Search,
  Copy,
  Check,
  Plus
} from 'lucide-react';
import { ROADMAP_DAYS, PHASES, DayTask, Phase } from './data';

const AnimatedCheckmark = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="overflow-visible inline-block shrink-0"
  >
    <motion.circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2.5"
      initial={{ pathLength: 0, opacity: 0.2 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    />
    <motion.path
      d="M7 12.5l3.5 3.5 6.5-7"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
    />
  </svg>
);

interface DailyGoal {
  id: string;
  text: string;
  completed: boolean;
}

export default function App() {
  // Auth and cinematic splash state declarations
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('devsecops_auth_token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('devsecops_username'));
  const [splashStep, setSplashStep] = useState<number>(0);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Welcome banner and transition states
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState<boolean>(false);
  const [welcomeProgress, setWelcomeProgress] = useState<number>(0);
  const [welcomeStatus, setWelcomeStatus] = useState<string>('Initializing secure terminal...');

  // Theme configuration state: allows users to override and force light mode
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('devsecops_theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('devsecops_theme', theme);
  }, [theme]);

  // Auth Forms state declarations
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Custom fetch wrapper that injects authentication token and handles auto logout on 401
  const fetchWithAuth = async (url: string, init: RequestInit = {}) => {
    const token = localStorage.getItem('devsecops_auth_token');
    const headers = {
      ...init.headers,
    } as Record<string, string>;

    if (!headers['Content-Type'] && !(init.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(url, {
      ...init,
      headers,
    });

    if (res.status === 401) {
      localStorage.removeItem('devsecops_auth_token');
      localStorage.removeItem('devsecops_username');
      setAuthToken(null);
      setUsername(null);
    }

    return res;
  };

  // State
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [startDate, setStartDate] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ missedCount: number; statusMessage: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'missed' | 'next7' | 'all'>('all');
  const [setupDateInput, setSetupDateInput] = useState<string>('');
  
  // Custom Daily Notification States
  const [notiMsg, setNotiMsg] = useState<string>('');
  const [notiTime, setNotiTime] = useState<string>('09:00');
  const [notiEnabled, setNotiEnabled] = useState<boolean>(false);
  const [notiUIMessage, setNotiUIMessage] = useState<{ text: string; type: 'success' | 'info' | 'reminder' } | null>(null);

  // AI assistant mentor states
  const [aiChatOpen, setAiChatOpen] = useState<boolean>(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: "👋 Welcome! I am your AI DevOps & DevSecOps Mentor. Ask me any question about today's roadmap, request a hands-on mini-lab, or trigger a self-evaluation quiz!"
    }
  ]);
  const [aiInput, setAiInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Exporter, Search, and Live Interactive Quiz state variables
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);
  
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isQuizModalOpen, setIsQuizModalOpen] = useState<boolean>(false);
  const [isQuizLoading, setIsQuizLoading] = useState<boolean>(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizSelectedAnswers, setQuizSelectedAnswers] = useState<Record<number, number>>({});
  const [quizExplOpened, setQuizExplOpened] = useState<Record<number, boolean>>({});
  const [quizError, setQuizError] = useState<string | null>(null);

  // Daily Goals state variables
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [newGoalText, setNewGoalText] = useState<string>('');

  // Local storage synchronization helper to prevent data wipes across restarts
  const updateLocalBackup = (
    updatedCompletedDays?: Set<number>,
    updatedStartDate?: string | null,
    updatedNotiMsg?: string,
    updatedNotiTime?: string,
    updatedNotiEnabled?: boolean,
    updatedDailyGoals?: DailyGoal[],
    updatedAiMessages?: any[]
  ) => {
    try {
      const backupStr = localStorage.getItem('devsecops_backup_data');
      let currentBackup: any = {};
      if (backupStr) {
        try {
          currentBackup = JSON.parse(backupStr);
        } catch (_) {}
      }
      
      const backupObj = {
        startDate: updatedStartDate !== undefined ? updatedStartDate : (startDate !== undefined ? startDate : currentBackup.startDate),
        completed: updatedCompletedDays !== undefined ? Array.from(updatedCompletedDays) : (completedDays !== undefined ? Array.from(completedDays) : currentBackup.completed || []),
        customNotificationMessage: updatedNotiMsg !== undefined ? updatedNotiMsg : (notiMsg !== undefined ? notiMsg : currentBackup.customNotificationMessage),
        customNotificationTime: updatedNotiTime !== undefined ? updatedNotiTime : (notiTime !== undefined ? notiTime : currentBackup.customNotificationTime),
        customNotificationEnabled: updatedNotiEnabled !== undefined ? updatedNotiEnabled : (notiEnabled !== undefined ? notiEnabled : currentBackup.customNotificationEnabled),
        dailyGoals: updatedDailyGoals !== undefined ? updatedDailyGoals : (dailyGoals !== undefined ? dailyGoals : currentBackup.dailyGoals || []),
        aiMessages: updatedAiMessages !== undefined ? updatedAiMessages : (aiMessages !== undefined ? aiMessages : currentBackup.aiMessages || [])
      };
      
      localStorage.setItem('devsecops_backup_data', JSON.stringify(backupObj));
    } catch (e) {
      console.error('Failed to update local backup state:', e);
    }
  };

  const handleSendAIMessage = async (customText?: string) => {
    const textToSend = customText || aiInput;
    if (!textToSend.trim() || aiLoading) return;

    const queryMessage = { role: 'user' as const, content: textToSend };
    const newMessages = [...aiMessages, queryMessage];
    setAiMessages(newMessages);
    updateLocalBackup(undefined, undefined, undefined, undefined, undefined, undefined, newMessages);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await fetchWithAuth('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          dayTopic: todayTask?.title || "General DevOps and Cloud Engineering",
          dayNumber: todayTask?.day || 1,
          phase: currentPhase?.name || "Phase 1"
        })
      });

      if (!res.ok) throw new Error("Could not reach AI Assistant server proxy");
      const data = await res.json();
      
      const nextMessages = [...newMessages, { role: 'assistant' as const, content: data.text }];
      setAiMessages(nextMessages);
      updateLocalBackup(undefined, undefined, undefined, undefined, undefined, undefined, nextMessages);
    } catch (err: any) {
      console.error(err);
      const errorMessage = { 
        role: 'assistant' as const, 
        content: `❌ **Offline or connection lost**: Failed to retrieve response from AI Mentor.\n\n*Reason: ${err.message || "Network Error"}*` 
      };
      const nextMessages = [...newMessages, errorMessage];
      setAiMessages(nextMessages);
      updateLocalBackup(undefined, undefined, undefined, undefined, undefined, undefined, nextMessages);
    } finally {
      setAiLoading(false);
    }
  };

  const handleClearAIChat = () => {
    const cleared = [
      {
        role: 'assistant' as const,
        content: `👋 Welcome! I am your AI DevOps & DevSecOps Mentor. Ask me any question about today's roadmap, request a hands-on mini-lab, or trigger a self-evaluation quiz!`
      }
    ];
    setAiMessages(cleared);
    updateLocalBackup(undefined, undefined, undefined, undefined, undefined, undefined, cleared);
  };

  const generateResumeMarkdown = () => {
    const percent = Math.round((completedDays.size / 95) * 100);
    const completedCount = completedDays.size;

    // Dynamic completed tools array
    const tools: string[] = [];
    completedDays.forEach(dayIndex => {
      const task = ROADMAP_DAYS.find(d => d.day === dayIndex);
      if (task) {
        if (task.title.toLowerCase().includes('linux')) tools.push('Linux Terminal');
        if (task.title.toLowerCase().includes('git')) tools.push('Git & GitHub');
        if (task.title.toLowerCase().includes('docker')) tools.push('Docker Containers');
        if (task.title.toLowerCase().includes('nginx')) tools.push('Nginx Reverse Proxy');
        if (task.title.toLowerCase().includes('aws') || task.title.toLowerCase().includes('ec2') || task.title.toLowerCase().includes('s3')) tools.push('AWS Cloud');
        if (task.title.toLowerCase().includes('actions') || task.title.toLowerCase().includes('ci/cd')) tools.push('Automated CI/CD Pipelines');
        if (task.title.toLowerCase().includes('semgrep')) tools.push('Semgrep (SAST)');
        if (task.title.toLowerCase().includes('trivy')) tools.push('Trivy (Container Scanning)');
        if (task.title.toLowerCase().includes('snyk')) tools.push('Snyk (Vulnerability Management)');
        if (task.title.toLowerCase().includes('kubernetes') || task.title.toLowerCase().includes('k8s') || task.title.toLowerCase().includes('helm')) tools.push('Kubernetes & Helm');
        if (task.title.toLowerCase().includes('terraform')) tools.push('Terraform (IaC)');
        if (task.title.toLowerCase().includes('prometheus') || task.title.toLowerCase().includes('grafana') || task.title.toLowerCase().includes('monitoring')) tools.push('Prometheus & Grafana');
      }
    });

    const uniqueTools = Array.from(new Set(tools)).slice(0, 8);
    const toolsStr = uniqueTools.length > 0 
      ? `Acquired hands-on exposure to: ${uniqueTools.join(', ')}.` 
      : 'Acquired foundation level knowledge in DevSecOps & Cloud Engineering concepts.';

    return `🎯 **Portfolio Milestone: Completed ${percent}% of the 95-Day DevSecOps & AI/ML Curriculum!**

* **Progress:** ${completedCount} out of 95 Intensive Labs Finalized
* **Key Core Technologies:** ${toolsStr}
* **Pragmatic Skillset Added:** Developed continuous integration/delivery processes, configured shift-left container & dependency scanning (Trivy, Semgrep, Snyk), designed high-availability cloud setups on AWS, and managed Kubernetes workloads.

Ready to deploy secure, resilient architectures and automate elite pipeline workflows!

#DevSecOps #DevOps #CloudEngineering #ContinuousSecurity #AWS #Kubernetes`;
  };

  const startQuickQuiz = async (dayNum: number, dayTopic: string) => {
    setIsQuizModalOpen(true);
    setIsQuizLoading(true);
    setQuizQuestions([]);
    setQuizSelectedAnswers({});
    setQuizExplOpened({});
    setQuizError(null);

    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ dayNumber: dayNum, dayTopic: dayTopic })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error during generation (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('No valid quiz structures generated.');
      }

      setQuizQuestions(data.questions);
    } catch (err: any) {
      console.error(err);
      setQuizError(err.message || 'Connection timeout or offline. Please confirm API Key in Settings > Secrets.');
    } finally {
      setIsQuizLoading(false);
    }
  };

  // Submit credentials to backend auth router for signup/login validation
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername.trim() || !authPassword.trim() || authLoading) return;
    setAuthError(null);
    setAuthLoading(true);

    const isRegistration = isSignUp;
    const endpoint = isRegistration ? '/api/auth/signup' : '/api/auth/login';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername.trim(),
          password: authPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Populate authenticated credentials in local storage cache
      localStorage.setItem('devsecops_auth_token', data.token);
      localStorage.setItem('devsecops_username', data.user.username);
      setAuthToken(data.token);
      setUsername(data.user.username);
      setAuthUsername('');
      setAuthPassword('');
      setAuthError(null);
      
      // Trigger the gorgeous 6-second fullscreen welcome layout
      setShowWelcomeOverlay(true);
      
      // Fetch user progress and telemetry instantly for isolated profiles
      setTimeout(() => {
        fetchData();
      }, 50);
    } catch (err: any) {
      setAuthError(err.message || 'Verification / connection failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Automated Quick Play for Alice and Bob
  const handleQuickPlay = async (user: string, pass: string) => {
    if (authLoading) return;
    setAuthLoading(true);
    setAuthError(null);
    setAuthUsername(user);
    setAuthPassword(pass);
    try {
      let res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      let data = await res.json();
      if (!res.ok) {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, password: pass })
        });
        data = await res.json();
      }
      if (!res.ok) {
        throw new Error(data.error || 'Autoplay failed to establish credentials');
      }
      localStorage.setItem('devsecops_auth_token', data.token);
      localStorage.setItem('devsecops_username', data.user.username);
      setAuthToken(data.token);
      setUsername(data.user.username);
      setAuthUsername('');
      setAuthPassword('');
      setAuthError(null);
      setShowWelcomeOverlay(true);
      setTimeout(() => {
        fetchData();
      }, 50);
    } catch (err: any) {
      setAuthError(err.message || 'Auto-connection failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Welcome Screen timer orchestrator (6 seconds duration)
  useEffect(() => {
    if (!showWelcomeOverlay) return;

    setWelcomeProgress(0);
    setWelcomeStatus('Connecting to DevOps Sandbox Kernel...');

    const startTime = Date.now();
    const duration = 6000; // 6 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setWelcomeProgress(progress);

      if (progress < 18) {
        setWelcomeStatus('Establishing secure TLS firewall tunnel...');
      } else if (progress < 40) {
        setWelcomeStatus('Mounting virtual container environments...');
      } else if (progress < 65) {
        setWelcomeStatus('Synchronizing 95-day DevSecOps & AI telemetry state...');
      } else if (progress < 88) {
        setWelcomeStatus('Loading contextual AI study mentor packages...');
      } else {
        setWelcomeStatus('Authorized session verified. Directing to control panel...');
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(() => {
          setShowWelcomeOverlay(false);
        }, 200);
      }
    }, 50);

    // Blast celebratory confetti in the middle of our glorious screen
    const confettiTimer1 = setTimeout(() => {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 1800);

    const confettiTimer2 = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 3800);

    return () => {
      clearInterval(interval);
      clearTimeout(confettiTimer1);
      clearTimeout(confettiTimer2);
    };
  }, [showWelcomeOverlay]);

  // Fetch data and configure animated cinematic splash sequence on mount
  useEffect(() => {
    fetchData();

    // Start cinematic sequence
    const timer1 = setTimeout(() => setSplashStep(1), 700);
    const timer2 = setTimeout(() => setSplashStep(2), 1400);
    const timer3 = setTimeout(() => {
      setSplashStep(3);
      setTimeout(() => {
        setShowSplash(false);
      }, 700);
    }, 2100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const fetchData = async () => {
    if (!localStorage.getItem('devsecops_auth_token')) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setApiError(null);
    
    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    
    while (attempts < maxAttempts && !success) {
      try {
        // 1. Fetch progress
        const progressRes = await fetchWithAuth('/api/progress');
        if (!progressRes.ok) throw new Error('Failed to fetch progress telemetry');
        let progressData = await progressRes.json();

        // Dynamic restore / sync-backup from client localStorage if the server was restarted
        const backupStr = localStorage.getItem('devsecops_backup_data');
        if (backupStr && !progressData.startDate && (!progressData.completed || progressData.completed.length === 0)) {
          try {
            const backupObj = JSON.parse(backupStr);
            console.log('[LOCAL STORAGE RESTORE]: Restoring session state to server...', backupObj);
            const syncRes = await fetchWithAuth('/api/sync-backup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(backupObj)
            });
            if (syncRes.ok) {
              const updatedProgressRes = await fetchWithAuth('/api/progress');
              if (updatedProgressRes.ok) {
                progressData = await updatedProgressRes.json();
              }
            }
          } catch (err) {
            console.error('[LOCAL STORAGE RESTORE ERROR]: Failed to sync backup to backend:', err);
          }
        }

        // Save a fresh backup copy locally whenever we load non-empty progress
        if (progressData.startDate || (progressData.completed && progressData.completed.length > 0)) {
          const backupObj = {
            startDate: progressData.startDate,
            completed: progressData.completed || [],
            customNotificationMessage: progressData.customNotificationMessage,
            customNotificationTime: progressData.customNotificationTime,
            customNotificationEnabled: progressData.customNotificationEnabled,
            dailyGoals: progressData.dailyGoals || [],
            aiMessages: progressData.aiMessages || []
          };
          localStorage.setItem('devsecops_backup_data', JSON.stringify(backupObj));
        }
        
        setCompletedDays(new Set(progressData.completed || []));
        setStartDate(progressData.startDate);
        if (progressData.startDate) {
          setSetupDateInput(progressData.startDate);
        } else {
          // Default seed to today's local date string YYYY-MM-DD
          const todayStr = new Date().toISOString().split('T')[0];
          setSetupDateInput(todayStr);
        }

        setNotiMsg(progressData.customNotificationMessage || "Time to master DevSecOps + AI/ML! Let's complete today's task!");
        setNotiTime(progressData.customNotificationTime || "09:00");
        setNotiEnabled(progressData.customNotificationEnabled || false);

        if (progressData.aiMessages && progressData.aiMessages.length > 0) {
          setAiMessages(progressData.aiMessages);
        }

        setDailyGoals(progressData.dailyGoals || []);

        // 2. Fetch notification records
        const notifRes = await fetchWithAuth('/api/notifications');
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotification({
            missedCount: notifData.missedCount,
            statusMessage: notifData.statusMessage,
          });
        }
        success = true;
      } catch (err: any) {
        attempts++;
        console.warn(`Fetch attempt ${attempts} failed:`, err);
        if (attempts >= maxAttempts) {
          console.error('Final fetch error:', err);
          setApiError(err.message || 'Error syncing with the Express API service. Please verify the backend status or reload the page.');
        } else {
          // Delay before next attempt
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      }
    }
    setLoading(false);
  };

  // Trigger a full 5-second beautiful confetti celebration
  const triggerCelebration = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Confetti shoots from left and right side towards the center
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  // Trigger a localized smaller confetti burst inside the sidebar for phase completion
  const triggerPhaseCelebration = (phaseId: number) => {
    const el = document.getElementById(`sidebar-phase-tracker-${phaseId}`);
    let originX = 0.85; // Fallback to right side sidebar default
    let originY = 0.35; // Fallback

    if (el) {
      const rect = el.getBoundingClientRect();
      originX = (rect.left + rect.width / 2) / window.innerWidth;
      originY = (rect.top + rect.height / 2) / window.innerHeight;
    }

    // Small, localized colorful splash
    const count = 35;
    const defaults = {
      origin: { x: originX, y: originY },
      spread: 60,
      ticks: 80,
      gravity: 1.1,
      scalar: 0.75,
      zIndex: 2000
    };

    confetti({
      ...defaults,
      particleCount: Math.floor(count * 0.6),
      angle: 70,
      startVelocity: 20,
    });
    confetti({
      ...defaults,
      particleCount: Math.floor(count * 0.4),
      angle: 110,
      startVelocity: 20,
    });
  };

  // Toggle day completion state
  const handleToggleDay = async (dayNumber: number) => {
    try {
      const res = await fetchWithAuth('/api/progress/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId: dayNumber })
      });
      if (!res.ok) throw new Error('Failed to toggle progress state');
      const data = await res.json();

      setCompletedDays(prev => {
        const next = new Set(prev);
        if (data.completed) {
          next.add(dayNumber);
          
          // Check if containing phase has reached 100% completion
          const phase = PHASES.find(p => dayNumber >= p.startDay && dayNumber <= p.endDay);
          if (phase) {
            let completedCount = 0;
            const totalCount = (phase.endDay - phase.startDay) + 1;
            for (let day = phase.startDay; day <= phase.endDay; day++) {
              if (next.has(day)) completedCount++;
            }
            
            // It MUST transition from not 100% to 100%
            let wasPhaseCompleted = true;
            for (let day = phase.startDay; day <= phase.endDay; day++) {
              if (!prev.has(day) && day !== dayNumber) {
                wasPhaseCompleted = false;
                break;
              }
            }
            if (!wasPhaseCompleted && completedCount === totalCount) {
              // Defer slightly to let UI state update and render, or trigger immediately
              setTimeout(() => {
                triggerPhaseCelebration(phase.id);
              }, 150);
            }
          }

          // Trigger confetti if they complete the 95th day or achieve total 95/95 completion!
          if (dayNumber === 95 || next.size === 95) {
            triggerCelebration();
          }
        } else {
          next.delete(dayNumber);
        }
        updateLocalBackup(next);
        return next;
      });

      // Fetch fresh notifications instantly to update the alert banner in sync
      const notifRes = await fetchWithAuth('/api/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotification({
          missedCount: notifData.missedCount,
          statusMessage: notifData.statusMessage,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update day task progress');
    }
  };

  // Save custom daily alerts preferenced parameters
  const handleSaveCustomNotification = async (customMsg = notiMsg, customTime = notiTime, customEnabled = notiEnabled) => {
    try {
      const res = await fetchWithAuth('/api/custom-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: customMsg,
          time: customTime,
          enabled: customEnabled
        })
      });
      if (!res.ok) throw new Error('Failed to update custom notification settings');
      const data = await res.json();
      setNotiMsg(data.message);
      setNotiTime(data.time);
      setNotiEnabled(data.enabled);
      updateLocalBackup(undefined, undefined, data.message, data.time, data.enabled);

      setNotiUIMessage({
        text: `Success: Alerts configured for ${data.time}!`,
        type: 'success'
      });
      setTimeout(() => setNotiUIMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to save daily alerts preference');
    }
  };

  // Play synthetic alert chime + slide toast banner
  const triggerTestNotification = () => {
    setNotiUIMessage({
      text: notiMsg || "⏰ Study Reminder: Time to crush your daily learning goals!",
      type: 'reminder'
    });

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5 note

      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Synthesizer bypassed due to safety/permissions limits", e);
    }
  };

  // Recharts color mapper & dataset bundler
  const phaseColors = ['#2F81F7', '#58A6FF', '#D29922', '#238636', '#F85149'];

  const getPhaseChartData = () => {
    const isAnyCompleted = completedDays.size > 0;
    return PHASES.map((p, idx) => {
      let completed = 0;
      for (let day = p.startDay; day <= p.endDay; day++) {
        if (completedDays.has(day)) {
          completed++;
        }
      }
      const totalDays = (p.endDay - p.startDay) + 1;
      return {
        name: p.name.replace(/^Phase\s\d+:\s*/, ""),
        value: isAnyCompleted ? completed : totalDays,
        actualCompleted: completed,
        totalDays,
        color: phaseColors[idx % phaseColors.length]
      };
    });
  };

  const chartData = getPhaseChartData();
  const totalCompletedInChart = completedDays.size;

  // Daily goals database persistence & mutation handlers
  const handleSaveDailyGoals = async (updatedGoals: DailyGoal[]) => {
    try {
      await fetchWithAuth('/api/daily-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: updatedGoals })
      });
      updateLocalBackup(undefined, undefined, undefined, undefined, undefined, updatedGoals);
    } catch (err) {
      console.error('Failed to sync daily goals with DB:', err);
    }
  };

  const handleAddDailyGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    const newGoal: DailyGoal = {
      id: 'goal_' + Date.now().toString(36),
      text: newGoalText.trim(),
      completed: false
    };

    const nextGoals = [...dailyGoals, newGoal];
    setDailyGoals(nextGoals);
    setNewGoalText('');
    await handleSaveDailyGoals(nextGoals);
  };

  const handleToggleDailyGoal = async (goalId: string) => {
    const nextGoals = dailyGoals.map(g => 
      g.id === goalId ? { ...g, completed: !g.completed } : g
    );
    setDailyGoals(nextGoals);
    await handleSaveDailyGoals(nextGoals);
  };

  const handleDeleteDailyGoal = async (goalId: string) => {
    const nextGoals = dailyGoals.filter(g => g.id !== goalId);
    setDailyGoals(nextGoals);
    await handleSaveDailyGoals(nextGoals);
  };

  // Set roadmap start date
  const handleSaveStartDate = async () => {
    if (!setupDateInput) return;
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/start-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: setupDateInput })
      });
      if (!res.ok) throw new Error('Failed to update start date setting');
      const data = await res.json();

      setStartDate(setupDateInput);
      updateLocalBackup(undefined, setupDateInput);
      setNotification({
        missedCount: data.missedCount,
        statusMessage: data.statusMessage,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to save start date');
    } finally {
      setLoading(false);
    }
  };

  // Clear all progress completions
  const handleReset = async () => {
    if (!window.confirm('Are you absolutely sure you want to clear all your progress completions? This keeps your start date but resets all checked task boxes.')) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to complete database reset');
      const data = await res.json();

      setCompletedDays(new Set());
      const clearedChat = data.aiMessages || [
        {
          role: 'assistant' as const,
          content: "👋 Welcome! I am your AI DevOps & DevSecOps Mentor. Ask me any question about today's roadmap, request a hands-on mini-lab, or trigger a self-evaluation quiz!"
        }
      ];
      setAiMessages(clearedChat);
      updateLocalBackup(new Set(), undefined, undefined, undefined, undefined, undefined, clearedChat);
      setNotification({
        missedCount: data.missedCount,
        statusMessage: data.statusMessage,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to complete reset');
    } finally {
      setLoading(false);
    }
  };

  // Helper date calculation
  const getDaysPassed = () => {
    if (!startDate) return null;
    const parts = startDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const today = new Date();
    
    // Normalize dates to local midnight for standard calendars
    const startLocal = new Date(year, month, day);
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffTime = todayLocal.getTime() - startLocal.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysPassed = getDaysPassed();
  const currentDayNum = daysPassed !== null ? daysPassed + 1 : null;

  // Streak calculation (Duolingo style)
  const getStreakCount = () => {
    if (!startDate || currentDayNum === null || currentDayNum < 1) return 0;
    
    let streak = 0;
    let checkDay = currentDayNum;

    const isTodayCompleted = completedDays.has(currentDayNum);
    const isYesterdayCompleted = currentDayNum > 1 && completedDays.has(currentDayNum - 1);

    // If neither today nor yesterday is completed, streak has lapsed
    if (!isTodayCompleted && !isYesterdayCompleted) {
      return 0;
    }

    // If today is completed, look back from today. If not, trace starting from yesterday.
    if (!isTodayCompleted) {
      checkDay = currentDayNum - 1;
    }

    while (checkDay >= 1) {
      if (completedDays.has(checkDay)) {
        streak++;
        checkDay--;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = getStreakCount();

  // Find today's active study task
  const todayTask: DayTask | null = (() => {
    if (currentDayNum === null || currentDayNum < 1 || currentDayNum > 95) return null;
    return ROADMAP_DAYS.find(d => d.day === currentDayNum) || null;
  })();

  // Current Active Phase name
  const currentPhase: Phase | null = (() => {
    if (currentDayNum === null || currentDayNum < 1) return null;
    return PHASES.find(p => currentDayNum >= p.startDay && currentDayNum <= p.endDay) || PHASES[PHASES.length - 1];
  })();

  // Main Counts
  const completedCount = completedDays.size;
  const missedCount = (() => {
    if (currentDayNum === null || currentDayNum < 1) return 0;
    let count = 0;
    const maxChecked = Math.min(95, currentDayNum - 1);
    for (let i = 1; i <= maxChecked; i++) {
      if (!completedDays.has(i)) {
        count++;
      }
    }
    return count;
  })();
  const remainingCount = 95 - completedCount;
  const progressPercent = Math.round((completedCount / 95) * 100);

  // Dynamically resolved notification data completely synchronized with client timezone & completions
  const resolvedNotification = (() => {
    if (!startDate) {
      return {
        missedCount: 0,
        statusMessage: 'Roadmap has not started yet. Please set a start date in the setup panel!'
      };
    }
    if (currentDayNum !== null && currentDayNum < 1) {
      return {
        missedCount: 0,
        statusMessage: `Roadmap starting on ${startDate}. Prepare your resources!`
      };
    }
    
    let statusMessage = '';
    if (missedCount === 0) {
      if (currentDayNum !== null && currentDayNum > 95) {
        statusMessage = "Congratulations! You have completed all 95 days of your DevSecOps + AI/ML learning journey!";
      } else {
        statusMessage = "Awesome! You are perfectly on track! You haven't missed any days.";
      }
    } else {
      statusMessage = `You missed ${missedCount} task${missedCount > 1 ? 's' : ''} since starting on ${startDate}. Head over to 'Missed' tab to recover!`;
    }
    return {
      missedCount,
      statusMessage
    };
  })();

  // Tabbed Lists Filter
  const tabTasks = (() => {
    switch (activeTab) {
      case 'missed':
        if (currentDayNum === null) return [];
        return ROADMAP_DAYS.filter(d => d.day < currentDayNum && !completedDays.has(d.day));
      case 'next7':
        if (currentDayNum === null) return ROADMAP_DAYS.slice(0, 7);
        const lowerLimit = currentDayNum;
        const upperLimit = currentDayNum + 6;
        return ROADMAP_DAYS.filter(d => d.day >= lowerLimit && d.day <= upperLimit && !completedDays.has(d.day));
      case 'all':
      default:
        return ROADMAP_DAYS;
    }
  })();

  const searchedTasks = tabTasks.filter(task => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = task.title?.toLowerCase().includes(query) || false;
    const tagsMatch = task.tags?.some(t => t.toLowerCase().includes(query)) || false;
    return titleMatch || tagsMatch;
  });

  // Phase Progress Statistics for Sidebar
  const calculatePhaseStats = (phase: Phase) => {
    let completed = 0;
    const total = (phase.endDay - phase.startDay) + 1;
    for (let day = phase.startDay; day <= phase.endDay; day++) {
      if (completedDays.has(day)) completed++;
    }
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent };
  };

  // Certification unlock helpers
  const getCertStatus = (phase: Phase, phaseIndex: number) => {
    const stats = calculatePhaseStats(phase);
    if (stats.percent === 100) return 'earned';

    if (phaseIndex === 0) return 'in_progress';

    // Unlocked if previous phase is completely finished
    const previousPhase = PHASES[phaseIndex - 1];
    const prevStats = calculatePhaseStats(previousPhase);
    if (prevStats.percent === 100) return 'in_progress';

    return 'locked';
  };

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case 'devops':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-900';
      case 'security':
        return 'bg-rose-950/40 text-rose-400 border-rose-900';
      case 'aiml':
        return 'bg-violet-950/40 text-violet-400 border-violet-900';
      case 'cert':
        return 'bg-amber-950/40 text-amber-400 border-amber-900';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-850';
    }
  };

  if (loading && completedDays.size === 0 && !showSplash) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-6 text-[#E6EDF3]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#2F81F7] border-t-transparent rounded-full animate-spin mx-auto mb-4" id="spinner"></div>
          <p className="text-base font-semibold tracking-tight">Syncing Roadmap Curriculum...</p>
          <p className="text-xs text-[#8B949E] mt-1.5 font-mono">Secure State Sandbox</p>
        </div>
      </div>
    );
  }

  if (showWelcomeOverlay) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex flex-col items-center justify-center p-6 text-[#E6EDF3] relative overflow-hidden" id="welcome-splash-screen">
        {/* Animated grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* Ambient neon radial glows */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#2F81F7]/20 to-blue-500/0 rounded-full blur-[120px] pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#238636]/15 to-emerald-500/0 rounded-full blur-[120px] pointer-events-none"
        />

        <div className="w-full max-w-lg flex flex-col items-center relative z-10 text-center">
          {/* Lock/Unlock Icon Transition */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1, 1.1, 1], opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 relative flex items-center justify-center w-24 h-24"
          >
            <div className="absolute inset-0 bg-[#2F81F7]/10 rounded-full border border-[#2F81F7]/25 animate-pulse" />
            <div className="absolute inset-2 border border-[#2F81F7]/40 rounded-full animate-spin [animation-duration:8s]" />
            <div className="absolute w-14 h-14 bg-gradient-to-tr from-[#2F81F7] to-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(47,129,247,0.4)]">
              <Unlock size={24} className="text-white animate-pulse" />
            </div>
          </motion.div>

          {/* Large Elegant Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Welcome, <span className="bg-gradient-to-r from-[#58a6ff] to-[#39d353] bg-clip-text text-transparent">{username || 'Cadet'}</span>!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-xs font-mono tracking-widest text-[#8B949E] uppercase mb-8"
          >
            SECURE LEARNING COMPANION IS ONLINE
          </motion.p>

          {/* Loader circle or progressive bar */}
          <div className="w-full max-w-xs bg-[#161B22] border border-[#30363D] p-5 rounded-2xl shadow-xl mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#8B949E] font-mono">CONNECTION ESTABLISHED</span>
              <span className="text-xs font-bold text-[#2F81F7] font-mono">{Math.round(welcomeProgress)}%</span>
            </div>
            {/* Base line tracker */}
            <div className="w-full bg-[#30363D] h-2 rounded-full overflow-hidden mb-4 relative font-sans">
              <div
                className="bg-gradient-to-r from-[#2F81F7] via-cyan-500 to-[#238636] h-full rounded-full transition-all duration-75"
                style={{ width: `${welcomeProgress}%` }}
              />
            </div>
            
            {/* Changing system logs */}
            <div className="h-6 flex items-center justify-center">
              <motion.span
                key={welcomeStatus}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="text-xs font-semibold text-[#8B949E] font-mono tracking-tight text-center block"
              >
                &gt; {welcomeStatus}
              </motion.span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1 }}
            className="text-[10px] text-[#8B949E] font-mono tracking-wider"
          >
            SECURE SHELL SANDBOX IP: 127.0.0.1 // DEVSECOPS ROADMAP v2.0
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E6EDF3] flex flex-col font-sans selection:bg-[#2F81F7]/30 selection:text-white relative">
      
      {/* 1. CINEMATIC ENTRY OVERLAY */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#0A0C10] transition-all duration-700 ease-out ${
          showSplash ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        id="cinematic-splash"
      >
        <div className="relative mb-8 flex items-center justify-center w-24 h-24">
          <div className="absolute inset-0 border border-[#2F81F7]/30 rounded-full animate-ping [animation-duration:2s]" />
          <div className="absolute w-16 h-16 border border-[#2F81F7]/60 rounded-full animate-pulse" />
          <div className="absolute w-10 h-10 bg-gradient-to-tr from-[#2F81F7] to-[#1F6FEB] rounded-full shadow-[0_0_20px_rgba(47,129,247,0.5)] flex items-center justify-center">
            <Bot size={20} className="text-white animate-bounce" />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="font-mono text-xs tracking-wider text-[#8B949E] min-h-[24px]">
            {splashStep === 0 && (
              <span className="text-[#2F81F7] animate-pulse">
                [CONNECTING TO CLOUD DB...]
              </span>
            )}
            {splashStep === 1 && (
              <span className="text-amber-500 animate-pulse">
                [AUTHENTICATING FIREWALLS...]
              </span>
            )}
            {splashStep === 2 && (
              <span className="text-green-500 animate-pulse">
                [LAUNCHING DEVSECOPS COMPANION...]
              </span>
            )}
            {splashStep === 3 && (
              <span className="text-green-400 font-bold">
                [ACCESS GRANTED]
              </span>
            )}
          </div>
          <div className="mt-4 text-[10px] text-[#30363D] uppercase tracking-widest font-mono">
            Secure Platform Sandbox v2.0
          </div>
        </div>
      </div>

      {/* 2. SECURITY AUTHENTICATION INTERFACE */}
      {!authToken && !showSplash ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-[#0A0C10]" id="auth-view-screen">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="w-full max-w-md bg-[#161B22] border border-[#30363D] rounded-2xl p-8 shadow-2xl relative overflow-hidden"
            id="auth-panel"
          >
            {/* Ambient glows */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-24 -left-24 w-48 h-48 bg-[#2F81F7]/10 rounded-full blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#238636]/10 rounded-full blur-3xl pointer-events-none"
            />

            <div className="flex flex-col items-center mb-8 relative">
              <motion.span
                initial={{ rotate: -15, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="p-3 bg-[#2F81F7]/10 text-[#2F81F7] rounded-full border border-[#2F81F7]/25 mb-4 relative"
              >
                <div className="absolute inset-0 bg-[#2F81F7]/10 rounded-full animate-ping [animation-duration:2s]" />
                <Lock size={22} className="relative z-10 text-[#2F81F7]" />
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-xl font-bold text-white tracking-tight"
                id="auth-title"
              >
                {isSignUp ? 'Create Student Profile' : 'Sign In to Campus Core'}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xs text-[#8B949E] mt-1.5 font-mono text-center"
              >
                {isSignUp ? 'Enroll in the 95-Day Curriculum Sandbox' : 'Resume your DevSecOps & AI pipeline roadmap'}
              </motion.p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-5 relative" id="auth-form">
              {authError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-[#F85149]/10 border border-[#F85149]/30 rounded-lg text-xs text-[#FF7B72] flex items-center gap-2"
                  id="auth-error-banner"
                >
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{authError}</span>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2 font-mono">
                  Student Username
                </label>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-[#0A0C10] border border-[#30363D] text-[#E6EDF3] py-2.5 px-4 rounded-xl text-xs placeholder-[#484F58] focus:outline-none focus:ring-1 focus:ring-[#2F81F7] focus:border-[#2F81F7] focus:shadow-[0_0_15px_rgba(47,129,247,0.15)] transition-all duration-300"
                  id="auth-input-username"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2 font-mono">
                  Personal Passcode
                </label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0A0C10] border border-[#30363D] text-[#E6EDF3] py-2.5 px-4 rounded-xl text-xs placeholder-[#484F58] focus:outline-none focus:ring-1 focus:ring-[#2F81F7] focus:border-[#2F81F7] focus:shadow-[0_0_15px_rgba(47,129,247,0.15)] transition-all duration-300"
                  id="auth-input-password"
                />
              </motion.div>

              <motion.button
                type="submit"
                disabled={authLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#2F81F7] hover:bg-[#1F6FEB] text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md shadow-blue-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="auth-submit-btn"
              >
                {authLoading ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? 'Register & Initialize' : 'Establish Connection'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-8 pt-6 border-t border-[#30363D]/40 text-center relative"
            >
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="text-xs text-[#8B949E] hover:text-[#2F81F7] transition underline cursor-pointer font-medium"
                id="auth-toggle-btn"
              >
                {isSignUp ? 'Already registered? Sign in instead' : "Don't have an account? Sign up now"}
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-center"
            >
              <span className="text-[10px] text-[#484F58] uppercase font-mono tracking-wider block mb-2">Sandbox Quick Play</span>
              <div className="flex justify-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleQuickPlay('Student_Alpha', 'pass123')}
                  className="bg-[#30363D]/30 hover:bg-[#30363D]/60 hover:text-white hover:border-[#2F81F7]/50 text-[#8B949E] text-[10px] font-mono py-1.5 px-3 rounded-lg border border-[#30363D]/40 transition cursor-pointer"
                >
                  Alice
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleQuickPlay('Student_Beta', 'secure456')}
                  className="bg-[#30363D]/30 hover:bg-[#30363D]/60 hover:text-white hover:border-emerald-500/50 text-[#8B949E] text-[10px] font-mono py-1.5 px-3 rounded-lg border border-[#30363D]/40 transition cursor-pointer"
                >
                  Bob
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Floating Custom Notification Toast */}
          {notiUIMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#161B22] border border-[#2F81F7] p-4 rounded-xl shadow-2xl flex items-start gap-3 transition-all"
          id="custom-toast-notification"
        >
          <div className="p-1.5 bg-[#2F81F7]/10 text-[#2F81F7] rounded mr-1 shrink-0 mt-0.5 animate-pulse">
            <Clock size={16} />
          </div>
          <div className="flex-1">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Daily Study Alert</h5>
            <p className="text-xs text-[#E6EDF3] leading-relaxed">{notiUIMessage.text}</p>
          </div>
          <button
            onClick={() => setNotiUIMessage(null)}
            className="text-[#8B949E] hover:text-white ml-2 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 💬 FLOAT DEVSECOPS AI MENTOR WIDGET */}
      {!aiChatOpen ? (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAiChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-[#2F81F7] to-[#1F6FEB] text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all group font-semibold text-xs border border-white/10 cursor-pointer animate-duration-1000"
          id="trigger-ai-assistant-btn"
        >
          <Sparkles size={16} className="text-amber-300 animate-pulse" />
          <span>AI DevOps Mentor</span>
          <span className="w-2 h-2 rounded-full bg-green-400" />
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="fixed bottom-6 right-6 z-50 w-[92vw] max-w-md h-[550px] bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          id="ai-assistant-window"
        >
          {/* Header Panel */}
          <div className="bg-[#1C2128] border-b border-[#30363D] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#2F81F7]/10 text-[#2F81F7] rounded-lg">
                <Bot size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-white tracking-wide uppercase">DevOps AI Mentor</h4>
                <p className="text-[10px] text-[#8B949E] font-medium font-mono">
                  {todayTask ? `Context: Day ${todayTask.day} Study` : "General Study Guide"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearAIChat}
                title="Clear Chat History"
                className="p-1.5 hover:bg-[#30363D]/60 rounded-md text-[#8B949E] hover:text-red-400 transition cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => setAiChatOpen(false)}
                className="p-1.5 hover:bg-[#30363D]/60 rounded-md text-[#8B949E] hover:text-white transition cursor-pointer text-xs font-bold font-mono"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Console Box */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" id="ai-chat-messages-container">
            {aiMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse shadow' : 'self-start'}`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 text-xs ${
                    msg.role === 'user' ? 'bg-[#2F81F7]/10 text-[#2F81F7]' : 'bg-[#1C2128] text-amber-300'
                  }`}
                >
                  {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                </div>

                <div
                  className={`py-2 px-3.5 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#2F81F7]/15 border border-[#2F81F7]/30 text-white rounded-tr-none'
                      : 'bg-[#0A0C10]/40 border border-[#30363D] text-[#E6EDF3] rounded-tl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="markdown-body">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {aiLoading && (
              <div className="self-start flex gap-2.5 max-w-[85%]">
                <div className="p-2 rounded-lg text-xs bg-[#1C2128] text-amber-300 shrink-0">
                  <Bot size={13} />
                </div>
                <div className="py-2.5 px-4 bg-[#0A0C10]/40 border border-[#30363D] rounded-xl rounded-tl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#8B949E] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-[#8B949E] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-[#8B949E] rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Prompt Chips Suggestions Row */}
          {todayTask && (
            <div className="scroll-container px-3.5 py-2 border-t border-[#30363D]/45 bg-[#0A0C10]/20 flex gap-1.5 overflow-x-auto whitespace-nowrap shrink-0" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => handleSendAIMessage(`📖 Explain key concepts and give practical context tips for: "${todayTask.title}"`)}
                disabled={aiLoading}
                className="text-[10px] font-bold bg-[#1C2128] hover:bg-[#30363D] border border-[#30363D] hover:border-[#8B949E] text-white py-1 px-2.5 rounded-full transition cursor-pointer disabled:opacity-50 inline-block"
              >
                📖 Concept Depth
              </button>
              <button
                onClick={() => handleSendAIMessage(`🛠️ Create a step-by-step hands-on terminal exercise / mini-lab that demonstrates today's topic with real commands for: "${todayTask.title}"`)}
                disabled={aiLoading}
                className="text-[10px] font-bold bg-[#2F81F7]/10 hover:bg-[#2F81F7]/25 border border-[#2F81F7]/20 hover:border-[#2F81F7]/50 text-[#58a6ff] py-1 px-2.5 rounded-full transition cursor-pointer disabled:opacity-50 inline-block"
              >
                🛠️ Practice Lab
              </button>
              <button
                onClick={() => handleSendAIMessage(`📝 Give me a 3-question multiple-choice quiz about today's topic: "${todayTask.title}". Show explanations at the end.`)}
                disabled={aiLoading}
                className="text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/50 text-[#d29922] py-1 px-2.5 rounded-full transition cursor-pointer disabled:opacity-50 inline-block"
              >
                📝 Knowledge Quiz
              </button>
            </div>
          )}

          {/* TextInput Submission Row */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAIMessage();
            }}
            className="p-3 border-t border-[#30363D] bg-[#1C2128] flex gap-2.5 shrink-0"
          >
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder={todayTask ? "Ask about Linux permissions, Docker, CI/CD..." : "Enter your DevOps query here..."}
              disabled={aiLoading}
              className="flex-1 bg-[#0A0C10] text-xs text-[#E6EDF3] border border-[#30363D] rounded-xl py-2 px-3.5 focus:outline-none focus:border-[#2F81F7] disabled:opacity-75"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiInput.trim()}
              className="px-3 bg-[#2F81F7] hover:bg-[#1F6FEB] text-white rounded-xl transition flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:bg-[#30363D]"
            >
              <Send size={13} />
            </button>
          </form>
        </motion.div>
      )}
      {apiError && (
        <div className="bg-[#F85149] text-white p-3.5 text-center text-xs font-bold flex items-center justify-center gap-2" id="api-error-banner">
          <AlertTriangle size={16} />
          <span>Error parsing live server metrics: {apiError}. Check backend logs.</span>
          <button onClick={fetchData} className="ml-4 underline hover:text-[#E6EDF3]/80 transition">Retry Sync</button>
        </div>
      )}

      {/* TOP HEADER CONTAINER BAR */}
      <header className="border-b border-[#30363D] bg-[#161B22] py-4.5 px-6 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-1 bg-[#2F81F7] text-white rounded">
                <Layers size={16} />
              </span>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-[#E6EDF3]" id="app-title">
                DevSecOps + AI/ML Learning Roadmap
              </h1>
            </div>
            <p className="text-[11px] text-[#8B949E] mt-1 flex items-center gap-1.5 font-mono">
              <Calendar size={13} />
              <span>Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              {startDate && (
                <>
                  <span className="text-[#30363D]">•</span>
                  <span>Started: {startDate}</span>
                </>
              )}
            </p>
          </div>

          {/* DYNAMIC HEADER CHIPS */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dark/Light Mode Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`flex items-center gap-1.5 py-1 px-3.5 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                theme === 'dark'
                  ? 'bg-[#161B22] border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#8B949E]'
                  : 'bg-white border-[#D0D7DE] text-[#57606A] hover:text-gray-950 hover:border-gray-400 shadow-sm'
              }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              id="header-theme-toggle-btn"
            >
              {theme === 'dark' ? (
                <>
                  <Moon size={13} className="text-[#8B949E]" />
                  <span>Dark Theme</span>
                </>
              ) : (
                <>
                  <Sun size={13} className="text-[#D29922]" />
                  <span>Light Theme</span>
                </>
              )}
            </motion.button>

            {/* Student Account Badge */}
            {username && (
              <div className="flex items-center gap-1.5 bg-[#238636]/10 text-[#54A25F] border border-[#238636]/20 py-1 px-3 rounded-full text-xs font-semibold" id="authenticated-user-badge">
                <User size={13} className="text-[#54A25F]" />
                <span className="max-w-[100px] truncate">{username}</span>
                <span className="text-[#30363D]">•</span>
                <button 
                  onClick={() => {
                    localStorage.removeItem('devsecops_auth_token');
                    localStorage.removeItem('devsecops_username');
                    setAuthToken(null);
                    setUsername(null);
                  }}
                  className="text-[#F85149] hover:text-[#FF7B72] transition underline cursor-pointer text-[10px]"
                  id="logout-btn"
                >
                  Sign Out
                </button>
              </div>
            )}

            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 bg-[#161B22] border border-[#30363D] py-1 px-3 rounded-full text-[#D29922] text-xs font-semibold" id="streak-badge">
              <Flame size={14} className={`fill-current ${currentStreak > 0 ? 'text-[#D29922] animate-bounce' : 'text-[#8B949E]'}`} />
              <span>{currentStreak} Day Streak</span>
            </div>

            {/* Active Class Badge (Badge Primary) */}
            <div className="bg-[#2F81F7]/15 text-[#2F81F7] border border-[#2F81F7] text-[11px] font-bold py-1 px-3 rounded-full uppercase tracking-wider" id="tracker-day-badge">
              {currentDayNum === null ? (
                <span>Setup Start Date</span>
              ) : currentDayNum < 1 ? (
                <span>Not Started Yet</span>
              ) : currentDayNum > 95 ? (
                <span>Curriculum Completed</span>
              ) : (
                <span>Day {currentDayNum} of 95</span>
              )}
            </div>

            {/* Phase Target Indicator */}
            {currentPhase && (
              <div className="bg-[#161B22] border border-[#30363D] py-1 px-3 rounded-full text-xs font-semibold text-[#8B949E]" id="current-phase-badge">
                🎯 {currentPhase.name.split(':')[0]}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* SYSTEM NOTIFICATION BANNER */}
      {notification && (
        <div className="bg-[#D29922]/10 border-b border-[#D29922]/20 py-2.5 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#D29922] font-semibold">
              <Info size={15} className="shrink-0" />
              <span id="notification-message">{resolvedNotification.statusMessage}</span>
            </div>
            {resolvedNotification.missedCount > 0 && activeTab !== 'missed' && (
              <button
                onClick={() => setActiveTab('missed')}
                className="bg-[#2F81F7] hover:bg-[#2F81F7]/80 text-white font-bold py-0.5 px-2.5 rounded text-[11px] transition whitespace-nowrap shrink-0 flex items-center gap-1"
                id="jump-missed-btn"
              >
                <span>Recover</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* DASHBOARD CONTENT BODY */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 flex-1 flex flex-col gap-6">
        
        {/* STATS ROW COMPONENT - GEOMETRIC CARD STYLE */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-row">
          {/* Card 1: Completed task tracker */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex items-center gap-3.5 transition hover:border-[#2F81F7]"
            id="stat-completed"
          >
            <div className="p-2.5 bg-[#238636]/10 border border-[#238636]/30 rounded-lg text-[#238636]">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="text-[10px] text-[#8B949E] font-bold uppercase tracking-wider block">Completed</span>
              <span className="text-lg md:text-xl font-bold text-white">{completedCount} <span className="text-xs text-[#8B949E] font-medium">/ 95</span></span>
            </div>
          </motion.div>

          {/* Card 2: Missed task count */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
            className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex items-center gap-3.5 transition hover:border-[#F85149]"
            id="stat-missed"
          >
            <div className="p-2.5 bg-[#F85149]/10 border border-[#F85149]/30 rounded-lg text-[#F85149]">
              <XCircle size={20} />
            </div>
            <div>
              <span className="text-[10px] text-[#8B949E] font-bold uppercase tracking-wider block">Missed Tasks</span>
              <span className="text-lg md:text-xl font-bold text-white">{missedCount} <span className="text-xs text-[#8B949E] font-medium">unresolved</span></span>
            </div>
          </motion.div>

          {/* Card 3: Days left countdown */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex items-center gap-3.5 transition hover:border-[#2F81F7]"
            id="stat-remaining"
          >
            <div className="p-2.5 bg-[#2F81F7]/10 border border-[#2F81F7]/30 rounded-lg text-[#2F81F7]">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[10px] text-[#8B949E] font-bold uppercase tracking-wider block">Remaining</span>
              <span className="text-lg md:text-xl font-bold text-white">{remainingCount} <span className="text-xs text-[#8B949E] font-medium">days</span></span>
            </div>
          </motion.div>

          {/* Card 4: Overall milestone ratio */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
            className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex items-center gap-3.5 transition hover:border-[#D29922]"
            id="stat-percentage"
          >
            <div className="p-2.5 bg-[#D29922]/10 border border-[#D29922]/30 rounded-lg text-[#D29922]">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] text-[#8B949E] font-bold uppercase tracking-wider block">Overall Ratio</span>
              <span className="text-lg md:text-xl font-bold text-white">{progressPercent}% <span className="text-xs text-[#8B949E] font-medium">finished</span></span>
            </div>
          </motion.div>
        </section>

        {/* OVERALL TIMELINE PROGRESS BAR CONTAINER */}
        <section className="bg-[#161B22] border border-[#30363D] p-4.5 rounded-xl transition" id="progress-bar-container">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-[#8B949E] tracking-wider uppercase block">
              Overall Roadmap Completion Progress
            </h2>
            <span className="text-xs font-extrabold text-[#2F81F7]">{progressPercent}%</span>
          </div>
          {/* Outer bar track */}
          <div className="w-full bg-[#30363D] h-2 rounded-full overflow-hidden">
            {/* Filled bar track indicator */}
            <div
              className="bg-[#2F81F7] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
              id="overall-progress-bar-fill"
            />
          </div>
        </section>

        {/* DASHBOARD GRID SEPARATOR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* MAIN COLUMN (LEFT SIDE) */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Card: Today's study goal card - GEOMETRIC LINEAR GRADIENT */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 25, delay: 0.1 }}
              className="bg-gradient-to-br from-[#1C2128] to-[#161B22] border border-[#2F81F7] rounded-xl p-6 relative transition shadow-xl"
              id="todays-task-card"
            >
              <span className="bg-[#2F81F7] text-white text-[9px] font-black px-2.5 py-0.5 rounded uppercase tracking-widest absolute -top-2.5 left-5 inline-block animate-pulse">
                Today's Mission
              </span>

              {!startDate ? (
                /* Empty state - Start date not configured yet */
                <div className="text-center py-6" id="today-empty-unconfigured">
                  <div className="p-3 bg-[#161B22] border border-[#30363D] text-[#8B949E] inline-block rounded-xl mb-3">
                    <Settings size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Roadmap start date not configured yet!</h4>
                  <p className="text-xs text-[#8B949E] mt-1 px-4 max-w-sm mx-auto">
                    Please use the Setup panel in the sidebar to configure your start date. The application computes Day 1 to 95 automatically relative to that date.
                  </p>
                </div>
              ) : currentDayNum !== null && (currentDayNum < 1 || currentDayNum > 95) ? (
                /* Edge state - Outside study calendar bounds */
                <div className="text-center py-6" id="today-empty-outofbounds">
                  <div className="p-3 bg-[#161B22] border border-[#30363D] text-[#238636] inline-block rounded-xl mb-3">
                    <CheckCircle2 size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {currentDayNum < 1 ? "Roadmap starts in the future!" : "95-Day study calendar elapsed!"}
                  </h4>
                  <p className="text-xs text-[#8B949E] mt-1 px-4 max-w-md mx-auto font-mono">
                    {currentDayNum < 1
                      ? `Scheduled study start date: ${startDate}. Day 1 unlocks automatically in ${Math.abs(currentDayNum - 1)} day(s)!`
                      : `You finished the study schedule timeline! Check the 'All 95 Days' view or reset completions below to restart.`}
                  </p>
                </div>
              ) : todayTask ? (
                /* Primary state - Standard Active Goal Card */
                <div className="flex flex-col gap-4" id={`action-task-day-${todayTask.day}`}>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pt-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-[10px] font-black bg-[#30363D] py-0.5 px-2 rounded text-white font-mono">
                          Day {todayTask.day}
                        </span>
                        <span className="text-[10px] font-bold bg-[#161B22] border border-[#30363D] text-[#D29922] px-2 py-0.5 rounded font-mono">
                          ⏱️ {todayTask.duration}
                        </span>
                      </div>
                      <h4 className="text-base md:text-lg font-bold text-white tracking-tight leading-tight">
                        {todayTask.title}
                      </h4>
                    </div>

                    {/* Completion status indicator stamp */}
                    <div className="shrink-0">
                      {completedDays.has(todayTask.day) ? (
                        <span className="text-[10px] font-black uppercase bg-[#238636]/15 text-[#238636] border border-[#238636]/40 py-1 px-2.5 rounded inline-flex items-center gap-1 tracking-wider">
                          <CheckCircle2 size={11} className="fill-current animate-bounce" />
                          <span>Finished</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase bg-[#D29922]/15 text-[#D29922] border border-[#D29922]/40 py-1 px-2.5 rounded inline-flex items-center gap-1 tracking-wider">
                          <Clock size={11} className="animate-spin animate-duration-3000" />
                          <span>Todo Today</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resource Link Actions */}
                  <div className="mt-1">
                    <span className="text-[10px] font-bold text-[#8B949E] block mb-2 uppercase tracking-wide">Resources:</span>
                    <div className="flex flex-wrap gap-2">
                      {todayTask.resources.map((link, idx) => (
                        <motion.a
                          whileHover={{ scale: 1.03, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          key={idx}
                          href={link.url}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="bg-[#161B22] hover:bg-[#30363D] border border-[#30363D] text-[#2F81F7] hover:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <BookOpen size={12} className="text-[#8B949E]" />
                          <span>{link.label}</span>
                          <ExternalLink size={11} className="text-[#8B949E] shrink-0" />
                        </motion.a>
                      ))}
                    </div>
                  </div>

                  {/* Tags cluster */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {todayTask.tags.map((tag, i) => (
                      <span key={i} className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getTagStyle(tag)}`}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Contextual AI Study Guide Box */}
                  <div className="bg-[#0A0C10]/40 border border-[#30363D] rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mt-1.5" id="contextual-ai-guide-box">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#2F81F7]/10 text-[#2F81F7] rounded mr-1 animate-pulse">
                        <Sparkles size={14} className="text-amber-300" />
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black text-white tracking-wider uppercase flex items-center gap-1">
                          <span>Contextual AI Study Guide</span>
                          <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[8.5px] font-black px-1 py-0.5 rounded uppercase tracking-widest leading-none">Free</span>
                        </h5>
                        <p className="text-[10px] text-[#8B949E] mt-0.5">Get expert explanations, hands-on console labs, or quick evaluation quizzes.</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          setAiChatOpen(true);
                          handleSendAIMessage(`📖 Explain key concepts and give practical design tips for: "${todayTask.title}"`);
                        }}
                        className="text-[9.5px] font-bold bg-[#1C2128] hover:bg-[#30363D] border border-[#30363D] text-[#E6EDF3] py-1 px-2.5 rounded-lg transition shrink-0 cursor-pointer"
                        id="explain-day-topic-btn"
                      >
                        📖 Explain
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          setAiChatOpen(true);
                          handleSendAIMessage(`🛠️ Create a hands-on console lab exercise for practice: "${todayTask.title}"`);
                        }}
                        className="text-[9.5px] font-bold bg-[#2F81F7]/10 hover:bg-[#2F81F7]/25 border border-[#2F81F7]/25 text-[#58a6ff] py-1 px-2.5 rounded-lg transition shrink-0 cursor-pointer"
                        id="lab-day-topic-btn"
                      >
                        🛠️ Practice Lab
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          setAiChatOpen(true);
                          handleSendAIMessage(`📝 Give me a 3-question evaluation quiz on: "${todayTask.title}"`);
                        }}
                        className="text-[9.5px] font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-[#d29922] py-1 px-2.5 rounded-lg transition shrink-0 cursor-pointer"
                        id="quiz-day-topic-btn"
                      >
                        📝 Ask Mentor for Quiz
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => startQuickQuiz(todayTask.day, todayTask.title)}
                        className="text-[9.5px] font-bold bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 py-1 px-2.5 rounded-lg transition shrink-0 cursor-pointer"
                        id="test-my-knowledge-btn"
                      >
                        🧠 Test My Knowledge
                      </motion.button>
                    </div>
                  </div>

                  {/* Action Completion Toggle Button */}
                  <div className="border-t border-[#30363D] pt-4 mt-2">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleToggleDay(todayTask.day)}
                      className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                        completedDays.has(todayTask.day)
                          ? 'border border-[#30363D] text-[#E6EDF3] hover:bg-[#30363D]'
                          : 'bg-[#2F81F7] hover:bg-blue-600 text-white'
                      }`}
                      id="today-toggle-btn"
                    >
                      {completedDays.has(todayTask.day) ? (
                        <>
                          <AnimatedCheckmark size={14} />
                          <span>Undo / Mark Day {todayTask.day} Incomplete</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Mark Day {todayTask.day} Complete</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              ) : null}
            </motion.section>

            {/* TABBED IN-DEPTH DAY SCHEDULE LIST CONTAINER */}
            <section className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden transition" id="tabbed-schedule-section">
              
              {/* Tab selector bar */}
              <div className="border-b border-[#30363D] bg-[#0A0C10] p-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-1 px-1 text-xs md:text-sm font-semibold transition-all relative cursor-pointer ${
                      activeTab === 'all'
                        ? 'text-white border-b-2 border-[#2F81F7]'
                        : 'text-[#8B949E] hover:text-[#E6EDF3]'
                    }`}
                    id="tab-all-btn"
                  >
                    <span>All 95 Days</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('missed')}
                    className={`pb-1 px-1 text-xs md:text-sm font-semibold transition-all relative inline-flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'missed'
                        ? 'text-white border-b-2 border-[#2F81F7]'
                        : 'text-[#8B949E] hover:text-[#E6EDF3]'
                    }`}
                    id="tab-missed-btn"
                  >
                    <span>Missed Tasks</span>
                    {missedCount > 0 && (
                      <span className="bg-[#F85149] text-white text-[9px] w-4.5 h-4.5 font-bold flex items-center justify-center rounded-full leading-none">
                        {missedCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('next7')}
                    className={`pb-1 px-1 text-xs md:text-sm font-semibold transition-all relative cursor-pointer ${
                      activeTab === 'next7'
                        ? 'text-white border-b-2 border-[#2F81F7]'
                        : 'text-[#8B949E] hover:text-[#E6EDF3]'
                    }`}
                    id="tab-next7-btn"
                  >
                    <span>Next 7 Days</span>
                  </button>
                </div>
                
                <span className="text-[10px] uppercase font-mono text-[#8B949E]" id="filtered-items-stamp">
                  {searchQuery ? `${searchedTasks.length} filtered` : `${tabTasks.length} Day Tasks`}
                </span>
              </div>

              {/* Sticky sleek search input field at the top of the tabbed section */}
              <div className="bg-[#1C2128] border-b border-[#30363D] px-4 py-2.5 flex items-center gap-2 sticky top-0 z-10" id="topic-search-bar-container">
                <Search size={14} className="text-[#8B949E] shrink-0" />
                <input
                  type="text"
                  placeholder="Search 95 Days topic or tag (e.g., Docker, AWS, SAST, k8s...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 text-xs text-[#E6EDF3] placeholder-[#8B949E]/70 focus:outline-none focus:ring-0 focus:border-0"
                  id="tab-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[#8B949E] hover:text-[#58a6ff] text-[10px] uppercase font-mono cursor-pointer shrink-0 py-0.5 px-1.5 rounded transition hover:bg-[#30363D]"
                    id="clear-search-btn"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Scrollable list window */}
              <div className="overflow-y-auto max-h-[460px] divide-y divide-[#30363D]" id="schedule-scroll-list">
                {searchedTasks.length === 0 ? (
                  <div className="text-center py-12 px-6" id="filtered-list-empty-fallback">
                    <p className="text-[#8B949E] font-semibold text-xs">
                      {searchQuery ? "No matching roadmap topics found" : "No tasks match this filter choice!"}
                    </p>
                    {searchQuery ? (
                      <p className="text-[10px] text-[#8B949E] mt-1">
                        Try searching for another keyword or clear current text query.
                      </p>
                    ) : (
                      <>
                        {activeTab === 'missed' && (
                          <p className="text-[10px] text-[#8B949E] mt-1">Excellent! You have not left any previous days incomplete.</p>
                        )}
                        {activeTab === 'next7' && (
                          <p className="text-[10px] text-[#8B949E] mt-1">Great! There are no remaining incomplete tasks on the horizon for the next 7 days.</p>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  searchedTasks.map((task) => (
                    <div
                      key={task.day}
                      className={`p-3.5 hover:bg-white/[0.02] flex items-center justify-between gap-4 transition-colors ${
                        completedDays.has(task.day) ? 'opacity-80' : ''
                      } ${currentDayNum === task.day ? 'bg-[#2F81F7]/5 border-l-2 border-[#2F81F7]' : ''}`}
                      id={`list-row-day-${task.day}`}
                    >
                      {/* Checkbox trigger labels wrapper */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Interactive trigger button with animated checked state */}
                        <div className="pt-0.5 select-none">
                          <button
                            type="button"
                            onClick={() => handleToggleDay(task.day)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                              completedDays.has(task.day)
                                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500'
                                : 'border-[#30363D] bg-[#0A0C10] text-transparent hover:border-[#8B949E]'
                            }`}
                            id={`row-check-day-${task.day}`}
                          >
                            {completedDays.has(task.day) ? (
                              <AnimatedCheckmark size={11} />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded bg-transparent" />
                            )}
                          </button>
                        </div>

                        {/* Title text & sub-items context */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-[#8B949E] whitespace-nowrap">
                              Day {task.day}
                            </span>
                            <span className="text-[10px] text-[#8B949E] font-mono">
                              ⏱️ {task.duration}
                            </span>
                            {currentDayNum === task.day && (
                              <span className="bg-[#2F81F7]/20 text-[#2F81F7] text-[9px] uppercase font-bold px-1.5 rounded py-0.5 scale-90">
                                TODAY
                              </span>
                            )}
                          </div>

                          <h5 className={`text-xs md:text-sm font-bold leading-tight mt-1 text-[#E6EDF3] ${
                            completedDays.has(task.day) ? 'line-through text-[#8B949E]' : ''
                          }`}>
                            {task.title}
                          </h5>

                          {/* Dynamic resource triggers wrapper */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {task.resources.map((link, lIdx) => (
                              <a
                                key={lIdx}
                                href={link.url}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                className="text-[#2F81F7] hover:text-blue-400 text-[10px] font-semibold inline-flex items-center gap-0.5 py-0.5 px-2 border border-[#30363D] rounded bg-[#161B22] transition-colors"
                              >
                                <span>{link.label.split(' - ')[0]}</span>
                                <ExternalLink size={8} className="shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Tag indicators and completions stamped */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {/* Render first tag to conserve narrow layouts */}
                        {task.tags.slice(0, 1).map((tag, tIdx) => (
                          <span key={tIdx} className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getTagStyle(tag)}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* SIDEBAR COLUMNS (RIGHT SIDE) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 1. SECTION: PHASE PROGRESS PANELS */}
            <section className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 transition" id="phase-progress-card">
              <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
                <Layers size={14} className="text-[#8B949E]" />
                <span>Phase Progress</span>
              </h3>

              <div className="flex flex-col gap-4">
                {PHASES.map((phase) => {
                  const stats = calculatePhaseStats(phase);
                  return (
                    <div key={phase.id} className="border-b border-[#30363D] pb-3 last:border-0 last:pb-0" id={`sidebar-phase-tracker-${phase.id}`}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-[#E6EDF3] line-clamp-1 truncate block max-w-[180px]">{phase.name.split(':')[1] || phase.name}</span>
                        <span className="text-[10px] text-[#8B949E] whitespace-nowrap font-mono font-bold">
                          {stats.completed}/{stats.total} Days
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#30363D] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2F81F7] h-full rounded-full transition-all"
                            style={{ width: `${stats.percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[#8B949E] w-6 text-right shrink-0">{stats.percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 1.5. SECTION: PATHS DISTRIBUTION PIE CHART */}
            <section className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 transition animate-fade-in" id="phase-distribution-chart-card">
              <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2 flex items-center gap-2 font-mono">
                <TrendingUp size={14} className="text-[#8B949E]" />
                <span>Completion Spread</span>
              </h3>

              <p className="text-[10px] text-[#8B949E] mb-3 leading-tight">
                {totalCompletedInChart > 0 
                  ? "Distribution of your checked milestones across the 5 learning phases." 
                  : "Target breakdown of curriculum sizes per learning phase (empty)."}
              </p>

              <div className="relative w-full flex justify-center items-center h-[180px]">
                {/* Absolute Center Label */}
                <div className="absolute flex flex-col items-center pointer-events-none text-center">
                  <span className="text-lg font-extrabold text-white leading-none">{totalCompletedInChart}</span>
                  <span className="text-[8px] uppercase tracking-wider font-bold text-[#8B949E] mt-0.5">
                    {totalCompletedInChart === 1 ? 'Day Done' : 'Days Done'}
                  </span>
                </div>
                
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          opacity={totalCompletedInChart > 0 ? 1 : 0.25} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, props: any) => {
                        const count = props.payload.actualCompleted;
                        const total = props.payload.totalDays;
                        return [`${count} / ${total} Days completed`, name];
                      }}
                      contentStyle={{ background: '#0A0C10', borderColor: '#30363D', borderRadius: '8px' }}
                      itemStyle={{ color: '#E6EDF3', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend */}
              <div className="mt-3 grid grid-cols-2 gap-y-1.5 gap-x-2 border-t border-[#30363D]/50 pt-3">
                {chartData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-medium text-[#8B949E] truncate uppercase tracking-wider">
                      {item.name} ({item.actualCompleted})
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. SECTION: CERTIFICATIONS UNLOCKED STATUS LIST */}
            <section className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 transition" id="certifications-list-card">
              <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
                <Award size={14} className="text-[#8B949E]" />
                <span>Certifications</span>
              </h3>

              <div className="flex flex-col gap-3">
                {PHASES.map((phase, idx) => {
                  const status = getCertStatus(phase, idx);

                  let statusText = '';
                  let statusBadgeStyle = '';
                  let iconElement;

                  switch (status) {
                    case 'earned':
                      statusText = 'Earned';
                      statusBadgeStyle = 'bg-[#238636]/15 text-[#238636] border border-[#238636]/40 font-bold py-0.5 px-2 rounded-full text-[9px] uppercase tracking-wider';
                      iconElement = <Award className="text-[#238636] fill-current shrink-0" size={16} />;
                      break;
                    case 'in_progress':
                      statusText = 'In Progress';
                      statusBadgeStyle = 'bg-[#2F81F7]/15 text-[#2F81F7] border border-[#2F81F7]/40 font-bold py-0.5 px-2 rounded-full text-[9px] uppercase tracking-wider';
                      iconElement = <Unlock className="text-[#2F81F7] shrink-0" size={16} />;
                      break;
                    case 'locked':
                    default:
                      statusText = 'Locked';
                      statusBadgeStyle = 'bg-transparent text-[#8B949E] border border-[#30363D] font-bold py-0.5 px-2 rounded-full text-[9px] uppercase tracking-wider';
                      iconElement = <Lock className="text-[#8B949E]/40 shrink-0" size={16} />;
                      break;
                  }

                  return (
                    <div
                      key={phase.id}
                      className={`flex gap-3 items-center p-3 border rounded-xl transition ${
                        status === 'earned'
                          ? 'bg-[#238636]/5 border-[#238636]/20'
                          : status === 'in_progress'
                            ? 'bg-[#2F81F7]/5 border-[#2F81F7]/20'
                            : 'bg-transparent border-[#30363D]/60 opacity-60'
                      }`}
                      id={`sidebar-cert-row-${phase.id}`}
                    >
                      {/* Left icon marker */}
                      {iconElement}

                      {/* Content target parameters */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[9px] font-mono text-[#8B949E] block uppercase tracking-wider">Phase {phase.id} target</span>
                          <span className={statusBadgeStyle}>{statusText}</span>
                        </div>
                        <a
                          href={phase.certTarget.url}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className={`text-xs font-bold block mt-1 hover:underline truncate inline-flex items-center gap-0.5 ${
                            status === 'locked' ? 'text-[#8B949E] pointer-events-none' : 'text-[#E6EDF3]'
                          }`}
                        >
                          <span>{phase.certTarget.name}</span>
                          {status !== 'locked' && <ExternalLink size={10} className="shrink-0 text-[#8B949E]" />}
                        </a>
                        <p className="text-[10px] text-[#8B949E] mt-0.5 truncate font-mono">
                          Req: {phase.certTarget.unlockCondition.replace('Complete all ', '')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 2.5 SECTION: DYNAMIC DAILY REMINDERS AND ALERTS SETTINGS */}
            <section className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 transition" id="notification-setup-panel">
              <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
                <Clock size={14} className="text-[#8B949E]" />
                <span>Daily Study Alerts</span>
              </h3>

              <div className="flex flex-col gap-4">
                {/* Active alert status switch */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#E6EDF3] uppercase tracking-wider">Enable Daily Alerts:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notiEnabled}
                      onChange={(e) => {
                        const nextVal = e.target.checked;
                        setNotiEnabled(nextVal);
                        handleSaveCustomNotification(notiMsg, notiTime, nextVal);
                      }}
                      className="sr-only peer"
                      id="notifications-enabled-checkbox"
                    />
                    <div className="w-9 h-5 bg-[#30363D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#30363D] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2F81F7]" />
                  </label>
                </div>

                {/* Reminder Alert Message Form Input Row */}
                <div>
                  <label htmlFor="notification-message-input" className="text-[10px] font-bold text-[#8B949E] block mb-1 uppercase tracking-wide">
                    Alert Message:
                  </label>
                  <input
                    type="text"
                    id="notification-message-input"
                    value={notiMsg}
                    onChange={(e) => setNotiMsg(e.target.value)}
                    placeholder="e.g., Time to build Kubernetes clusters!"
                    className="w-full bg-[#0A0C10] border border-[#30363D] text-[#E6EDF3] py-1.5 px-3 rounded-lg text-xs focus:outline-none focus:border-[#2F81F7]"
                  />
                </div>

                {/* Reminder Alert Time Input Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="notification-time-input" className="text-[10px] font-bold text-[#8B949E] block mb-1 uppercase tracking-wide">
                      Alert Time (UTC):
                    </label>
                    <input
                      type="time"
                      id="notification-time-input"
                      value={notiTime}
                      onChange={(e) => setNotiTime(e.target.value)}
                      className="w-full bg-[#0A0C10] border border-[#30363D] text-[#E6EDF3] py-1.5 px-3 rounded-lg text-xs focus:outline-none focus:border-[#2F81F7]"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => handleSaveCustomNotification()}
                      className="w-full bg-[#30363D] hover:bg-[#8B949E]/20 text-white text-[11px] font-bold py-2 rounded-lg transition text-center cursor-pointer border border-[#30363D]"
                      id="save-notifications-config-btn"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>

                {/* Simulated Trigger Alarm button */}
                <div className="border-t border-[#30363D]/60 pt-3 flex gap-2">
                  <button
                    onClick={triggerTestNotification}
                    className="w-full bg-[#2F81F7]/15 hover:bg-[#2F81F7]/30 text-[#2F81F7] text-[11px] font-bold py-2 px-3 rounded-lg border border-[#2F81F7]/25 transition text-center cursor-pointer inline-flex items-center justify-center gap-1.5"
                    id="test-notification-trigger-btn"
                  >
                    <span>Play Test Notification</span>
                    <Flame size={12} />
                  </button>
                </div>
              </div>
            </section>

            {/* NEW WIDGET: DYNAMIC CLIENT/SERVER BACKED DAILY GOALS SECTION */}
            <section className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 transition" id="daily-goals-panel">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider flex items-center gap-2 font-mono">
                  <CheckCircle2 size={14} className="text-purple-400" />
                  <span>Daily Goals</span>
                </h3>
                {dailyGoals.length > 0 && (
                  <span className="text-[9px] font-mono font-bold bg-[#30363D] px-1.5 py-0.5 rounded text-[#8B949E]" id="daily-goals-count">
                    {dailyGoals.filter(g => g.completed).length}/{dailyGoals.length} done
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {/* Form to append a new daily goal */}
                <form onSubmit={handleAddDailyGoal} className="flex gap-1.5" id="add-daily-goal-form">
                  <input
                    type="text"
                    id="daily-goal-input"
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    placeholder="e.g., Practice Python snippets..."
                    maxLength={100}
                    className="w-full bg-[#0A0C10] border border-[#30363D] text-[#E6EDF3] py-1.5 px-2.5 rounded-lg text-xs placeholder-[#8B949E]/60 focus:outline-none focus:border-[#2F81F7] min-w-0"
                  />
                  <button
                    type="submit"
                    id="add-goal-btn"
                    className="bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center border border-purple-600/10"
                    title="Add Goal"
                  >
                    <Plus size={14} />
                  </button>
                </form>

                {/* Main scrollable view list */}
                <div className="max-h-[190px] overflow-y-auto flex flex-col gap-1.5" id="daily-goals-list">
                  {dailyGoals.length === 0 ? (
                    <div className="text-center py-5 px-3 border border-dashed border-[#30363D] rounded-xl" id="daily-goals-empty-fallback">
                      <p className="text-[11px] text-[#8B949E] leading-normal">
                        No goals added for today. Set small targets to keep focused.
                      </p>
                    </div>
                  ) : (
                    dailyGoals.map((g) => (
                      <div
                        key={g.id}
                        className="bg-[#0A0C10] border border-[#30363D] p-2 rounded-lg flex items-center justify-between gap-2.5 hover:border-[#8B949E]/35 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleDailyGoal(g.id)}
                            className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition cursor-pointer ${
                              g.completed
                                ? 'bg-purple-500/10 border-purple-500/65 text-purple-400'
                                : 'border-[#30363D] hover:border-purple-400/60 text-transparent'
                            }`}
                          >
                            <Check size={11} className={g.completed ? 'block' : 'hidden'} />
                          </button>
                          <span
                            className={`text-xs select-none truncate transition-all ${
                              g.completed ? 'line-through text-[#8B949E] opacity-75' : 'text-[#E6EDF3]'
                            }`}
                          >
                            {g.text}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDailyGoal(g.id)}
                          className="text-[#8B949E] hover:text-[#F85149] p-1 rounded hover:bg-[#30363D]/30 transition shrink-0 cursor-pointer lg:opacity-0 lg:group-hover:opacity-100"
                          title="Delete Goal"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* 3. SECTION: ROADMAP SETTINGS CONTROL PANEL */}
            <section className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 transition" id="settings-setup-panel">
              <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
                <Settings size={14} className="text-[#8B949E]" />
                <span>Setup & Controls</span>
              </h3>

              <div id="settings-controls-section" className="flex flex-col gap-4">
                {/* Save calendar date block */}
                <div>
                  <label htmlFor="start-date-picker" className="text-[10px] font-bold text-[#8B949E] block mb-1.5 uppercase tracking-wider">
                    Study Start Date:
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="date"
                      value={setupDateInput}
                      onChange={(e) => setSetupDateInput(e.target.value)}
                      id="start-date-picker"
                      className="bg-[#0A0C10] border border-[#30363D] text-[#E6EDF3] py-1.5 px-3 rounded-lg text-xs focus:outline-none focus:border-[#2F81F7]"
                    />
                    <button
                      onClick={handleSaveStartDate}
                      className="bg-[#2F81F7] hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-lg transition whitespace-nowrap cursor-pointer text-center"
                      id="save-start-date-btn"
                    >
                      Save Start Date
                    </button>
                  </div>
                </div>

                {/* Professional Exporter panel widget */}
                <div className="border-t border-[#30363D] pt-3.5" id="resume-exporter-section">
                  <span className="text-[10px] font-bold text-[#8B949E] block mb-2 uppercase tracking-wide">
                    Professional Exporter
                  </span>
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="w-full bg-[#2F81F7] hover:bg-[#2F81F7]/90 text-white py-2.5 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    id="export-progress-sidebar-btn"
                  >
                    <Award size={13} className="shrink-0 text-amber-300 animate-pulse" />
                    <span>Export Progress to LinkedIn</span>
                  </button>
                  <p className="text-[9px] text-[#8B949E] mt-1.5 leading-relaxed font-mono">
                    Generate professionally tailored resume or LinkedIn milestone achievements based on completed days.
                  </p>
                </div>

                {/* DB Reset danger zone */}
                <div className="border-t border-[#30363D] pt-3.5">
                  <span className="text-[10px] font-bold text-[#F85149] block mb-1.5 uppercase tracking-wide">Danger Zone</span>
                  <button
                    onClick={handleReset}
                    className="w-full border border-[#F85149]/30 text-[#F85149] hover:bg-[#F85149]/10 py-2.5 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    id="danger-reset-all-btn"
                  >
                    <RotateCcw size={13} className="shrink-0" />
                    <span>Reset Checked Progress</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

        </div>
      </main>

      {/* FOOTER BLOCK */}
      <footer className="border-t border-[#30363D] py-4 px-6 text-center text-[10px] text-[#8B949E] font-medium shrink-0 bg-[#0A0C10]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 font-mono">
          <p>© 2026 DevSecOps & AI Learning Tracker.</p>
          <p>Secure Sandbox State Engine fully operational.</p>
        </div>
      </footer>

      {/* SECTION: RESUME & LINKEDIN PORTFOLIO ADVANCED EXPORTER OVERLAY */}
      {isExportModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
          id="resume-exporter-modal-backdrop"
          onClick={() => setIsExportModalOpen(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`w-full max-w-xl bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${theme === 'light' ? 'bg-white border-[#D0D7DE]' : ''}`}
            onClick={(e) => e.stopPropagation()}
            id="exporter-modal-container"
          >
            {/* Header banner */}
            <div className={`p-5 border-b border-[#30363D] flex items-center justify-between bg-[#0A0C10] ${theme === 'light' ? 'bg-gray-50 border-gray-200' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#2F81F7]/10 text-[#2F81F7] rounded">
                  <Award size={18} className="text-amber-400" />
                </div>
                <div>
                  <h3 className={`text-sm font-black uppercase tracking-wider ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    Milestone Exporter
                  </h3>
                  <p className="text-[10px] text-[#8B949E] font-mono">Tailored Resume & LinkedIn Portfolio Achievements</p>
                </div>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className={`text-[#8B949E] hover:text-white transition-colors cursor-pointer p-1 rounded-lg ${theme === 'light' ? 'hover:text-black hover:bg-gray-200' : 'hover:bg-[#30363D]'}`}
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Markdown Text Area content */}
            <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
              <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-[#8B949E]'}`}>
                Below is a dynamically generated professional update highlighting your actual learning milestone achievement statistics. Copy it to your LinkedIn profile feed or resume experience section to demonstrate continuous technical growth:
              </p>

              <div className={`relative rounded-xl border border-[#30363D] bg-[#0A0C10] p-4 flex flex-col overflow-hidden max-h-[280px] overflow-y-auto font-mono text-[11px] leading-relaxed text-[#c9d1d9] whitespace-pre-wrap ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-800' : ''}`} id="markdown-snippet-display">
                {generateResumeMarkdown()}
              </div>

              {/* Action buttons footer */}
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D] transition cursor-pointer ${theme === 'light' ? 'border-gray-200 hover:bg-gray-100 hover:text-gray-900' : ''}`}
                >
                  Close Panel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(generateResumeMarkdown());
                      setCopiedFeedback(true);
                      setTimeout(() => setCopiedFeedback(false), 2000);
                    } catch (err) {
                      console.error('Failed to copy text option', err);
                    }
                  }}
                  className="px-4 py-2 bg-[#2F81F7] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                  id="modal-copy-to-clipboard-btn"
                >
                  {copiedFeedback ? (
                    <>
                      <Check size={13} className="text-green-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* SECTION: LIVE INTERACTIVE MINI EVALUATION QUIZ PORTAL */}
      {isQuizModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
          id="quiz-engine-modal-backdrop"
          onClick={() => setIsQuizModalOpen(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`w-full max-w-xl bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${theme === 'light' ? 'bg-white border-[#D0D7DE]' : ''}`}
            onClick={(e) => e.stopPropagation()}
            id="quiz-modal-container"
          >
            {/* Header bar area */}
            <div className={`p-5 border-b border-[#30363D] flex items-center justify-between bg-[#0A0C10] ${theme === 'light' ? 'bg-gray-50 border-gray-200' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded">
                  <Sparkles size={16} className="text-purple-400" />
                </div>
                <div>
                  <h3 className={`text-sm font-black uppercase tracking-wider ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    Live AI Quick-Quiz
                  </h3>
                  <p className="text-[10px] text-[#8B949E] font-mono font-bold">Day {todayTask?.day} • Testing Topic Concepts</p>
                </div>
              </div>
              <button 
                onClick={() => setIsQuizModalOpen(false)}
                className={`text-[#8B949E] hover:text-white transition-colors cursor-pointer p-1 rounded-lg ${theme === 'light' ? 'hover:text-black hover:bg-gray-200' : 'hover:bg-[#30363D]'}`}
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Main content viewport */}
            <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[480px]">
              {isQuizLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold text-white font-mono uppercase tracking-wider animate-pulse">
                    Generating dynamic evaluation lab with Gemini 3.5...
                  </p>
                  <p className="text-[10px] text-[#8B949E] max-w-xs leading-relaxed">
                    Analyzing active lesson curriculum requirements, mapping questions, and designing challenges.
                  </p>
                </div>
              ) : quizError ? (
                <div className="text-center py-8 px-4 flex flex-col items-center justify-center gap-3">
                  <AlertTriangle size={32} className="text-[#D29922] animate-bounce" />
                  <h4 className={`text-sm font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Quiz Generation Inactive</h4>
                  <div className={`p-4 rounded-xl border border-dashed text-xs ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-[#0A0C10]/40 border-[#30363D] text-[#8B949E]'}`}>
                    {quizError}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setIsQuizModalOpen(false)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#30363D] text-[#8B949E] hover:bg-[#30363D] hover:text-white transition cursor-pointer ${theme === 'light' ? 'border-gray-200 hover:bg-gray-100 hover:text-gray-900' : ''}`}
                    >
                      Dismiss View
                    </button>
                    {todayTask && (
                      <button
                        onClick={() => startQuickQuiz(todayTask.day, todayTask.title)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition cursor-pointer"
                      >
                        Try Generating Again
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className={`p-3.5 rounded-xl border border-[#30363D] bg-[#0A0C10] ${theme === 'light' ? 'bg-gray-50 border-gray-200' : ''}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      Active Lesson Challenge Topic:
                    </h4>
                    <p className={`text-xs mt-1 leading-normal ${theme === 'light' ? 'text-gray-800' : 'text-[#E6EDF3] font-mono'}`}>
                      "{todayTask?.title}"
                    </p>
                  </div>

                  <div className="flex flex-col gap-6 divide-y divide-[#30363D]/60 pt-1">
                    {quizQuestions.map((q, qIdx) => {
                      const selectedOption = quizSelectedAnswers[qIdx];
                      const hasSelected = selectedOption !== undefined;
                      const correctIdx = q.correctIndex;
                      const isCorrect = hasSelected && selectedOption === correctIdx;

                      return (
                        <div key={qIdx} className={`pt-5 first:pt-0 flex flex-col gap-3 font-sans`}>
                          <p className={`text-xs md:text-sm font-semibold leading-relaxed ${theme === 'light' ? 'text-gray-900' : 'text-[#E6EDF3]'}`}>
                            <span className="text-purple-400 font-bold font-mono mr-1">{qIdx + 1}.</span> {q.question}
                          </p>

                          <div className="grid grid-cols-1 gap-2 mt-1">
                            {q.options.map((opt: string, oIdx: number) => {
                              const isSelectedOption = selectedOption === oIdx;
                              const isOptionCorrect = oIdx === correctIdx;
                              
                              let optionBg = theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100' : 'bg-[#0A0C10] border-[#30363D] text-[#c9d1d9] hover:bg-[#1C2128]';
                              
                              if (hasSelected) {
                                if (isOptionCorrect) {
                                  optionBg = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-400 font-semibold';
                                } else if (isSelectedOption) {
                                  optionBg = 'bg-rose-500/15 border-rose-500/60 text-rose-400 font-semibold';
                                } else {
                                  optionBg = theme === 'light' ? 'bg-gray-100/40 border-gray-100 text-gray-400 opacity-60' : 'bg-[#0A0C10]/20 border-[#30363D]/40 text-[#484F58] opacity-60';
                                }
                              }

                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  disabled={hasSelected}
                                  onClick={() => {
                                    setQuizSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
                                  }}
                                  className={`w-full text-left py-2 px-3 border rounded-xl text-xs transition duration-150 relative ${
                                    !hasSelected ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
                                  } ${optionBg}`}
                                >
                                  <div className="flex items-start gap-1.5">
                                    <span className="font-semibold font-mono shrink-0 mr-1 opacity-70">
                                      {String.fromCharCode(65 + oIdx)}.
                                    </span>
                                    <span>{opt}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Instant Feedback visual banner and Explanation section */}
                          {hasSelected && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`rounded-xl p-3.5 border mt-1 text-xs leading-relaxed ${
                                isCorrect 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 size={12} className="fill-current" />
                                    <span>Correct Choice</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={12} className="fill-current" />
                                    <span>Incorrect Selection</span>
                                  </>
                                )}
                              </div>

                              <p className={`text-[11px] leading-relaxed ${theme === 'light' ? 'text-gray-800' : 'text-[#c9d1d9]'}`}>
                                {quizExplOpened[qIdx] ? q.explanation : `${q.explanation.substring(0, 100)}...`}
                              </p>

                              <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-white/5 pt-2">
                                <button
                                  type="button"
                                  className="text-[10px] font-bold text-purple-400 hover:text-purple-300 hover:underline cursor-pointer flex items-center"
                                  onClick={() => setQuizExplOpened(prev => ({ ...prev, [qIdx]: !prev[qIdx] }))}
                                >
                                  {quizExplOpened[qIdx] ? "Collapse Description" : "💡 Ask Mentor for Explanation"}
                                </button>

                                {!isCorrect && (
                                  <button
                                    type="button"
                                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer flex items-center ml-auto font-mono"
                                    onClick={() => {
                                      setIsQuizModalOpen(false);
                                      setAiChatOpen(true);
                                      handleSendAIMessage(`Hi Mentor, I got this question wrong during today's DevSecOps quiz: \n\n"${q.question}"\n\nOptions list: \n- ${q.options.join('\n- ')}\n\nCorrect answer is: ${q.options[correctIdx]}.\n\nCould you please explain this concept to me in simple terms with a hands-on console sample?`);
                                    }}
                                  >
                                    💬 Practice in Chat &rarr;
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive evaluation footer summary stats banner */}
            {!isQuizLoading && quizQuestions.length > 0 && (
              <div className={`p-4 bg-[#0A0C10] border-t border-[#30363D] flex items-center justify-between ${theme === 'light' ? 'bg-gray-50 border-gray-200' : ''}`}>
                <div className="text-[10px] text-[#8B949E] font-mono">
                  {Object.keys(quizSelectedAnswers).length} of 3 Answered
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="px-4 py-1.5 bg-[#30363D] hover:bg-[#8B949E]/20 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Close Quiz
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
