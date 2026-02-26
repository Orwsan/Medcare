import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  User, 
  Calendar, 
  Stethoscope, 
  Pill, 
  AlertCircle, 
  LogOut, 
  Plus, 
  ChevronRight,
  Clock,
  Heart,
  Settings,
  Search,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  MessageSquare,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Types ---
interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: number;
}

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  experience: number;
}

interface Appointment {
  id: number;
  doctor_name: string;
  doctor_specialty: string;
  date: string;
  notes: string;
}

interface Med {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
}

interface Symptom {
  id: number;
  description: string;
  severity: string;
  date: string;
}

// --- Components ---

const Layout = ({ children, user, onLogout }: { children: React.ReactNode, user: User | null, onLogout: () => void }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Heart className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">MedCare</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 p-6 flex flex-col z-50 transition-transform duration-300 md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex items-center gap-2 mb-8 px-2">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Heart className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">MedCare</span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink to="/" icon={<Activity size={20} />} label="Asosiy" onClick={closeMenu} />
          <NavLink to="/doctors" icon={<Stethoscope size={20} />} label="Shifokorlar" onClick={closeMenu} />
          <NavLink to="/appointments" icon={<Calendar size={20} />} label="Qabullar" onClick={closeMenu} />
          <NavLink to="/meds" icon={<Pill size={20} />} label="Dorilar" onClick={closeMenu} />
          <NavLink to="/symptoms" icon={<AlertCircle size={20} />} label="Simptomlar" onClick={closeMenu} />
          <NavLink to="/ai-check" icon={<Sparkles size={20} />} label="AI Tashxis" onClick={closeMenu} />
          {user.is_admin === 1 && (
            <NavLink to="/admin" icon={<Shield size={20} />} label="Admin Panel" onClick={closeMenu} />
          )}
          <NavLink to="/profile" icon={<Settings size={20} />} label="Profil" onClick={closeMenu} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
              <User size={16} className="text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => { onLogout(); closeMenu(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

const NavLink = ({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick?: () => void }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all group"
  >
    <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">{icon}</span>
    {label}
  </Link>
);

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
              <Sparkles size={16} />
              <span>AI bilan quvvatlangan sog'liqni saqlash</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-tight mb-6">
              Sizning <span className="text-indigo-600">Sog'lig'ingiz</span> Bizning Mas'uliyatimiz
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
              MedCare - bu shifokorlar bilan uchrashuvlar, dori-darmonlar va simptomlarni boshqarish uchun eng zamonaviy platforma.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/login" className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2">
                Boshlash <ArrowRight size={20} />
              </Link>
              <a href="#features" className="px-8 py-4 bg-slate-50 text-slate-700 font-bold rounded-2xl hover:bg-slate-100 transition-all">
                Batafsil ma'lumot
              </a>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50" />
            <img 
              src="https://picsum.photos/seed/medical/800/600" 
              alt="Medical Care" 
              className="rounded-3xl shadow-2xl relative z-10 border border-slate-100"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Nega MedCare?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Biz sog'liqni saqlashni oson va hamma uchun ochiq qilishni maqsad qilganmiz.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="text-indigo-600" />}
              title="Xavfsiz Ma'lumotlar"
              desc="Sizning barcha tibbiy ma'lumotlaringiz shifrlangan holda saqlanadi."
            />
            <FeatureCard 
              icon={<Zap className="text-blue-600" />}
              title="Tezkor AI Tashxis"
              desc="Simptomlaringizni AI orqali tahlil qiling va tavsiyalar oling."
            />
            <FeatureCard 
              icon={<User className="text-purple-600" />}
              title="Malakali Shifokorlar"
              desc="Eng yaxshi mutaxassislar bilan onlayn uchrashuvlarni rejalashtiring."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const Profile = ({ user, onUpdate }: { user: User, onUpdate: (user: User) => void }) => {
  const [email, setEmail] = useState(user.email);
  const [fullName, setFullName] = useState(user.full_name);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, email, fullName, password: password || undefined })
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data);
        setMessage('Profil muvaffaqiyatli yangilandi!');
        setPassword('');
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage('Xatolik yuz berdi');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Profil sozlamalari</h1>
        <p className="text-slate-500 mt-1">Shaxsiy ma'lumotlaringizni boshqaring</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <form onSubmit={handleUpdate} className="space-y-6">
                <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <User size={40} className="text-slate-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To'liq ism</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yangi parol (ixtiyoriy)</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="O'zgartirish uchun yozing..."
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('muvaffaqiyatli') ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
          </button>
        </form>
      </div>
    </div>
  );
};

