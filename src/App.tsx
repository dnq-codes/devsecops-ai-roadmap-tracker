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
  MessageSquareCode
} from 'lucide-react';
import { ROADMAP_DAYS, PHASES, DayTask, Phase } from './data';

export default function App() {
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

  const handleSendAIMessage = async (customText?: string) => {
    const textToSend = customText || aiInput;
    if (!textToSend.trim() || aiLoading) return;

    const queryMessage = { role: 'user' as const, content: textToSend };
    const newMessages = [...aiMessages, queryMessage];
    setAiMessages(newMessages);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
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
      
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err: any) {
      console.error(err);
      setAiMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: `❌ **Offline or connection lost**: Failed to retrieve response from AI Mentor.\n\n*Reason: ${err.message || "Network Error"}*` 
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleClearAIChat = () => {
    setAiMessages([
      {
        role: 'assistant',
        content: `👋 Welcome! I am your AI DevOps & DevSecOps Mentor. Ask me any question about today's roadmap, request a hands-on mini-lab, or trigger a self-evaluation quiz!`
      }
    ]);
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setApiError(null);
    
    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    
    while (attempts < maxAttempts && !success) {
      try {
        // 1. Fetch progress
        const progressRes = await fetch('/api/progress');
        if (!progressRes.ok) throw new Error('Failed to fetch progress telemetry');
        const progressData = await progressRes.json();
        
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

        // 2. Fetch notification records
        const notifRes = await fetch('/api/notifications');
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
      const res = await fetch('/api/progress/toggle', {
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
        return next;
      });

      // Fetch fresh notifications instantly to update the alert banner in sync
      const notifRes = await fetch('/api/notifications');
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
      const res = await fetch('/api/custom-notification', {
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

  // Set roadmap start date
  const handleSaveStartDate = async () => {
    if (!setupDateInput) return;
    try {
      setLoading(true);
      const res = await fetch('/api/start-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: setupDateInput })
      });
      if (!res.ok) throw new Error('Failed to update start date setting');
      const data = await res.json();

      setStartDate(setupDateInput);
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
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to complete database reset');
      const data = await res.json();

      setCompletedDays(new Set());
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
    const sDate = new Date(startDate);
    const today = new Date();
    
    // Normalize dates to local midnight for standard calendars
    const startLocal = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate());
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

  if (loading && completedDays.size === 0) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-6 text-[#E6EDF3]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#2F81F7] border-t-transparent rounded-full animate-spin mx-auto mb-4" id="spinner"></div>
          <p className="text-base font-semibold tracking-tight">Syncing Roadmap Curriculum...</p>
          <p className="text-xs text-[#8B949E] mt-1.5 font-mono">SQLite State Server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E6EDF3] flex flex-col font-sans selection:bg-[#2F81F7]/30 selection:text-white">
      {/* ERROR HEADER ALERTS */}

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
        <button
          onClick={() => setAiChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-[#2F81F7] to-[#1F6FEB] text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all group font-semibold text-xs border border-white/10 cursor-pointer"
          id="trigger-ai-assistant-btn"
        >
          <Sparkles size={16} className="text-amber-300 animate-pulse" />
          <span>AI DevOps Mentor</span>
          <span className="w-2 h-2 rounded-full bg-green-400" />
        </button>
      ) : (
        <div
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
        </div>
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
              <span id="notification-message">{notification.statusMessage}</span>
            </div>
            {notification.missedCount > 0 && activeTab !== 'missed' && (
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
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex items-center gap-3.5 transition hover:border-[#2F81F7]" id="stat-completed">
            <div className="p-2.5 bg-[#238636]/10 border border-[#238636]/30 rounded-lg text-[#238636]">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="text-[10px] text-[#8B949E] font-bold uppercase tracking-wider block">Completed</span>
              <span className="text-lg md:text-xl font-bold text-white">{completedCount} <span className="text-xs text-[#8B949E] font-medium">/ 95</span></span>
            </div>
          </div>

          {/* Card 2: Missed task count */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex items-center gap-3.5 transition hover:border-[#F85149]" id="stat-missed">
            <div className="p-2.5 bg-[#F85149]/10 border border-[#F85149]/30 rounded-lg text-[#F85149]">
              <XCircle size={20} />
            </div>
            <div>
              <span className="text-[10px] text-[#8B949E] font-bold uppercase tracking-wider block">Missed Tasks</span>
              <span className="text-lg md:text-xl font-bold text-white">{missedCount} <span className="text-xs text-[#8B949E] font-medium">unresolved</span></span>
            </div>
          </div>

          {/* Card 3: Days left countdown */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex items-center gap-3.5 transition hover:border-[#2F81F7]" id="stat-remaining">
            <div className="p-2.5 bg-[#2F81F7]/10 border border-[#2F81F7]/30 rounded-lg text-[#2F81F7]">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[10px] text-[#8B949E] font-bold uppercase tracking-wider block">Remaining</span>
              <span className="text-lg md:text-xl font-bold text-white">{remainingCount} <span className="text-xs text-[#8B949E] font-medium">days</span></span>
            </div>
          </div>

          {/* Card 4: Overall milestone ratio */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex items-center gap-3.5 transition hover:border-[#D29922]" id="stat-percentage">
            <div className="p-2.5 bg-[#D29922]/10 border border-[#D29922]/30 rounded-lg text-[#D29922]">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] text-[#8B949E] font-bold uppercase tracking-wider block">Overall Ratio</span>
              <span className="text-lg md:text-xl font-bold text-white">{progressPercent}% <span className="text-xs text-[#8B949E] font-medium">finished</span></span>
            </div>
          </div>
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
            <section className="bg-gradient-to-br from-[#1C2128] to-[#161B22] border border-[#2F81F7] rounded-xl p-6 relative transition" id="todays-task-card">
              <span className="bg-[#2F81F7] text-white text-[9px] font-black px-2.5 py-0.5 rounded uppercase tracking-widest absolute -top-2.5 left-5 inline-block">
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
                        <span className="text-[10px] font-black bg-[#30363D] py-0.5 px-2 rounded text-white">
                          Day {todayTask.day}
                        </span>
                        <span className="text-[10px] font-bold bg-[#161B22] border border-[#30363D] text-[#D29922] px-2 py-0.5 rounded">
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
                          <CheckCircle2 size={11} className="fill-current" />
                          <span>Finished</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase bg-[#D29922]/15 text-[#D29922] border border-[#D29922]/40 py-1 px-2.5 rounded inline-flex items-center gap-1 tracking-wider">
                          <Clock size={11} />
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
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="bg-[#161B22] hover:bg-[#30363D] border border-[#30363D] text-[#2F81F7] hover:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <BookOpen size={12} className="text-[#8B949E]" />
                          <span>{link.label}</span>
                          <ExternalLink size={11} className="text-[#8B949E] shrink-0" />
                        </a>
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
                      <button
                        onClick={() => {
                          setAiChatOpen(true);
                          handleSendAIMessage(`📖 Explain key concepts and give practical design tips for: "${todayTask.title}"`);
                        }}
                        className="text-[9.5px] font-bold bg-[#1C2128] hover:bg-[#30363D] border border-[#30363D] text-[#E6EDF3] py-1 px-2.5 rounded-lg transition shrink-0 cursor-pointer"
                        id="explain-day-topic-btn"
                      >
                        📖 Explain
                      </button>
                      <button
                        onClick={() => {
                          setAiChatOpen(true);
                          handleSendAIMessage(`🛠️ Create a hands-on console lab exercise for practice: "${todayTask.title}"`);
                        }}
                        className="text-[9.5px] font-bold bg-[#2F81F7]/10 hover:bg-[#2F81F7]/25 border border-[#2F81F7]/25 text-[#58a6ff] py-1 px-2.5 rounded-lg transition shrink-0 cursor-pointer"
                        id="lab-day-topic-btn"
                      >
                        🛠️ Practice Lab
                      </button>
                      <button
                        onClick={() => {
                          setAiChatOpen(true);
                          handleSendAIMessage(`📝 Give me a 3-question evaluation quiz on: "${todayTask.title}"`);
                        }}
                        className="text-[9.5px] font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-[#d29922] py-1 px-2.5 rounded-lg transition shrink-0 cursor-pointer"
                        id="quiz-day-topic-btn"
                      >
                        📝 Practice Quiz
                      </button>
                    </div>
                  </div>

                  {/* Action Completion Toggle Button */}
                  <div className="border-t border-[#30363D] pt-4 mt-2">
                    <button
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
                          <RotateCcw size={14} />
                          <span>Undo / Mark Day {todayTask.day} Incomplete</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Mark Day {todayTask.day} Complete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

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
                  {tabTasks.length} Day Tasks
                </span>
              </div>

              {/* Scrollable list window */}
              <div className="overflow-y-auto max-h-[460px] divide-y divide-[#30363D]" id="schedule-scroll-list">
                {tabTasks.length === 0 ? (
                  <div className="text-center py-10 px-6" id="filtered-list-empty-fallback">
                    <p className="text-[#8B949E] font-semibold text-xs">No tasks match this filter choice!</p>
                    {activeTab === 'missed' && (
                      <p className="text-[10px] text-[#8B949E] mt-1">Excellent! You have not left any previous days incomplete.</p>
                    )}
                    {activeTab === 'next7' && (
                      <p className="text-[10px] text-[#8B949E] mt-1">Great! There are no remaining incomplete tasks on the horizon for the next 7 days.</p>
                    )}
                  </div>
                ) : (
                  tabTasks.map((task) => (
                    <div
                      key={task.day}
                      className={`p-3.5 hover:bg-white/[0.02] flex items-center justify-between gap-4 transition-colors ${
                        completedDays.has(task.day) ? 'opacity-80' : ''
                      } ${currentDayNum === task.day ? 'bg-[#2F81F7]/5 border-l-2 border-[#2F81F7]' : ''}`}
                      id={`list-row-day-${task.day}`}
                    >
                      {/* Checkbox trigger labels wrapper */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Interactive trigger input element */}
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={completedDays.has(task.day)}
                            onChange={() => handleToggleDay(task.day)}
                            className="w-4.5 h-4.5 accent-[#2F81F7] border-[#30363D] bg-slate-950 rounded cursor-pointer text-slate-900 shrink-0"
                            id={`row-check-day-${task.day}`}
                          />
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
          <p>SQLite State Engine fully operational.</p>
        </div>
      </footer>
    </div>
  );
}
