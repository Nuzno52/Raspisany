'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, 
  Calendar as CalendarIcon, 
  MapPin, 
  User, 
  Home, 
  Search, 
  Settings,
  Loader2,
  Clock,
  ChevronRight,
  Users,
  Palette
} from 'lucide-react';

interface Lesson {
  pair: number;
  subject: string;
  professor?: string;
  group?: string;
  room: string;
}

interface DaySchedule {
  date: string;
  dayOfWeek: string;
  lessons: Lesson[];
}

interface CallScheduleTime {
  pair: number;
  startTime: string;
  endTime: string;
}

interface CallSchedule {
  monday: CallScheduleTime[];
  tuesdayToFriday: CallScheduleTime[];
  saturday: CallScheduleTime[];
}

interface AllData {
  groups: string[];
  teachers: string[];
  schedulesByGroup: Record<string, DaySchedule[]>;
  schedulesByTeacher: Record<string, DaySchedule[]>;
  callSchedule: CallSchedule;
}

const COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
  { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600' },
  { bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-600' },
];

const DAYS_ORDER = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];

export default function ScheduleApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [myGroup, setMyGroup] = useState('1РЭУС-25-1');
  const [myTeacher, setMyTeacher] = useState('');
  
  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingEntity, setViewingEntity] = useState<string | null>(null); // For viewing another group/teacher

  const [theme, setTheme] = useState('light');
  const [customDesign, setCustomDesign] = useState({
    bgMain: '#f9fafb',
    bgCard: '#ffffff',
    textMain: '#111827',
    textMuted: '#6b7280',
    borderMain: '#f3f4f6',
    accentMain: '#111827',
    accentText: '#ffffff',
    navBg: 'rgba(255, 255, 255, 0.9)',
    heroBg: '#111827',
    heroText: '#ffffff',
    radius: '1.5rem',
    font: 'inherit',
    headerStyle: 'standard', // standard, glass, minimal
    navStyle: 'standard', // standard, floating, minimal
    shadowIntensity: '0.05',
    borderWidth: '1px'
  });
  const [isDesigning, setIsDesigning] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, message: string, time: string, read: boolean}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewScheduleToast, setShowNewScheduleToast] = useState(false);
  const [isSelectingEntity, setIsSelectingEntity] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  // Load saved preferences and cached data
  useEffect(() => {
    const savedRole = localStorage.getItem('role') as 'student' | 'teacher';
    const savedGroup = localStorage.getItem('myGroup');
    const savedTeacher = localStorage.getItem('myTeacher');
    const savedTheme = localStorage.getItem('theme');
    const savedCustomDesign = localStorage.getItem('customDesign');
    const cachedData = localStorage.getItem('scheduleData');
    const savedNotifications = localStorage.getItem('notifications');
    
    if (savedRole) setRole(savedRole);
    if (savedGroup) setMyGroup(savedGroup);
    if (savedTeacher) setMyTeacher(savedTeacher);
    if (savedTheme) setTheme(savedTheme);
    if (savedCustomDesign) {
      try {
        setCustomDesign(JSON.parse(savedCustomDesign));
      } catch (e) {
        console.error('Failed to parse custom design', e);
      }
    }
    if (cachedData) {
      try {
        setData(JSON.parse(cachedData));
        setLoading(false); // We have cached data, don't show loading screen
      } catch (e) {
        console.error('Failed to parse cached data', e);
      }
    }
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Failed to parse notifications', e);
      }
    }
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('role', role);
    localStorage.setItem('myGroup', myGroup);
    localStorage.setItem('myTeacher', myTeacher);
    localStorage.setItem('theme', theme);
    localStorage.setItem('customDesign', JSON.stringify(customDesign));
    
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'custom') {
      const root = document.documentElement;
      root.style.setProperty('--c-bg-main', customDesign.bgMain);
      root.style.setProperty('--c-bg-card', customDesign.bgCard);
      root.style.setProperty('--c-text-main', customDesign.textMain);
      root.style.setProperty('--c-text-muted', customDesign.textMuted);
      root.style.setProperty('--c-border-main', customDesign.borderMain);
      root.style.setProperty('--c-accent-main', customDesign.accentMain);
      root.style.setProperty('--c-accent-text', customDesign.accentText);
      root.style.setProperty('--c-nav-bg', customDesign.navBg);
      root.style.setProperty('--c-hero-bg', customDesign.heroBg);
      root.style.setProperty('--c-hero-text', customDesign.heroText);
      root.style.setProperty('--c-radius-val', customDesign.radius);
      root.style.setProperty('--c-font-val', customDesign.font);
      root.style.setProperty('--c-shadow-val', `0 4px 20px rgba(0,0,0,${customDesign.shadowIntensity})`);
      root.style.setProperty('--c-border-val', customDesign.borderWidth);
    } else {
      // Clear custom styles if not in custom theme
      const root = document.documentElement;
      [
        '--c-bg-main', '--c-bg-card', '--c-text-main', '--c-text-muted',
        '--c-border-main', '--c-accent-main', '--c-accent-text',
        '--c-nav-bg', '--c-hero-bg', '--c-hero-text', '--c-radius-val', '--c-font-val', '--c-shadow-val', '--c-border-val'
      ].forEach(prop => root.style.removeProperty(prop));
    }
  }, [role, myGroup, myTeacher, theme, customDesign]);

  // Save notifications
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchSchedule = React.useCallback(async () => {
    // Only set loading if we don't have cached data
    if (!data) setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/schedule`);
      if (!res.ok) throw new Error('Не удалось загрузить расписание');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      // Sort days for all schedules
      const sortDays = (scheduleArray: DaySchedule[]) => {
        return scheduleArray.sort((a, b) => DAYS_ORDER.indexOf(a.dayOfWeek) - DAYS_ORDER.indexOf(b.dayOfWeek));
      };
      
      for (const key in json.schedulesByGroup) {
        json.schedulesByGroup[key] = sortDays(json.schedulesByGroup[key]);
      }
      for (const key in json.schedulesByTeacher) {
        json.schedulesByTeacher[key] = sortDays(json.schedulesByTeacher[key]);
      }
      
      // Check for changes
      if (data) {
        const oldDataStr = JSON.stringify(data.schedulesByGroup);
        const newDataStr = JSON.stringify(json.schedulesByGroup);
        if (oldDataStr !== newDataStr) {
          const newNotif = {
            id: Date.now().toString(),
            message: 'Расписание было обновлено',
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            read: false
          };
          setNotifications(prev => [newNotif, ...prev]);
          setShowNewScheduleToast(true);
          setTimeout(() => setShowNewScheduleToast(false), 5000);
        }
      }

      setData(json);
      localStorage.setItem('scheduleData', JSON.stringify(json));
      
      // Auto-select first teacher if none selected
      if (role === 'teacher' && !myTeacher && json.teachers.length > 0) {
        setMyTeacher(json.teachers[0]);
      }
    } catch (err: any) {
      if (!data) {
        setError('Нет подключения к интернету и нет сохраненного расписания.');
      } else {
        // We have cached data, just show a silent error or ignore
        console.log('Using cached data, fetch failed:', err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [role, myTeacher, data]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const getCallTimes = (dayOfWeek: string, pair: number) => {
    if (!data?.callSchedule) return { startTime: '', endTime: '' };
    
    let scheduleArray = data.callSchedule.tuesdayToFriday;
    if (dayOfWeek.toLowerCase() === 'понедельник') {
      scheduleArray = data.callSchedule.monday;
    } else if (dayOfWeek.toLowerCase() === 'суббота') {
      scheduleArray = data.callSchedule.saturday;
    }

    const time = scheduleArray?.find(t => t.pair === pair);
    return time || { startTime: '', endTime: '' };
  };

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Determine active schedule
  let activeSchedule: DaySchedule[] = [];
  let headerTitle = '';
  
  if (viewingEntity) {
    activeSchedule = role === 'student' ? data?.schedulesByTeacher[viewingEntity] || [] : data?.schedulesByGroup[viewingEntity] || [];
    headerTitle = viewingEntity;
  } else {
    if (role === 'student') {
      activeSchedule = data?.schedulesByGroup[myGroup] || [];
      headerTitle = myGroup;
    } else {
      activeSchedule = data?.schedulesByTeacher[myTeacher] || [];
      headerTitle = myTeacher || 'Выберите преподавателя';
    }
  }

  const activeDay = activeSchedule[activeDayIndex];

  // Current Lesson Logic
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentDayIndex = currentTime.getDay();
  const currentDayStr = currentDayIndex === 0 ? 'воскресенье' : DAYS_ORDER[currentDayIndex - 1];
  
  const myTodaySchedule = role === 'student' 
    ? data?.schedulesByGroup[myGroup]?.find(d => d.dayOfWeek === currentDayStr)
    : data?.schedulesByTeacher[myTeacher]?.find(d => d.dayOfWeek === currentDayStr);

  let currentLesson: any = null;
  let nextLesson: any = null;

  if (myTodaySchedule) {
    for (const lesson of myTodaySchedule.lessons) {
      const times = getCallTimes(currentDayStr, lesson.pair);
      if (!times.startTime) continue;
      
      const startMins = timeToMinutes(times.startTime);
      const endMins = timeToMinutes(times.endTime);
      
      if (currentMinutes >= startMins && currentMinutes <= endMins) {
        currentLesson = { ...lesson, times, timeLeft: endMins - currentMinutes };
      } else if (currentMinutes < startMins && !nextLesson) {
        nextLesson = { ...lesson, times, timeUntil: startMins - currentMinutes };
      }
    }
  }

  const renderHome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-hero-bg text-hero-text rounded-3xl p-6 shadow-lg relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <h2 className="text-white/60 text-sm font-medium mb-1">Сегодня, {currentTime.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</h2>
        <h1 className="text-2xl font-bold mb-6">{role === 'student' ? myGroup : myTeacher}</h1>
        
        {currentLesson ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                Сейчас идет {currentLesson.pair} пара
              </span>
              <span className="text-sm font-medium text-white/80 flex items-center gap-1">
                <Clock size={14} /> {currentLesson.timeLeft} мин до конца
              </span>
            </div>
            <h3 className="text-lg font-bold leading-tight mb-1">{currentLesson.subject}</h3>
            <p className="text-sm text-white/70 flex items-center gap-4">
              <span><MapPin size={12} className="inline mr-1" /> {currentLesson.room}</span>
              {currentLesson.professor && <span><User size={12} className="inline mr-1" /> {currentLesson.professor}</span>}
              {currentLesson.group && <span><Users size={12} className="inline mr-1" /> {currentLesson.group}</span>}
            </p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-white/80 font-medium">Сейчас пар нет</p>
          </div>
        )}

        {nextLesson && (
          <div className="mt-4 flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="min-w-0 flex-1 mr-4">
              <p className="text-xs text-white/50 mb-0.5">Следующая ({nextLesson.pair} пара)</p>
              <p className="text-sm font-medium truncate">{nextLesson.subject}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-white/50 mb-0.5">Начало в {nextLesson.times.startTime}</p>
              <p className="text-sm font-bold text-blue-300">через {nextLesson.timeUntil} мин</p>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-text-main mb-4">Расписание на сегодня</h3>
        {myTodaySchedule && myTodaySchedule.lessons.length > 0 ? (
          <div className="space-y-3">
            {myTodaySchedule.lessons.map((lesson, idx) => {
              const times = getCallTimes(currentDayStr, lesson.pair);
              const isPast = currentMinutes > timeToMinutes(times.endTime);
              const isCurrent = currentLesson?.pair === lesson.pair;
              
              return (
                <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl border ${isCurrent ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : isPast ? 'bg-bg-main border-border-main opacity-60' : 'bg-bg-card border-border-main shadow-sm'}`}>
                  <div className="w-12 text-center shrink-0">
                    <p className={`text-sm font-bold ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-text-main'}`}>{times.startTime}</p>
                    <p className="text-xs text-text-muted">{times.endTime}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-text-main'}`}>{lesson.subject}</p>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      Ауд. {lesson.room} {lesson.professor ? `• ${lesson.professor}` : ''} {lesson.group ? `• ${lesson.group}` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted bg-bg-card rounded-3xl border border-border-main border-dashed">
            <p className="font-medium">Сегодня выходной 🎉</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Date Selector */}
      {activeSchedule.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6">
          {activeSchedule.map((day, index) => (
            <button 
              key={index}
              onClick={() => setActiveDayIndex(index)}
              className={`flex flex-col items-center justify-center min-w-[4rem] h-16 rounded-2xl transition-all shrink-0 ${
                activeDayIndex === index 
                  ? 'bg-accent-main text-accent-text shadow-md scale-105' 
                  : 'bg-bg-card border border-border-main text-text-muted hover:bg-bg-main'
              }`}
            >
              <span className={`text-[10px] font-medium mb-1 uppercase ${activeDayIndex === index ? 'opacity-80' : 'text-text-muted'}`}>
                {day.dayOfWeek.substring(0, 3)}
              </span>
              <span className={`text-sm font-bold ${activeDayIndex === index ? 'text-accent-text' : 'text-text-main'}`}>
                {day.date.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      )}

      {!activeDay || activeDay.lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-text-muted py-20">
          <p className="text-sm font-medium">Нет пар на этот день 🎉</p>
        </div>
      ) : (
        <div className="relative mt-2">
          {/* Timeline Line */}
          <div className="absolute left-[39px] top-4 bottom-4 w-0.5 bg-border-main rounded-full"></div>

          <div className="space-y-6">
            {activeDay.lessons.map((lesson, index) => {
              const times = getCallTimes(activeDay.dayOfWeek, lesson.pair);
              const colorTheme = COLORS[index % COLORS.length];
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={index} 
                  className="flex gap-4 relative"
                >
                  {/* Time Column */}
                  <div className="w-16 flex flex-col items-end pt-1 shrink-0">
                    <span className="text-sm font-bold text-text-main">{times.startTime || `${lesson.pair} пара`}</span>
                    <span className="text-xs text-text-muted font-medium">{times.endTime}</span>
                  </div>

                  {/* Timeline Node */}
                  <div className="relative flex flex-col items-center pt-2">
                    <div className={`w-3 h-3 rounded-full border-2 border-bg-main shadow-sm z-10 bg-border-main`}>
                    </div>
                  </div>

                  {/* Class Card */}
                  <div className={`flex-1 min-w-0 rounded-3xl p-4 sm:p-5 transition-all bg-bg-card shadow-sm hover:shadow-md border border-border-main`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${colorTheme.light} ${colorTheme.text} dark:bg-opacity-20`}>
                        {lesson.pair} пара
                      </span>
                    </div>
                    
                    <h3 className="text-base sm:text-lg font-bold mb-3 leading-tight text-text-main break-words">
                      {lesson.subject}
                    </h3>
                    
                    <div className="space-y-2">
                      {lesson.room && (
                        <div className="flex items-center text-sm text-text-muted">
                          <MapPin size={14} className="mr-2 shrink-0 opacity-70" />
                          <span className="truncate">Ауд. {lesson.room}</span>
                        </div>
                      )}
                      {lesson.professor && role === 'student' && (
                        <div className="flex items-center text-sm text-text-muted">
                          <User size={14} className="mr-2 shrink-0 opacity-70" />
                          <span className="truncate">{lesson.professor}</span>
                        </div>
                      )}
                      {lesson.group && role === 'teacher' && (
                        <div className="flex items-center text-sm text-text-muted">
                          <Users size={14} className="mr-2 shrink-0 opacity-70" />
                          <span className="truncate">{lesson.group}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderSearch = () => {
    const isStudent = role === 'student';
    const items = isStudent ? data?.teachers || [] : data?.groups || [];
    const filteredItems = items.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input 
            type="text" 
            placeholder={isStudent ? "Поиск преподавателя..." : "Поиск группы..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-bg-card border border-border-main rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-main focus:border-transparent text-sm font-medium text-text-main placeholder-text-muted"
          />
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar pb-20 space-y-2">
          {filteredItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setViewingEntity(item);
                setActiveDayIndex(0);
                setActiveTab('schedule');
              }}
              className="w-full flex items-center justify-between p-4 bg-bg-card rounded-2xl border border-border-main hover:border-text-muted transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-bg-main flex items-center justify-center text-text-muted">
                  {isStudent ? <User size={18} /> : <Users size={18} />}
                </div>
                <span className="font-medium text-text-main">{item}</span>
              </div>
              <ChevronRight size={18} className="text-text-muted" />
            </button>
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center py-10 text-text-muted">
              Ничего не найдено
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-bg-card rounded-3xl p-6 border border-border-main shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-text-main">Кто вы?</h3>
        <div className="flex bg-bg-main p-1 rounded-2xl mb-6 border border-border-main">
          <button 
            onClick={() => setRole('student')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${role === 'student' ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
          >
            Я ученик
          </button>
          <button 
            onClick={() => setRole('teacher')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${role === 'teacher' ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
          >
            Я преподаватель
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            {role === 'student' ? 'Ваша группа' : 'Ваше ФИО'}
          </label>
          <button 
            onClick={() => {
              setPickerSearch('');
              setIsSelectingEntity(true);
            }}
            className="w-full flex items-center justify-between px-4 py-4 bg-bg-main border border-border-main rounded-2xl hover:border-accent-main transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-bg-card flex items-center justify-center text-accent-main border border-border-main group-hover:border-accent-main transition-colors">
                {role === 'student' ? <Users size={20} /> : <User size={20} />}
              </div>
              <span className="font-bold text-text-main">
                {role === 'student' ? (myGroup || 'Выберите группу') : (myTeacher || 'Выберите преподавателя')}
              </span>
            </div>
            <ChevronRight size={20} className="text-text-muted group-hover:text-accent-main transition-colors" />
          </button>
        </div>
      </div>

      {isSelectingEntity && (
        <div className="fixed inset-0 z-[100] bg-bg-main flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <div className="px-6 pt-12 pb-4 border-b border-border-main flex items-center gap-4">
            <button 
              onClick={() => setIsSelectingEntity(false)}
              className="p-2 bg-bg-card rounded-full border border-border-main text-text-main"
            >
              <ChevronRight size={24} className="rotate-180" />
            </button>
            <h2 className="text-xl font-bold text-text-main">
              {role === 'student' ? 'Выбор группы' : 'Выбор преподавателя'}
            </h2>
          </div>
          
          <div className="p-6">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
              <input 
                type="text" 
                autoFocus
                placeholder="Поиск..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-bg-card border border-border-main rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-main text-text-main"
              />
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-250px)] hide-scrollbar space-y-2">
              {(role === 'student' ? data?.groups : data?.teachers)
                ?.filter(item => item.toLowerCase().includes(pickerSearch.toLowerCase()))
                .map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (role === 'student') setMyGroup(item);
                      else setMyTeacher(item);
                      setIsSelectingEntity(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                      (role === 'student' ? myGroup === item : myTeacher === item)
                        ? 'bg-accent-main border-accent-main text-accent-text'
                        : 'bg-bg-card border-border-main text-text-main hover:border-accent-main'
                    }`}
                  >
                    <span className="font-bold">{item}</span>
                    {(role === 'student' ? myGroup === item : myTeacher === item) && (
                      <div className="w-6 h-6 bg-accent-text rounded-full flex items-center justify-center text-accent-main">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    )}
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      <div className="bg-bg-card rounded-3xl p-6 border border-border-main shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-text-main">Оформление</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { id: 'light', name: 'Светлая', bg: 'bg-gray-100', border: 'border-gray-200' },
            { id: 'dark', name: 'Темная', bg: 'bg-neutral-900', border: 'border-neutral-700' },
            { id: 'ocean', name: 'Океан', bg: 'bg-slate-900', border: 'border-slate-700' },
            { id: 'forest', name: 'Лес', bg: 'bg-stone-100', border: 'border-stone-300' },
            { id: 'sunset', name: 'Закат', bg: 'bg-orange-50', border: 'border-orange-200' },
            { id: 'custom', name: 'Свой стиль', bg: 'bg-gradient-to-br from-purple-500 to-pink-500', border: 'border-purple-300' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${theme === t.id ? 'border-accent-main ring-1 ring-accent-main' : 'border-border-main hover:border-text-muted'}`}
            >
              <div className={`w-6 h-6 rounded-full border ${t.bg} ${t.border}`}></div>
              <span className="text-sm font-medium text-text-main">{t.name}</span>
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setIsDesigning(true)}
          className="w-full py-3 bg-bg-main border border-border-main rounded-2xl text-sm font-bold text-text-main hover:border-accent-main transition-colors flex items-center justify-center gap-2"
        >
          <Palette size={18} />
          Лаборатория дизайна
        </button>
      </div>

      {isDesigning && (
        <div className="fixed inset-0 z-[110] bg-bg-main flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <div className="px-6 pt-12 pb-4 border-b border-border-main flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsDesigning(false)}
                className="p-2 bg-bg-card rounded-full border border-border-main text-text-main"
              >
                <ChevronRight size={24} className="rotate-180" />
              </button>
              <h2 className="text-xl font-bold text-text-main">Дизайн Лаб</h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCustomDesign({
                  bgMain: '#f9fafb',
                  bgCard: '#ffffff',
                  textMain: '#111827',
                  textMuted: '#6b7280',
                  borderMain: '#f3f4f6',
                  accentMain: '#111827',
                  accentText: '#ffffff',
                  navBg: 'rgba(255, 255, 255, 0.9)',
                  heroBg: '#111827',
                  heroText: '#ffffff',
                  radius: '1.5rem',
                  font: 'inherit',
                  headerStyle: 'standard',
                  navStyle: 'standard',
                  shadowIntensity: '0.05',
                  borderWidth: '1px'
                })}
                className="px-3 py-2 bg-bg-card border border-border-main rounded-xl text-xs font-bold text-text-muted hover:text-text-main transition-colors"
              >
                Сброс
              </button>
              <button 
                onClick={() => {
                  setTheme('custom');
                  setIsDesigning(false);
                }}
                className="px-4 py-2 bg-accent-main text-accent-text rounded-xl text-sm font-bold"
              >
                Применить
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 hide-scrollbar">
            {/* Preview Section */}
            <section>
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Предпросмотр</h3>
              <div className="p-6 rounded-3xl border border-border-main bg-bg-main space-y-4" style={{ 
                backgroundColor: customDesign.bgMain,
                borderRadius: customDesign.radius,
                fontFamily: customDesign.font
              }}>
                <div className="p-4 rounded-2xl shadow-sm border border-border-main" style={{ 
                  backgroundColor: customDesign.bgCard,
                  borderColor: customDesign.borderMain,
                  borderRadius: `calc(${customDesign.radius} * 0.75)`
                }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ 
                      backgroundColor: customDesign.accentMain,
                      color: customDesign.accentText
                    }}>1 пара</span>
                    <span className="text-[10px] font-medium" style={{ color: customDesign.textMuted }}>08:30 - 10:00</span>
                  </div>
                  <h4 className="text-sm font-bold" style={{ color: customDesign.textMain }}>Математика</h4>
                  <p className="text-[10px]" style={{ color: customDesign.textMuted }}>Ауд. 301 • Иванов И.И.</p>
                </div>
                
                <button className="w-full py-3 rounded-xl text-xs font-bold shadow-md" style={{ 
                  backgroundColor: customDesign.accentMain,
                  color: customDesign.accentText,
                  borderRadius: `calc(${customDesign.radius} * 0.5)`
                }}>
                  Пример кнопки
                </button>
              </div>
            </section>

            {/* Colors Section */}
            <section>
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Цвета</h3>
              <div className="space-y-4">
                {[
                  { label: 'Фон приложения', key: 'bgMain' },
                  { label: 'Фон карточек', key: 'bgCard' },
                  { label: 'Основной текст', key: 'textMain' },
                  { label: 'Приглушенный текст', key: 'textMuted' },
                  { label: 'Акцентный цвет', key: 'accentMain' },
                  { label: 'Текст на акценте', key: 'accentText' },
                  { label: 'Фон героя', key: 'heroBg' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-main">{item.label}</span>
                    <input 
                      type="color" 
                      value={(customDesign as any)[item.key]}
                      onChange={(e) => setCustomDesign({ ...customDesign, [item.key]: e.target.value })}
                      className="w-10 h-10 rounded-lg border-none cursor-pointer bg-transparent"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Shapes Section */}
            <section>
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Формы</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-text-main">Скругление углов</span>
                    <span className="text-xs font-bold text-accent-main">{customDesign.radius}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="3" 
                    step="0.1"
                    value={parseFloat(customDesign.radius)}
                    onChange={(e) => setCustomDesign({ ...customDesign, radius: `${e.target.value}rem` })}
                    className="w-full accent-accent-main"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-text-main">Интенсивность теней</span>
                    <span className="text-xs font-bold text-accent-main">{customDesign.shadowIntensity}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="0.5" 
                    step="0.01"
                    value={parseFloat(customDesign.shadowIntensity)}
                    onChange={(e) => setCustomDesign({ ...customDesign, shadowIntensity: e.target.value })}
                    className="w-full accent-accent-main"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-text-main">Толщина границ</span>
                    <span className="text-xs font-bold text-accent-main">{customDesign.borderWidth}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="5" 
                    step="1"
                    value={parseInt(customDesign.borderWidth)}
                    onChange={(e) => setCustomDesign({ ...customDesign, borderWidth: `${e.target.value}px` })}
                    className="w-full accent-accent-main"
                  />
                </div>
              </div>
            </section>

            {/* Typography Section */}
            <section>
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Типографика</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'inherit', name: 'Стандарт', font: 'inherit' },
                  { id: 'serif', name: 'Сериф', font: 'serif' },
                  { id: 'mono', name: 'Моно', font: 'monospace' },
                  { id: 'cursive', name: 'Курсив', font: 'cursive' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCustomDesign({ ...customDesign, font: f.font })}
                    className={`p-3 rounded-2xl border text-left transition-all ${customDesign.font === f.font ? 'border-accent-main ring-1 ring-accent-main' : 'border-border-main'}`}
                  >
                    <span className="text-sm font-bold block mb-1" style={{ fontFamily: f.font }}>Аа Бб</span>
                    <span className="text-xs text-text-muted">{f.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Header Style Section */}
            <section>
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Стиль шапки</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'standard', name: 'Стандарт' },
                  { id: 'glass', name: 'Стекло' },
                  { id: 'minimal', name: 'Минимал' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCustomDesign({ ...customDesign, headerStyle: s.id })}
                    className={`p-3 rounded-2xl border text-center transition-all ${customDesign.headerStyle === s.id ? 'border-accent-main ring-1 ring-accent-main' : 'border-border-main'}`}
                  >
                    <span className="text-xs font-bold text-text-main">{s.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Nav Style Section */}
            <section>
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Стиль навигации</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'standard', name: 'Стандарт' },
                  { id: 'floating', name: 'Плавающая' },
                  { id: 'minimal', name: 'Минимал' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCustomDesign({ ...customDesign, navStyle: s.id })}
                    className={`p-3 rounded-2xl border text-center transition-all ${customDesign.navStyle === s.id ? 'border-accent-main ring-1 ring-accent-main' : 'border-border-main'}`}
                  >
                    <span className="text-xs font-bold text-text-main">{s.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Presets */}
            <section>
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Готовые глифы</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'Cyber', bg: '#000', accent: '#0f0', radius: '0rem' },
                  { name: 'Soft', bg: '#fff', accent: '#f87171', radius: '2.5rem' },
                  { name: 'Paper', bg: '#f4f4f0', accent: '#444', radius: '0.2rem' },
                ].map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setCustomDesign({
                      ...customDesign,
                      bgMain: p.bg,
                      bgCard: p.bg === '#fff' ? '#f9f9f9' : '#111',
                      accentMain: p.accent,
                      radius: p.radius,
                      textMain: p.bg === '#fff' ? '#000' : '#fff',
                      textMuted: p.bg === '#fff' ? '#666' : '#aaa',
                      borderMain: p.bg === '#fff' ? '#eee' : '#222',
                    })}
                    className="p-3 rounded-2xl border border-border-main hover:border-accent-main transition-all text-center"
                  >
                    <div className="w-8 h-8 mx-auto rounded-full mb-2" style={{ backgroundColor: p.accent }}></div>
                    <span className="text-xs font-bold text-text-main">{p.name}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      <div className="bg-bg-card rounded-3xl p-6 border border-border-main shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-text-main">О приложении</h3>
        <p className="text-sm text-text-muted mb-4">
          Приложение автоматически загружает расписание с сайта колледжа и представляет его в удобном виде.
        </p>
        <div className="text-xs text-text-muted opacity-70">
          Версия 1.0.0
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto h-[100dvh] sm:h-[850px] bg-bg-main flex flex-col relative overflow-hidden sm:rounded-[3rem] sm:border-[12px] border-accent-main sm:shadow-2xl transition-colors duration-300">
      
      {/* Fake Notch for Desktop */}
      <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-accent-main rounded-b-3xl z-50"></div>

      {/* Header */}
      <header className={`px-6 pt-12 sm:pt-14 pb-4 z-10 relative transition-all duration-300 ${
        theme === 'custom' && customDesign.headerStyle === 'glass' 
          ? 'bg-bg-main/70 backdrop-blur-md border-b border-border-main' 
          : theme === 'custom' && customDesign.headerStyle === 'minimal'
          ? 'bg-transparent pt-8'
          : 'bg-bg-main'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">
              {activeTab === 'home' && 'Главная'}
              {activeTab === 'schedule' && (viewingEntity ? viewingEntity : 'Расписание')}
              {activeTab === 'search' && (role === 'student' ? 'Преподаватели' : 'Группы')}
              {activeTab === 'profile' && 'Настройки'}
            </h1>
            {activeTab === 'schedule' && viewingEntity && (
              <button onClick={() => setViewingEntity(null)} className="text-xs text-blue-600 font-medium mt-1">
                Вернуться к своему расписанию
              </button>
            )}
          </div>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (showNotifications) {
                setNotifications(notifications.map(n => ({ ...n, read: true })));
              }
            }}
            className="relative p-2.5 bg-bg-card rounded-full shadow-sm border border-border-main"
          >
            <Bell size={20} className="text-text-main" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-bg-card"></span>
            )}
          </button>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute top-24 right-6 w-72 bg-bg-card border border-border-main rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="p-4 border-b border-border-main flex justify-between items-center bg-bg-main">
            <h3 className="font-bold text-text-main">Уведомления</h3>
            {notifications.length > 0 && (
              <button 
                onClick={() => setNotifications([])}
                className="text-xs text-text-muted hover:text-text-main"
              >
                Очистить
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto hide-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-sm">
                Нет новых уведомлений
              </div>
            ) : (
              <div className="divide-y divide-border-main">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                    <p className="text-sm text-text-main font-medium">{notif.message}</p>
                    <p className="text-xs text-text-muted mt-1">{notif.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showNewScheduleToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-accent-main text-accent-text px-4 py-3 rounded-2xl shadow-lg z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Bell size={18} />
          <span className="text-sm font-medium">Расписание обновлено!</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pb-28 hide-scrollbar bg-bg-main relative transition-colors duration-300">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-accent-main" />
            <p className="text-sm font-medium">Загрузка данных...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 px-6 text-center">
            <p className="font-bold mb-2">Ошибка</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={fetchSchedule}
              className="mt-4 px-4 py-2 bg-accent-main text-accent-text rounded-xl text-sm font-medium"
            >
              Попробовать снова
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'home' && renderHome()}
            {activeTab === 'schedule' && renderSchedule()}
            {activeTab === 'search' && renderSearch()}
            {activeTab === 'profile' && renderProfile()}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className={`absolute left-0 right-0 z-20 transition-all duration-300 ${
        theme === 'custom' && customDesign.navStyle === 'floating'
          ? 'bottom-6 mx-6 rounded-3xl border border-border-main bg-nav-bg backdrop-blur-xl shadow-lg pt-3 pb-3 px-4'
          : theme === 'custom' && customDesign.navStyle === 'minimal'
          ? 'bottom-0 pt-2 pb-4 px-6 bg-transparent'
          : 'bottom-0 bg-nav-bg backdrop-blur-xl border-t border-border-main pt-3 pb-6 sm:pb-8 px-6'
      }`}>
        <div className="flex justify-between items-center">
          <NavItem icon={<Home size={24} />} label="Главная" active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setViewingEntity(null); }} />
          <NavItem icon={<CalendarIcon size={24} />} label="Расписание" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
          <NavItem icon={<Search size={24} />} label={role === 'student' ? 'Учителя' : 'Группы'} active={activeTab === 'search'} onClick={() => { setActiveTab('search'); setViewingEntity(null); }} />
          <NavItem icon={<Settings size={24} />} label="Профиль" active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setViewingEntity(null); }} />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 gap-1.5 transition-colors ${
        active ? 'text-text-main' : 'text-text-muted hover:text-text-main'
      }`}
    >
      <div className={`relative p-1.5 rounded-xl transition-all ${active ? '' : 'bg-transparent'}`}>
        {icon}
        {active && (
          <motion.div 
            layoutId="nav-indicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-main rounded-full"
          />
        )}
      </div>
      <span className={`text-[10px] font-semibold ${active ? 'text-text-main' : 'text-text-muted'}`}>{label}</span>
    </button>
  );
}