const AICheck = () => {
  const [query, setQuery] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('O\'rtacha');
  const [otherSymptoms, setOtherSymptoms] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Siz professional tibbiy yordamchisiz. Foydalanuvchi quyidagi ma'lumotlarni taqdim etdi:
        - Asosiy simptom: "${query}"
        - Davomiyligi: "${duration}"
        - Og'irlik darajasi: "${severity}"
        - Qo'shimcha belgilar: "${otherSymptoms}"

        Iltimos, ushbu ma'lumotlarni chuqur tahlil qiling va:
        1. Mumkin bo'lgan sabablarni (ehtimollik darajasi bilan) sanab o'ting.
        2. Qaysi mutaxassis shifokorga (masalan: kardiolog, nevropatolog va h.k.) murojaat qilish kerakligini aniq ayting.
        3. Uy sharoitida ko'rilishi mumkin bo'lgan ehtiyot choralarini ayting.
        4. Qachon zudlik bilan tez yordam chaqirish kerakligini (qizil bayroqchalar) ko'rsating.
        5. MUHIM: Bu sun'iy intellekt tahlili ekanligini, rasmiy tashxis emasligini va shifokor ko'rigi shartligini qat'iy eslatib o'ting.

        Javobni o'zbek tilida, professional va tushunarli formatda, Markdown ko'rinishida bering.`,
      });
      setResult(response.text || 'Xatolik yuz berdi');
    } catch (err) {
      setResult('AI bilan bog\'lanishda xatolik yuz berdi.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Sparkles className="text-indigo-500" />
          AI Simptom Tahlili
        </h1>
        <p className="text-slate-500 mt-1">Sun'iy intellekt yordamida sog'lig'ingizni chuqur tahlil qiling</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-8">
        <form onSubmit={handleAnalyze} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Asosiy simptomlaringiz</label>
            <textarea 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none text-lg"
              placeholder="Masalan: bosh og'rig'i, qorin sanchishi..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Qancha vaqtdan beri? (Davomiyligi)</label>
              <input 
                type="text"
                className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Masalan: 2 kundan beri, 1 haftadan beri..."
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Og'irlik darajasi</label>
              <select 
                className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                value={severity}
                onChange={e => setSeverity(e.target.value)}
              >
                <option value="Past">Past (yengil bezovtalik)</option>
                <option value="O'rtacha">O'rtacha (kundalik ishlarga xalaqit beryapti)</option>
                <option value="Yuqori">Yuqori (chidab bo'lmas darajada)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Boshqa belgilar yoki surunkali kasalliklar</label>
            <input 
              type="text"
              className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Masalan: isitma bor, qon bosimi yuqori..."
              value={otherSymptoms}
              onChange={e => setOtherSymptoms(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Tahlil qilinmoqda...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                AI Tahlilni boshlash
              </>
            )}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 rounded-3xl border border-indigo-100 p-8"
          >
            <div className="flex items-center gap-2 text-indigo-700 font-bold mb-4">
              <MessageSquare size={20} />
              AI Tavsiyasi
            </div>
            <div className="prose prose-indigo max-w-none text-indigo-900 whitespace-pre-wrap leading-relaxed">
              <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminPanel = ({ user }: { user: User }) => {
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [newDoctor, setNewDoctor] = useState({ name: '', specialty: '', phone: '', experience: 0 });

  useEffect(() => {
    if (user.is_admin !== 1) return;
    fetch('/api/admin/stats').then(r => r.json()).then(setStats);
    fetch('/api/admin/appointments').then(r => r.json()).then(setAppointments);
    fetch('/api/doctors').then(r => r.json()).then(setDoctors);
  }, [user.is_admin]);

  if (user.is_admin !== 1) {
    return <Navigate to="/" />;
  }

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDoctor)
    });
    if (res.ok) {
      const data = await res.json();
      setDoctors([...doctors, { ...newDoctor, id: data.id }]);
      setNewDoctor({ name: '', specialty: '', phone: '', experience: 0 });
    }
  };

  const handleDeleteDoctor = async (id: number) => {
    const res = await fetch(`/api/admin/doctors/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDoctors(doctors.filter(d => d.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-500 mt-1">Tizimni boshqarish va statistika</p>
      </header>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={<User className="text-indigo-600" />} label="Foydalanuvchilar" value={stats.users} color="bg-indigo-50" />
          <StatCard icon={<Calendar className="text-purple-600" />} label="Barcha qabullar" value={stats.appointments} color="bg-purple-50" />
          <StatCard icon={<Stethoscope className="text-blue-600" />} label="Shifokorlar" value={stats.doctors} color="bg-blue-50" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Yangi shifokor qo'shish</h2>
          <form onSubmit={handleAddDoctor} className="space-y-4">
            <input 
              type="text" placeholder="Ism sharifi" required 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})}
            />
            <input 
              type="text" placeholder="Mutaxassisligi" required 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={newDoctor.specialty} onChange={e => setNewDoctor({...newDoctor, specialty: e.target.value})}
            />
            <input 
              type="text" placeholder="Telefon" required 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={newDoctor.phone} onChange={e => setNewDoctor({...newDoctor, phone: e.target.value})}
            />
            <input 
              type="number" placeholder="Tajriba (yil)" required 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={newDoctor.experience} onChange={e => setNewDoctor({...newDoctor, experience: Number(e.target.value)})}
            />
            <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
              Qo'shish
            </button>
          </form>
        </section>

        <section className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Shifokorlar ro'yxati</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 -mr-2">
            {doctors.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{doc.name}</p>
                  <p className="text-xs text-slate-500 truncate">{doc.specialty}</p>
                </div>
                <button 
                  onClick={() => handleDeleteDoctor(doc.id)} 
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0 transition-colors"
                  title="O'chirish"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Oxirgi qabullar</h2>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle px-4 md:px-0">
            <table className="min-w-[600px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 font-semibold text-slate-500">Bemor</th>
                  <th className="pb-3 font-semibold text-slate-500">Shifokor</th>
                  <th className="pb-3 font-semibold text-slate-500">Sana</th>
                  <th className="pb-3 font-semibold text-slate-500">Eslatma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {appointments.map(app => (
                  <tr key={app.id}>
                    <td className="py-3">
                      <p className="font-medium text-slate-900">{app.user_name}</p>
                      <p className="text-xs text-slate-400">{app.user_email}</p>
                    </td>
                    <td className="py-3 text-slate-600">{app.doctor_name}</td>
                    <td className="py-3 text-slate-600">{new Date(app.date).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="py-3 text-slate-400 italic max-w-[200px] truncate">{app.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

const Login = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { email, password, fullName } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data);
        // Navigation will be handled by the App component's routing logic
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Xatolik yuz berdi');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
            <Heart className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">MedCare</h1>
          <p className="text-slate-500 text-sm mt-1">Sog'lig'ingiz bizning ustuvor vazifamiz</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To'liq ism</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parol</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
            {isRegister ? "Ro'yxatdan o'tish" : "Kirish"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-indigo-600 hover:underline font-medium block w-full"
          >
            {isRegister ? "Hisobingiz bormi? Kirish" : "Hisobingiz yo'qmi? Ro'yxatdan o'tish"}
          </button>
          {!isRegister && (
            <p className="text-[10px] text-slate-400">
              Admin: admin@medcare.uz / admin123
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ user }: { user: User }) => {
  const [stats, setStats] = useState({ appointments: 0, meds: 0, symptoms: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const [appts, meds, symps] = await Promise.all([
        fetch(`/api/appointments/${user.id}`).then(r => r.json()),
        fetch(`/api/meds/${user.id}`).then(r => r.json()),
        fetch(`/api/symptoms/${user.id}`).then(r => r.json())
      ]);
      setStats({
        appointments: appts.length,
        meds: meds.length,
        symptoms: symps.length
      });
    };
    fetchData();
  }, [user.id]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Salom, {user.full_name}!</h1>
        <p className="text-slate-500 mt-1">Bugungi sog'liq holatingiz qanday?</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Calendar className="text-blue-600" />} 
          label="Qabullar" 
          value={stats.appointments} 
          color="bg-blue-50" 
        />
        <StatCard 
          icon={<Pill className="text-purple-600" />} 
          label="Dorilar" 
          value={stats.meds} 
          color="bg-purple-50" 
        />
        <StatCard 
          icon={<AlertCircle className="text-orange-600" />} 
          label="Simptomlar" 
          value={stats.symptoms} 
          color="bg-orange-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Tezkor harakatlar</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ActionButton to="/doctors" label="Shifokor topish" icon={<Stethoscope size={20} />} />
            <ActionButton to="/symptoms" label="Simptom qo'shish" icon={<Plus size={20} />} />
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Sog'liqni saqlash bo'yicha maslahat</h2>
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-indigo-800 text-sm leading-relaxed">
              "Kuniga kamida 2 litr suv ichishni unutmang. Bu sizning metabolizmingizni yaxshilaydi va energiyangizni oshiradi."
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const ActionButton = ({ to, label, icon }: { to: string, label: string, icon: React.ReactNode }) => (
  <Link to={to} className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all group">
    <div className="mb-3 text-slate-400 group-hover:text-indigo-500 transition-colors">
      {icon}
    </div>
    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{label}</span>
  </Link>
);

const Doctors = ({ user }: { user: User }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);
  
  // AI Search
  const [searchQuery, setSearchQuery] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetch('/api/doctors').then(r => r.json()).then(setDoctors);
  }, []);

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const docList = doctors.map(d => `${d.name} (${d.specialty})`).join(', ');
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Menda quyidagi shifokorlar ro'yxati bor: ${docList}. 
        Foydalanuvchi muammosi: "${searchQuery}". 
        Iltimos, ushbu ro'yxatdan qaysi shifokor eng mos kelishini ayting va nima uchunligini qisqacha tushuntiring. 
        Agar hech biri mos kelmasa, qanday mutaxassis kerakligini ayting.
        Javobni o'zbek tilida bering.`,
      });
      setAiRecommendation(response.text || null);
    } catch (err) {
      setAiRecommendation('AI qidiruvda xatolik yuz berdi.');
    }
    setSearching(false);
  };

  const handleBook = async () => {
    if (!selectedDoctor) return;

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, doctorId: selectedDoctor.id, date, notes })
    });

    if (res.ok) {
      setSuccess(true);
      setConfirming(false);
      setTimeout(() => {
        setSuccess(false);
        setSelectedDoctor(null);
        setDate('');
        setNotes('');
      }, 2000);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Shifokorlar</h1>
        <p className="text-slate-500 mt-1">Mutaxassislardan maslahat oling</p>
      </header>

      {/* AI Search Bar */}
      <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="text-indigo-500" size={20} />
          AI Shifokor Qidiruvi
        </h2>
        <form onSubmit={handleAISearch} className="flex gap-3">
          <input 
            type="text"
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Muammoingizni yozing (masalan: yuragim sanchyapti)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button 
            disabled={searching}
            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? 'Qidirilmoqda...' : <><Search size={18} /> Qidirish</>}
          </button>
        </form>
        {aiRecommendation && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-800"
          >
            <p className="font-bold mb-1">AI Tavsiyasi:</p>
            {aiRecommendation}
          </motion.div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map(doc => (
          <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                <User className="text-slate-400" />
              </div>
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg">
                {doc.experience} yil tajriba
              </span>
            </div>
            <h3 className="font-bold text-slate-900">{doc.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{doc.specialty}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
              <Clock size={14} />
              <span>Dush - Juma, 09:00 - 17:00</span>
            </div>
            <button 
              onClick={() => setSelectedDoctor(doc)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Qabulga yozilish
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedDoctor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {confirming ? "Ma'lumotlarni tasdiqlang" : `${selectedDoctor.name} bilan uchrashuv`}
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                {confirming ? "Iltimos, uchrashuv tafsilotlarini tekshiring" : selectedDoctor.specialty}
              </p>

              {success ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="text-indigo-600 w-8 h-8" />
                  </div>
                  <p className="text-indigo-800 font-bold">Muvaffaqiyatli yozildingiz!</p>
                </div>
              ) : confirming ? (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Shifokor:</span>
                      <span className="font-bold text-slate-900">{selectedDoctor.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Sana va vaqt:</span>
                      <span className="font-bold text-slate-900">{new Date(date).toLocaleString('uz-UZ')}</span>
                    </div>
                    {notes && (
                      <div className="text-sm">
                        <span className="text-slate-500 block mb-1">Eslatma:</span>
                        <p className="text-slate-900 italic bg-white p-2 rounded border border-slate-100">{notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setConfirming(false)}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50"
                    >
                      Tahrirlash
                    </button>
                    <button 
                      onClick={handleBook}
                      className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    >
                      Yakunlash
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setConfirming(true); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sana va vaqt</label>
                    <input 
                      type="datetime-local" 
                      required 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Eslatma</label>
                    <textarea 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                      placeholder="Shikoyatlaringizni yozing..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setSelectedDoctor(null)}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50"
                    >
                      Bekor qilish
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700"
                    >
                      Tasdiqlash
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Appointments = ({ user }: { user: User }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetch(`/api/appointments/${user.id}`).then(r => r.json()).then(setAppointments);
  }, [user.id]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Mening qabullarim</h1>
        <p className="text-slate-500 mt-1">Rejalashtirilgan uchrashuvlar ro'yxati</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {appointments.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {appointments.map(appt => (
              <div key={appt.id} className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                  <Calendar size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{appt.doctor_name}</h3>
                  <p className="text-sm text-slate-500 truncate">{appt.doctor_specialty}</p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 text-right w-full sm:w-auto">
                  <p className="font-bold text-slate-900">{new Date(appt.date).toLocaleDateString('uz-UZ')}</p>
                  <p className="text-sm text-slate-500">{new Date(appt.date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <ChevronRight className="hidden sm:block text-slate-300" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="mx-auto text-slate-200 w-12 h-12 mb-4" />
            <p className="text-slate-500">Hozircha qabullar yo'q</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Meds = ({ user }: { user: User }) => {
  const [meds, setMeds] = useState<Med[]>([]);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`/api/meds/${user.id}`).then(r => r.json()).then(setMeds);
  }, [user.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/meds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, name, dosage, frequency })
    });
    if (res.ok) {
      const data = await res.json();
      setMeds([...meds, { id: data.id, name, dosage, frequency }]);
      setName(''); setDosage(''); setFrequency(''); setShowForm(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dorilar</h1>
          <p className="text-slate-500 mt-1">Dori-darmonlarni qabul qilish jadvali</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Yangi dori</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meds.map(med => (
          <div key={med.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-4">
              <Pill size={20} />
            </div>
            <h3 className="font-bold text-slate-900">{med.name}</h3>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Dozasi:</span>
                <span className="font-medium text-slate-900">{med.dosage}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Chastotasi:</span>
                <span className="font-medium text-slate-900">{med.frequency}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Yangi dori qo'shish</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dori nomi</label>
                  <input 
                    type="text" required 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={name} onChange={e => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dozasi (masalan: 1 tabletka)</label>
                  <input 
                    type="text" required 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={dosage} onChange={e => setDosage(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chastotasi (masalan: kuniga 3 marta)</label>
                  <input 
                    type="text" required 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={frequency} onChange={e => setFrequency(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50"
                  >
                    Bekor qilish
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700"
                  >
                    Qo'shish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Symptoms = ({ user }: { user: User }) => {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('O\'rtacha');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`/api/symptoms/${user.id}`).then(r => r.json()).then(setSymptoms);
  }, [user.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const date = new Date().toISOString();
    const res = await fetch('/api/symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, description, severity, date })
    });
    if (res.ok) {
      const data = await res.json();
      setSymptoms([{ id: data.id, description, severity, date }, ...symptoms]);
      setDescription(''); setShowForm(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Simptomlar</h1>
          <p className="text-slate-500 mt-1">Sog'lig'ingizdagi o'zgarishlarni kuzatib boring</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Yangi simptom</span>
        </button>
      </header>

      <div className="space-y-4">
        {symptoms.map(symp => (
          <div key={symp.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              symp.severity === 'Yuqori' ? 'bg-red-50 text-red-600' : 
              symp.severity === 'O\'rtacha' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
            }`}>
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {new Date(symp.date).toLocaleDateString('uz-UZ')}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  symp.severity === 'Yuqori' ? 'bg-red-100 text-red-700' : 
                  symp.severity === 'O\'rtacha' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {symp.severity}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">{symp.description}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Simptom qo'shish</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tavsif</label>
                  <textarea 
                    required 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 h-32 resize-none"
                    placeholder="O'zingizni qanday his qilyapsiz?"
                    value={description} onChange={e => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Og'irlik darajasi</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                    value={severity} onChange={e => setSeverity(e.target.value)}
                  >
                    <option value="Past">Past</option>
                    <option value="O'rtacha">O'rtacha</option>
                    <option value="Yuqori">Yuqori</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50"
                  >
                    Bekor qilish
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700"
                  >
                    Saqlash
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('medcare_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('medcare_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('medcare_user');
  };

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/home" element={<Home />} />
          {!user ? (
            <>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/home" />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<Navigate to={user.is_admin === 1 ? "/admin" : "/"} />} />
              <Route path="/" element={user.is_admin === 1 ? <Navigate to="/admin" /> : <Dashboard user={user} />} />
              <Route path="/doctors" element={<Doctors user={user} />} />
              <Route path="/appointments" element={<Appointments user={user} />} />
              <Route path="/meds" element={<Meds user={user} />} />
              <Route path="/symptoms" element={<Symptoms user={user} />} />
              <Route path="/ai-check" element={<AICheck />} />
              {user.is_admin === 1 && <Route path="/admin" element={<AdminPanel user={user} />} />}
              <Route path="/profile" element={<Profile user={user} onUpdate={handleLogin} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
