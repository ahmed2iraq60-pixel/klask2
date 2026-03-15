/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Phone, 
  MapPin, 
  Clock, 
  Instagram, 
  Facebook,
  ChevronRight,
  MonitorSmartphone,
  Wrench,
  Lock,
  Settings,
  Plus,
  Trash2,
  Edit,
  Save,
  LogOut,
  BookOpen,
  Code,
  Layers,
  FileText,
  User,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  getDoc,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

// --- Types ---
interface SiteConfig {
  username: string;
  workingHours: string;
  location: string;
  adminPassword: string;
  trainerName: string;
  trainerImage: string;
  heroImage: string;
}

interface Course {
  id?: string;
  number: string;
  price: number;
  discount: number;
  telegramLink: string;
  location: string;
  imageUrl: string;
}

interface Post {
  id?: string;
  number: string;
  location: string;
  price: number;
  discount: number;
  note: string;
  imageUrl: string;
}

interface Software {
  id?: string;
  deviceName: string;
  service: string;
  price: number;
  location: string;
}

interface Screen {
  id?: string;
  name: string;
  price: number;
  discount: number;
  number: string;
  location: string;
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loginPassword, setLoginPassword] = useState('');
  
  // Data State
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    username: 'كلاسك فون',
    workingHours: 'السبت - الخميس: 10:00 ص - 10:00 م',
    location: 'ديالى بعقوبة حي المعلمين اقرب نقطه داله قرب شارع مطعم الاوان قرب ريزو طشه',
    adminPassword: 'ahmed_1990st',
    trainerName: 'أحمد النعيمي',
    trainerImage: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    heroImage: 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?auto=format&fit=crop&q=80&w=800'
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [software, setSoftware] = useState<Software[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);

  // Auth & Data Fetching
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // Listeners
    const unsubConfig = onSnapshot(doc(db, 'config', 'site'), (doc) => {
      if (doc.exists()) setSiteConfig(doc.data() as SiteConfig);
    });

    const unsubCourses = onSnapshot(collection(db, 'courses'), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
    });

    const unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });

    const unsubSoftware = onSnapshot(collection(db, 'software'), (snap) => {
      setSoftware(snap.docs.map(d => ({ id: d.id, ...d.data() } as Software)));
    });

    const unsubScreens = onSnapshot(collection(db, 'screens'), (snap) => {
      setScreens(snap.docs.map(d => ({ id: d.id, ...d.data() } as Screen)));
    });

    return () => {
      unsubConfig();
      unsubCourses();
      unsubPosts();
      unsubSoftware();
      unsubScreens();
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
    } else {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const handleFirestoreError = (error: any, operation: string, path: string) => {
    const errInfo = {
      error: error?.message || String(error),
      operation,
      path,
      auth: {
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        verified: auth.currentUser?.emailVerified
      }
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
  };

  const handleLogin = () => {
    if (loginPassword === siteConfig.adminPassword) {
      setIsLoggedIn(true);
    } else {
      alert('كلمة المرور غير صحيحة');
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      alert('فشل تسجيل الدخول بجوجل');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
  };

  // --- Admin Actions ---
  const updateSiteConfig = async (newConfig: Partial<SiteConfig>) => {
    try {
      await setDoc(doc(db, 'config', 'site'), { ...siteConfig, ...newConfig }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'write', 'config/site');
    }
  };

  const addItem = async (col: string, item: any) => {
    try {
      await addDoc(collection(db, col), item);
    } catch (error) {
      handleFirestoreError(error, 'create', col);
    }
  };

  const deleteItem = async (col: string, id: string) => {
    try {
      await deleteDoc(doc(db, col, id));
    } catch (error) {
      handleFirestoreError(error, 'delete', `${col}/${id}`);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 overflow-x-hidden ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`} dir="rtl">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-gold/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gold-bg-gradient flex items-center justify-center shadow-lg shadow-gold/20">
              <Smartphone className="text-black w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-serif tracking-tight">
              <span className="gold-gradient">CLASSIC</span> PHONE
            </h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="hover:text-gold transition-colors font-medium">الرئيسية</a>
            <a href="#services" className="hover:text-gold transition-colors font-medium">خدماتنا</a>
            <a href="#courses" className="hover:text-gold transition-colors font-medium">الدورات</a>
            <a href="#trainer" className="hover:text-gold transition-colors font-medium">المدرب</a>
            <a href="#contact" className="hover:text-gold transition-colors font-medium">اتصل بنا</a>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gold/10 transition-all border border-gold/30"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5 text-gold" />}
            </button>
          </div>

          {/* Mobile Toggle */}
          <div className="flex md:hidden items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full border border-gold/30">
              {isDarkMode ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5 text-gold" />}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gold">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-gold font-medium mb-4 tracking-widest uppercase text-sm">مكتب {siteConfig.username}</h2>
              <h1 className="text-5xl md:text-7xl font-bold font-serif leading-tight mb-6">
                صيانة الهواتف <br /> 
                <span className="gold-gradient">بلمسة احترافية</span>
              </h1>
              <p className="text-xl opacity-70 mb-10 max-w-lg leading-relaxed">
                نحن في {siteConfig.username} نقدم أفضل حلول الصيانة للهواتف الذكية، من تبديل الشاشات الأصلية إلى حل أعقد مشاكل الآيسيات وتخطي الآيكلود.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="px-8 py-4 rounded-full gold-bg-gradient text-black font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-gold/20">
                  احجز موعد صيانة
                </button>
                <a href="#gallery" className="px-8 py-4 rounded-full border border-gold/50 text-gold font-bold text-lg hover:bg-gold/10 transition-all">
                  أكثر من صورة
                </a>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative">
              <div className="relative z-10 rounded-3xl overflow-hidden border border-gold/30 shadow-2xl shadow-gold/10">
                {siteConfig.heroImage && (
                  <img src={siteConfig.heroImage} alt="Repair" className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-gold font-medium mb-2 tracking-widest uppercase">معرض الصور</h2>
            <h3 className="text-4xl font-bold font-serif">لقطات من أعمالنا</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?auto=format&fit=crop&q=80&w=400",
              "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=400",
              "https://images.unsplash.com/photo-1556656793-062ff9878258?auto=format&fit=crop&q=80&w=400",
              "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=400",
              "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=400",
              "https://images.unsplash.com/photo-1591405351990-4726e331f141?auto=format&fit=crop&q=80&w=400",
              "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=400",
              "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&q=80&w=400"
            ].map((img, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.05 }}
                className="aspect-square rounded-2xl overflow-hidden border border-gold/20"
              >
                <img src={img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-gold font-medium mb-2 tracking-widest uppercase">خدماتنا الاحترافية</h2>
            <h3 className="text-4xl font-bold font-serif">ماذا نقدم لك؟</h3>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Smartphone />, title: "صيانة الهواتف", desc: "صيانة شاملة لجميع أنواع الهواتف الذكية بأحدث المعدات." },
              { icon: <ShieldCheck />, title: "تخطي الآيكلود", desc: "فتح وتخطي حسابات الآيكلود وحسابات جوجل باحترافية." },
              { icon: <MonitorSmartphone />, title: "تبديل الشاشات", desc: "تبديل الشاشات الأصلية (الوكالة) مع الضمان." },
              { icon: <Zap />, title: "آيسيات الشحن", desc: "تبديل آيسيات الشحن والمعالجات بدقة عالية." }
            ].map((service, i) => (
              <motion.div 
                key={i}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 glass-card rounded-3xl border border-gold/20 hover:border-gold transition-colors text-center group"
              >
                <div className="w-16 h-16 rounded-2xl gold-bg-gradient flex items-center justify-center mx-auto mb-6 text-black group-hover:scale-110 transition-transform">
                  {React.cloneElement(service.icon as React.ReactElement, { className: "w-8 h-8" })}
                </div>
                <h4 className="text-xl font-bold mb-4">{service.title}</h4>
                <p className="opacity-60 text-sm leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trainer Section */}
      <section id="trainer" className="py-24 bg-gold/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div whileInView={{ opacity: 1, scale: 1 }} initial={{ opacity: 0, scale: 0.9 }}>
              <div className="relative">
                {siteConfig.trainerImage && (
                  <img src={siteConfig.trainerImage} alt={siteConfig.trainerName} className="rounded-3xl border-4 border-gold shadow-2xl w-full max-w-md mx-auto" referrerPolicy="no-referrer" />
                )}
                <div className="absolute -bottom-6 -right-6 glass-card p-4 rounded-xl border border-gold/50">
                  <p className="font-bold text-gold text-xl">{siteConfig.trainerName}</p>
                  <p className="text-sm opacity-70">مدرب صيانة معتمد</p>
                </div>
              </div>
            </motion.div>
            <div>
              <h2 className="text-gold font-medium mb-2 tracking-widest uppercase">المدرب الرئيسي</h2>
              <h3 className="text-4xl font-bold font-serif mb-6">{siteConfig.trainerName}</h3>
              <p className="text-lg opacity-70 leading-relaxed mb-8">
                خبير في صيانة الهواتف الذكية وتخطي الآيكلود، يقدم دورات تدريبية مكثفة للمبتدئين والمحترفين لتطوير مهاراتهم في سوق العمل.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 glass-card rounded-xl border border-gold/20">
                  <h4 className="font-bold text-gold mb-1">خبرة واسعة</h4>
                  <p className="text-xs opacity-60">أكثر من 10 سنوات في المجال</p>
                </div>
                <div className="p-4 glass-card rounded-xl border border-gold/20">
                  <h4 className="font-bold text-gold mb-1">تدريب عملي</h4>
                  <p className="text-xs opacity-60">تطبيق مباشر على أجهزة حقيقية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-gold font-medium mb-2 tracking-widest uppercase">الدورات التدريبية</h2>
            <h3 className="text-4xl font-bold font-serif">طور مهاراتك معنا</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {courses.map(course => (
              <motion.div key={course.id} className="glass-card rounded-2xl overflow-hidden border border-gold/20 group" whileHover={{ y: -10 }}>
                <div className="h-48 overflow-hidden relative">
                  <img src={course.imageUrl || 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  {course.discount > 0 && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      خصم {course.discount}%
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gold font-bold text-xl">{course.price} د.ع</span>
                    <span className="text-xs opacity-50">{course.location}</span>
                  </div>
                  <p className="text-sm opacity-70 mb-6">رقم التواصل: {course.number}</p>
                  <a href={course.telegramLink} target="_blank" className="block w-full py-3 rounded-xl gold-bg-gradient text-black text-center font-bold">سجل الآن عبر تليجرام</a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Software & Screens Section */}
      <section className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Software */}
            <div>
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-2"><Code className="text-gold" /> خدمات السوفت وير</h3>
              <div className="space-y-4">
                {software.map(s => (
                  <div key={s.id} className="p-4 glass-card rounded-xl border border-gold/10 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{s.deviceName}</h4>
                      <p className="text-xs opacity-50">{s.service}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-gold font-bold">{s.price} د.ع</p>
                      <p className="text-[10px] opacity-40">{s.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Screens */}
            <div>
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-2"><MonitorSmartphone className="text-gold" /> تبديل الشاشات</h3>
              <div className="space-y-4">
                {screens.map(s => (
                  <div key={s.id} className="p-4 glass-card rounded-xl border border-gold/10 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{s.name}</h4>
                      <p className="text-xs opacity-50">رقم: {s.number}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-gold font-bold">{s.price} د.ع</p>
                      {s.discount > 0 && <p className="text-[10px] text-red-500">خصم {s.discount}%</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Posts Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl font-bold mb-12 text-center">آخر المنشورات والعروض</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {posts.map(post => (
              <div key={post.id} className="glass-card rounded-xl overflow-hidden border border-gold/10">
                <img src={post.imageUrl || 'https://images.unsplash.com/photo-1556656793-062ff987b50d?auto=format&fit=crop&q=80&w=400'} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <p className="text-xs opacity-60 mb-2">{post.location}</p>
                  <p className="font-bold text-gold mb-2">{post.price} د.ع</p>
                  <p className="text-xs opacity-80 line-clamp-2">{post.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass-card rounded-3xl overflow-hidden border border-gold/20">
            <div className="grid md:grid-cols-2">
              <div className="p-12 gold-bg-gradient text-black">
                <h3 className="text-3xl font-bold mb-8">معلومات التواصل</h3>
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 mt-1" />
                    <div>
                      <h4 className="font-bold text-lg">موقعنا</h4>
                      <p className="opacity-80">{siteConfig.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="w-6 h-6 mt-1" />
                    <div>
                      <h4 className="font-bold text-lg">اتصل بنا</h4>
                      <p className="opacity-80" dir="ltr">+964 770 058 3840</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 mt-1" />
                    <div>
                      <h4 className="font-bold text-lg">ساعات العمل</h4>
                      <p className="opacity-80">{siteConfig.workingHours}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-12">
                <h3 className="text-3xl font-bold mb-8">أرسل لنا رسالة</h3>
                <form className="space-y-6">
                  <input type="text" placeholder="الاسم" className="w-full bg-transparent border-b border-gold/30 py-2 outline-none" />
                  <input type="text" placeholder="رقم الهاتف" className="w-full bg-transparent border-b border-gold/30 py-2 outline-none" />
                  <textarea placeholder="رسالتك" className="w-full bg-transparent border-b border-gold/30 py-2 outline-none"></textarea>
                  <button className="w-full py-4 rounded-xl gold-bg-gradient text-black font-bold">إرسال</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer & Admin Button */}
      <footer className="py-12 border-t border-gold/10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
          {/* Admin Button - Positioned between Contact Section and Copyright */}
          <button 
            onClick={() => setIsAdminOpen(true)}
            className="p-3 rounded-full border border-gold/20 hover:border-gold transition-all text-gold/40 hover:text-gold group bg-black/20"
            title="لوحة التحكم"
          >
            <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
          </button>

          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-6 mt-4">
            <p className="opacity-50 text-sm">© {new Date().getFullYear()} {siteConfig.username}. جميع الحقوق محفوظة.</p>
            <div className="flex gap-6">
              <a href="#" className="text-gold/50 hover:text-gold transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gold/50 hover:text-gold transition-colors"><Facebook size={20} /></a>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Modal */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-gold/30 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 relative">
              <button onClick={() => { setIsAdminOpen(false); setIsLoggedIn(false); }} className="absolute top-6 left-6 text-white hover:text-gold"><X /></button>
              
              {!isLoggedIn ? (
                <div className="max-w-md mx-auto text-center py-12">
                  <Lock className="w-16 h-16 text-gold mx-auto mb-6" />
                  <h2 className="text-3xl font-bold mb-8">لوحة التحكم</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-black border border-gold/20 rounded-xl">
                      <p className="text-sm opacity-70 mb-4">يجب تسجيل الدخول بجوجل أولاً (للمسؤول فقط)</p>
                      {user ? (
                        <div className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            {user.photoURL && <img src={user.photoURL} className="w-8 h-8 rounded-full" />}
                            <span className="text-sm font-medium">{user.email}</span>
                          </div>
                          <button onClick={handleLogout} className="text-red-500 text-xs hover:underline">خروج</button>
                        </div>
                      ) : (
                        <button 
                          onClick={handleGoogleLogin}
                          className="w-full py-3 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                        >
                          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
                          تسجيل الدخول بجوجل
                        </button>
                      )}
                    </div>

                    {user && (
                      <>
                        <input 
                          type="password" 
                          placeholder="كلمة مرور اللوحة" 
                          className="w-full bg-black border border-gold/30 rounded-xl p-4 outline-none text-center"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                        />
                        <button onClick={handleLogin} className="w-full py-4 rounded-xl gold-bg-gradient text-black font-bold">دخول للوحة</button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <AdminDashboard 
                  siteConfig={siteConfig} 
                  updateSiteConfig={updateSiteConfig}
                  courses={courses}
                  posts={posts}
                  software={software}
                  screens={screens}
                  addItem={addItem}
                  deleteItem={deleteItem}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <a href="https://wa.me/9647700583840" target="_blank" rel="noopener noreferrer" className="fixed bottom-8 left-8 w-16 h-16 rounded-full gold-bg-gradient flex items-center justify-center shadow-2xl shadow-gold/40 z-50 hover:scale-110 transition-transform">
        <Phone className="w-8 h-8 text-black" />
      </a>
    </div>
  );
}

// --- Admin Dashboard Component ---
function AdminDashboard({ siteConfig, updateSiteConfig, courses, posts, software, screens, addItem, deleteItem }: any) {
  const [activeTab, setActiveTab] = useState('config');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // Manual save to ensure everything is synced and provide feedback
      await updateSiteConfig(siteConfig);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setSaveStatus('idle');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 border-b border-gold/10 pb-4">
        <button onClick={() => setActiveTab('config')} className={`px-4 py-2 rounded-lg ${activeTab === 'config' ? 'gold-bg-gradient text-black' : 'text-white'}`}>الإعدادات</button>
        <button onClick={() => setActiveTab('courses')} className={`px-4 py-2 rounded-lg ${activeTab === 'courses' ? 'gold-bg-gradient text-black' : 'text-white'}`}>الدورات</button>
        <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 rounded-lg ${activeTab === 'posts' ? 'gold-bg-gradient text-black' : 'text-white'}`}>المنشورات</button>
        <button onClick={() => setActiveTab('software')} className={`px-4 py-2 rounded-lg ${activeTab === 'software' ? 'gold-bg-gradient text-black' : 'text-white'}`}>السوفت وير</button>
        <button onClick={() => setActiveTab('screens')} className={`px-4 py-2 rounded-lg ${activeTab === 'screens' ? 'gold-bg-gradient text-black' : 'text-white'}`}>الشاشات</button>
        <div className="flex-grow"></div>
        <button 
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`px-6 py-2 rounded-lg text-white font-bold flex items-center gap-2 transition-all duration-300 ${
            saveStatus === 'saved' ? 'bg-green-600' : 'bg-gold hover:bg-gold/80'
          } ${saveStatus === 'saving' ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {saveStatus === 'saving' ? <Loader2 className="animate-spin w-5 h-5" /> : saveStatus === 'saved' ? <CheckCircle size={18} /> : <Save size={18} />}
          {saveStatus === 'saved' ? 'تم الحفظ' : saveStatus === 'saving' ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>

      {activeTab === 'config' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="font-bold text-gold flex items-center gap-2"><Settings size={18} /> معلومات الموقع</h4>
            <div className="space-y-4">
              <input type="text" placeholder="اسم المستخدم" className="w-full bg-black border border-white/10 p-3 rounded-lg" defaultValue={siteConfig.username} onBlur={(e) => updateSiteConfig({ username: e.target.value })} />
              <input type="text" placeholder="ساعات العمل" className="w-full bg-black border border-white/10 p-3 rounded-lg" defaultValue={siteConfig.workingHours} onBlur={(e) => updateSiteConfig({ workingHours: e.target.value })} />
              <textarea placeholder="الموقع" className="w-full bg-black border border-white/10 p-3 rounded-lg" defaultValue={siteConfig.location} onBlur={(e) => updateSiteConfig({ location: e.target.value })} />
              <input type="text" placeholder="كلمة مرور الأدمن" className="w-full bg-black border border-white/10 p-3 rounded-lg" defaultValue={siteConfig.adminPassword} onBlur={(e) => updateSiteConfig({ adminPassword: e.target.value })} />
            </div>

            <div className="pt-4 border-t border-gold/10">
              <h4 className="font-bold text-gold mb-4 flex items-center gap-2"><ImageIcon size={18} /> صورة الواجهة الرئيسية</h4>
              <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-gold/20 rounded-2xl bg-black/40">
                {siteConfig.heroImage && <img src={siteConfig.heroImage} className="w-full h-32 object-cover rounded-xl border border-gold/30" />}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  id="hero-img-upload" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateSiteConfig({ heroImage: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label htmlFor="hero-img-upload" className="flex items-center gap-2 px-6 py-2 rounded-full bg-white text-black font-bold cursor-pointer hover:bg-zinc-200 transition-colors">
                  <ImageIcon size={18} /> تغيير الصورة الرئيسية
                </label>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-gold">معلومات المدرب</h4>
            <input type="text" placeholder="اسم المدرب" className="w-full bg-black border border-white/10 p-3 rounded-lg" defaultValue={siteConfig.trainerName} onBlur={(e) => updateSiteConfig({ trainerName: e.target.value })} />
            
            <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-gold/20 rounded-2xl bg-black/40">
              <div className="relative group">
                {siteConfig.trainerImage && <img src={siteConfig.trainerImage} className="w-32 h-32 rounded-full border-2 border-gold object-cover shadow-lg shadow-gold/20" />}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ImageIcon className="text-white w-8 h-8" />
                </div>
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                id="trainer-img-upload" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      updateSiteConfig({ trainerImage: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              
              <label htmlFor="trainer-img-upload" className="flex items-center gap-2 px-8 py-3 rounded-full gold-bg-gradient text-black font-bold cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-gold/20">
                <ImageIcon size={20} /> رفع صورة المدرب
              </label>
              
              <p className="text-xs opacity-50 text-center">
                انقر على الزر أعلاه لاختيار صورة من جهازك <br/>
                (سيتم استبدال الصورة الحالية تلقائياً)
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-6">
          <button onClick={() => addItem('courses', { number: '', price: 0, discount: 0, telegramLink: '', location: '', imageUrl: '' })} className="flex items-center gap-2 text-gold"><Plus /> إضافة دورة</button>
          <div className="grid gap-4">
            {courses.map((c: any) => (
              <div key={c.id} className="p-4 bg-black rounded-xl border border-white/10 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="رقم التواصل" className="bg-zinc-800 p-2 rounded" defaultValue={c.number} onBlur={(e) => updateDoc(doc(db, 'courses', c.id), { number: e.target.value })} />
                  <input type="number" placeholder="السعر" className="bg-zinc-800 p-2 rounded" defaultValue={c.price} onBlur={(e) => updateDoc(doc(db, 'courses', c.id), { price: Number(e.target.value) })} />
                  <input type="number" placeholder="الخصم" className="bg-zinc-800 p-2 rounded" defaultValue={c.discount} onBlur={(e) => updateDoc(doc(db, 'courses', c.id), { discount: Number(e.target.value) })} />
                  <input type="text" placeholder="رابط تليجرام" className="bg-zinc-800 p-2 rounded" defaultValue={c.telegramLink} onBlur={(e) => updateDoc(doc(db, 'courses', c.id), { telegramLink: e.target.value })} />
                  <input type="text" placeholder="الموقع" className="bg-zinc-800 p-2 rounded" defaultValue={c.location} onBlur={(e) => updateDoc(doc(db, 'courses', c.id), { location: e.target.value })} />
                  <div className="space-y-1">
                    <label className="text-[10px] text-gold">رابط الصورة أو رفع ملف</label>
                    <input type="text" placeholder="رابط الصورة" className="w-full bg-zinc-800 p-2 rounded text-xs" value={c.imageUrl} onChange={(e) => updateDoc(doc(db, 'courses', c.id), { imageUrl: e.target.value })} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      id={`course-img-${c.id}`} 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateDoc(doc(db, 'courses', c.id), { imageUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label htmlFor={`course-img-${c.id}`} className="flex items-center gap-1 text-[10px] text-gold cursor-pointer hover:underline">
                      <ImageIcon size={12} /> رفع صورة
                    </label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => deleteItem('courses', c.id)} className="text-red-500 flex items-center gap-1 text-sm"><Trash2 size={16} /> حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="space-y-6">
          <button onClick={() => addItem('posts', { number: '', location: '', price: 0, discount: 0, note: '', imageUrl: '' })} className="flex items-center gap-2 text-gold"><Plus /> إضافة منشور</button>
          <div className="grid gap-4">
            {posts.map((p: any) => (
              <div key={p.id} className="p-4 bg-black rounded-xl border border-white/10 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="الرقم" className="bg-zinc-800 p-2 rounded" defaultValue={p.number} onBlur={(e) => updateDoc(doc(db, 'posts', p.id), { number: e.target.value })} />
                  <input type="text" placeholder="الموقع" className="bg-zinc-800 p-2 rounded" defaultValue={p.location} onBlur={(e) => updateDoc(doc(db, 'posts', p.id), { location: e.target.value })} />
                  <input type="number" placeholder="السعر" className="bg-zinc-800 p-2 rounded" defaultValue={p.price} onBlur={(e) => updateDoc(doc(db, 'posts', p.id), { price: Number(e.target.value) })} />
                  <input type="number" placeholder="الخصم" className="bg-zinc-800 p-2 rounded" defaultValue={p.discount} onBlur={(e) => updateDoc(doc(db, 'posts', p.id), { discount: Number(e.target.value) })} />
                  <div className="space-y-1">
                    <label className="text-[10px] text-gold">رابط الصورة أو رفع ملف</label>
                    <input type="text" placeholder="رابط الصورة" className="w-full bg-zinc-800 p-2 rounded text-xs" value={p.imageUrl} onChange={(e) => updateDoc(doc(db, 'posts', p.id), { imageUrl: e.target.value })} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      id={`post-img-${p.id}`} 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateDoc(doc(db, 'posts', p.id), { imageUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label htmlFor={`post-img-${p.id}`} className="flex items-center gap-1 text-[10px] text-gold cursor-pointer hover:underline">
                      <ImageIcon size={12} /> رفع صورة
                    </label>
                  </div>
                </div>
                <textarea placeholder="ملاحظة" className="w-full bg-zinc-800 p-2 rounded" defaultValue={p.note} onBlur={(e) => updateDoc(doc(db, 'posts', p.id), { note: e.target.value })} />
                <div className="flex justify-end">
                  <button onClick={() => deleteItem('posts', p.id)} className="text-red-500 flex items-center gap-1 text-sm"><Trash2 size={16} /> حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'software' && (
        <div className="space-y-6">
          <button onClick={() => addItem('software', { deviceName: '', service: '', price: 0, location: '' })} className="flex items-center gap-2 text-gold"><Plus /> إضافة خدمة سوفت</button>
          <div className="grid gap-4">
            {software.map((s: any) => (
              <div key={s.id} className="p-4 bg-black rounded-xl border border-white/10 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="اسم الجهاز" className="bg-zinc-800 p-2 rounded" defaultValue={s.deviceName} onBlur={(e) => updateDoc(doc(db, 'software', s.id), { deviceName: e.target.value })} />
                  <input type="text" placeholder="الخدمة" className="bg-zinc-800 p-2 rounded" defaultValue={s.service} onBlur={(e) => updateDoc(doc(db, 'software', s.id), { service: e.target.value })} />
                  <input type="number" placeholder="السعر" className="bg-zinc-800 p-2 rounded" defaultValue={s.price} onBlur={(e) => updateDoc(doc(db, 'software', s.id), { price: Number(e.target.value) })} />
                  <input type="text" placeholder="الموقع" className="bg-zinc-800 p-2 rounded" defaultValue={s.location} onBlur={(e) => updateDoc(doc(db, 'software', s.id), { location: e.target.value })} />
                </div>
                <div className="flex justify-end">
                  <button onClick={() => deleteItem('software', s.id)} className="text-red-500 flex items-center gap-1 text-sm"><Trash2 size={16} /> حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'screens' && (
        <div className="space-y-6">
          <button onClick={() => addItem('screens', { name: '', price: 0, discount: 0, number: '', location: '' })} className="flex items-center gap-2 text-gold"><Plus /> إضافة شاشة</button>
          <div className="grid gap-4">
            {screens.map((s: any) => (
              <div key={s.id} className="p-4 bg-black rounded-xl border border-white/10 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="اسم الشاشة" className="bg-zinc-800 p-2 rounded" defaultValue={s.name} onBlur={(e) => updateDoc(doc(db, 'screens', s.id), { name: e.target.value })} />
                  <input type="number" placeholder="السعر" className="bg-zinc-800 p-2 rounded" defaultValue={s.price} onBlur={(e) => updateDoc(doc(db, 'screens', s.id), { price: Number(e.target.value) })} />
                  <input type="number" placeholder="الخصم" className="bg-zinc-800 p-2 rounded" defaultValue={s.discount} onBlur={(e) => updateDoc(doc(db, 'screens', s.id), { discount: Number(e.target.value) })} />
                  <input type="text" placeholder="الرقم" className="bg-zinc-800 p-2 rounded" defaultValue={s.number} onBlur={(e) => updateDoc(doc(db, 'screens', s.id), { number: e.target.value })} />
                  <input type="text" placeholder="الموقع" className="bg-zinc-800 p-2 rounded" defaultValue={s.location} onBlur={(e) => updateDoc(doc(db, 'screens', s.id), { location: e.target.value })} />
                </div>
                <div className="flex justify-end">
                  <button onClick={() => deleteItem('screens', s.id)} className="text-red-500 flex items-center gap-1 text-sm"><Trash2 size={16} /> حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
