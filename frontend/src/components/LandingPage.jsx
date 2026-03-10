import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function LandingPage() {
  const { loginWithMock } = useAuth();
  const [isLoading, setIsLoading] = useState(''); // 'teacher' or 'student'

  const handleLogin = async (role) => {
    setIsLoading(role);
    try {
      await loginWithMock(role);
    } catch (err) {
      console.error(err);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading('');
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/20">
              🎓
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Inclusive Classroom
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-indigo-400 transition-colors">How it Works</button>
            <button onClick={() => scrollToSection('features')} className="hover:text-indigo-400 transition-colors">Features</button>
            <button onClick={() => scrollToSection('accessibility')} className="hover:text-indigo-400 transition-colors">Accessibility</button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLogin('student')}
              className="hidden sm:block text-sm font-bold text-slate-300 hover:text-white transition-colors"
            >
              Student Login
            </button>
            <button
              onClick={() => handleLogin('teacher')}
              disabled={isLoading !== ''}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
            >
              {isLoading === 'teacher' ? 'Loading...' : 'Teacher Login'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-8 pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-700 text-indigo-300 text-xs font-bold uppercase tracking-widest shadow-lg">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Real-time Accessible Education
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight">
            Education Without <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Barriers
            </span>
          </h1>

          <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed text-balance">
            An AI-powered inclusive learning platform bridging the gap with real-time sign language recognition, live captions, AI summaries, and Braille exports.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button
              onClick={() => handleLogin('teacher')}
              disabled={isLoading !== ''}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-bold rounded-xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              {isLoading === 'teacher' ? 'Signing in...' : 'Launch Teacher Dashboard'}
            </button>
            <button
              onClick={() => handleLogin('student')}
              disabled={isLoading !== ''}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-base font-bold rounded-xl shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              {isLoading === 'student' ? 'Signing in...' : 'Join as Student'}
            </button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white">How It Works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Seamless integration of advanced AI to facilitate real-time accessible learning.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0"></div>

            <div className="relative z-10 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 hover:border-indigo-500/30 transition-colors">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl shadow-inner text-indigo-400">
                1
              </div>
              <h3 className="text-xl font-bold text-white">Connect</h3>
              <p className="text-slate-400 text-sm">Log in with your Google account. Teachers create live sessions, students join instantly via secure WebRTC.</p>
            </div>

            <div className="relative z-10 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 hover:border-purple-500/30 transition-colors">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl shadow-inner text-purple-400">
                2
              </div>
              <h3 className="text-xl font-bold text-white">Communicate</h3>
              <p className="text-slate-400 text-sm">Speak normally. The platform automatically transcribes speech and detects Indian Sign Language via webcam.</p>
            </div>

            <div className="relative z-10 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 hover:border-blue-500/30 transition-colors">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl shadow-inner text-blue-400">
                3
              </div>
              <h3 className="text-xl font-bold text-white">Comprehend</h3>
              <p className="text-slate-400 text-sm">Students receive localized translations, AI-simplified summaries, and Braille-ready exports instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Powerful Features</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Tools designed to ensure no student is left behind.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Live Transcription", desc: "Real-time speech-to-text converts the teacher's voice into highly accurate live captions.", icon: "🎙️" },
              { title: "ISL Recognition", desc: "MediaPipe AI tracks hand gestures to detect Indian Sign Language locally in the browser.", icon: "🖐️" },
              { title: "Tribal Translations", desc: "Ollama-powered automatic translations to Santhali, Gondi, Tamil, and more.", icon: "🌐" },
              { title: "AI Assistant", desc: "Llama3 generates simplified lecture summaries, key takeaways, and answers questions.", icon: "🤖" },
              { title: "Braille Export", desc: "Instantly convert text and summaries into Braille-encoded PDF documents for physical printing.", icon: "📄" },
              { title: "Gamification", desc: "XP system and activity tracking keeps students engaged and motivated during lessons.", icon: "🎮" }
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900 border border-white/5 hover:border-indigo-500/30 transition-all hover:shadow-lg hover:shadow-indigo-500/5 group">
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accessibility */}
      <section id="accessibility" className="py-24 bg-gradient-to-b from-slate-950 to-indigo-950/20">
        <div className="max-w-5xl mx-auto px-8 text-center space-y-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/20 flex items-center justify-center text-3xl mb-4">
            🌟
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Built for Everyone.</h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Every component of this visual infrastructure was designed to prioritize accessibility. From high-contrast dark modes to native screen-reader support, the interface stays completely out of the way so learning takes center stage.
          </p>
          <button
            onClick={() => handleLogin('student')}
            className="mt-8 px-8 py-4 bg-white text-indigo-950 text-base font-bold rounded-xl shadow-xl hover:bg-slate-100 transition-all hover:scale-105"
          >
            Experience It Now
          </button>
        </div>
      </section>
    </div>
  );
}
