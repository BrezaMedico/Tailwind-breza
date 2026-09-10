import React, { useState, useEffect, useRef } from "react";

// Komponen Card dengan Efek 3D Tilt & Interactive Spotlight Glare
function TiltCard({ children, className = "" }) {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setRotation({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: "transform 0.15s ease-out",
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Glare Reflection Light */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-20"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const [cursorPos, setCursorPos] = useState({ x: -200, y: -200 });
  const [trailingPos, setTrailingPos] = useState({ x: -200, y: -200 });
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState([]);

  // 1. INTERACTIVE PARTICLE CANVAS BACKGROUND
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? "rgba(6, 182, 212, " : "rgba(168, 85, 247, ",
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Gambar koneksi antar partikel
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.18 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update & render partikel
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = `${p.color}0.7)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // 2. CURSOR & RIPPLE SYSTEM
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const handleClick = (e) => {
      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples((prev) => [...prev, newRipple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 700);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    const follow = setInterval(() => {
      setTrailingPos((prev) => ({
        x: prev.x + (cursorPos.x - prev.x) * 0.18,
        y: prev.y + (cursorPos.y - prev.y) * 0.18,
      }));
    }, 1000 / 60);
    return () => clearInterval(follow);
  }, [cursorPos]);

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      
      {/* BACKGROUND PARTICLE CANVAS */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-70"
      />

      {/* AMBIENT AURORA GLOW EFFECT */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/25 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/25 rounded-full blur-[140px] pointer-events-none animate-pulse" />

      {/* CUSTOM DUAL-LAYER CURSOR */}
      <div
        className="pointer-events-none fixed z-[9999] hidden md:block w-2.5 h-2.5 bg-cyan-300 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_12px_#22d3ee]"
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />
      <div
        className={`pointer-events-none fixed z-[9998] hidden md:block rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out border ${
          isHovered
            ? "w-20 h-20 bg-cyan-500/10 border-cyan-300 backdrop-blur-xs scale-125 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
            : "w-10 h-10 border-purple-400/60 bg-transparent scale-100"
        }`}
        style={{ left: `${trailingPos.x}px`, top: `${trailingPos.y}px` }}
      />

      {/* CLICK SHOCKWAVE RIPPLES */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="fixed pointer-events-none z-[9997] rounded-full border border-cyan-400/80 -translate-x-1/2 -translate-y-1/2 animate-ping"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: "60px",
            height: "60px",
          }}
        />
      ))}

      {/* NAVBAR: Fixed, Cyber-Glassmorphism, Animated Soundwave */}
      <nav className="fixed top-0 left-0 w-full bg-[#030712]/75 backdrop-blur-2xl border-b border-cyan-500/20 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 p-[2px] animate-spin [animation-duration:8s]">
              <div className="w-full h-full bg-[#030712] rounded-[10px] flex items-center justify-center font-black text-cyan-400 text-lg">
                Ω
              </div>
            </div>
            <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
              VORTEX<span className="text-cyan-400 animate-pulse">.</span>OS
            </span>
          </div>

          <div className="flex items-center space-x-8">
            <ul className="hidden sm:flex space-x-8 text-sm font-medium text-slate-300">
              {["Beranda", "Fitur", "Artikel"].map((menu) => (
                <li key={menu}>
                  <a
                    href={`#${menu.toLowerCase()}`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="relative py-1 hover:text-cyan-300 transition-colors group"
                  >
                    {menu}
                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-300 group-hover:w-full shadow-[0_0_8px_#22d3ee]" />
                  </a>
                </li>
              ))}
            </ul>

            {/* Status Radar Pulse */}
            <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-700/60 px-3 py-1.5 rounded-full text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE v4.0</span>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION: Dynamic Gradient, Floating Badges, Glitch Flare */}
      <section
        id="beranda"
        className="relative min-h-[680px] flex items-center justify-center bg-cover bg-center pt-28 pb-20 px-6 z-10"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/95 via-[#030712]/80 to-[#030712]" />

        <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 mb-6 rounded-full border border-cyan-500/40 bg-cyan-950/40 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <span className="text-cyan-300 font-mono text-xs uppercase tracking-widest">
              ⚡ Next-Gen Cyber Aesthetics
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-tight">
            Sensasi Desain{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]">
              Maksimal & Hidup
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300/90 leading-relaxed max-w-2xl">
            Arsitektur visual reaktif dengan interaksi 3D mikro, partikel real-time, dan tata letak modular Tailwind CSS.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <a
              href="#fitur"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Mulai Penjelajahan
            </a>
          </div>
        </div>
      </section>

      {/* HEADER SECTION (TUGAS 2): Latar Biru Bercahaya & Teks Tengah */}
      <header className="relative z-10 bg-gradient-to-r from-blue-900/80 via-cyan-900/60 to-blue-900/80 border-y border-cyan-500/30 py-10 px-6 text-center shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-md">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
          Section Kontrol & Struktur Data
        </h2>
        <p className="text-cyan-200/80 text-sm sm:text-base mt-2 max-w-xl mx-auto font-medium">
          Pengaturan tata letak Grid 1:3 teruji dengan responsivitas adaptif
        </p>
      </header>

      {/* SECTION FITUR 1:3 (TUGAS 2): 3D Card, Interactive Hover Button */}
      <section id="fitur" className="relative z-10 max-w-7xl mx-auto my-20 px-6">
        <TiltCard className="rounded-3xl p-[1px] bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-pink-500/50 shadow-2xl shadow-cyan-950/50">
          <div className="bg-[#0b1120]/90 backdrop-blur-2xl rounded-[23px] p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 items-center">
              
              {/* Kolom 1 (Proporsi 1: Gambar Interaktif) */}
              <div className="md:col-span-1 group relative overflow-hidden rounded-2xl border border-cyan-500/30 shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop"
                  alt="Neon Core"
                  className="w-full h-64 md:h-auto object-cover transform group-hover:scale-125 group-hover:rotate-2 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity" />
              </div>

              {/* Kolom 2 (Proporsi 3: Deskripsi & Tombol) */}
              <div className="md:col-span-3 flex flex-col justify-center">
                <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase mb-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Sistem Grid Proporsi 1:3</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight">
                  Fleksibilitas Ultra dengan Utility Tailwind
                </h3>

                <p className="text-slate-300 leading-relaxed text-sm sm:text-base mb-8">
                  Card ini dilengkapi komputasi matematika matrix 3D yang membaca posisi kursor mouse secara presisi serta memantulkan kilauan cahaya (*dynamic spotlight glare*). Tampilan bertumpuk otomatis menjadi 1 kolom vertikal saat dibuka dari ponsel cerdas.
                </p>

                <div>
                  {/* Tombol Biru Muda dengan Efek Hover Lebih Gelap & Glow */}
                  <button
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="relative group overflow-hidden px-8 py-3.5 rounded-xl bg-sky-400 hover:bg-sky-600 text-white font-bold shadow-lg shadow-sky-400/30 hover:shadow-sky-500/60 hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center space-x-2">
                      <span>Inisialisasi Fitur</span>
                      <span className="group-hover:translate-x-1.5 transition-transform">→</span>
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </TiltCard>
      </section>

      {/* CONTENT SECTION (TUGAS 3): 3D Interactive Card Grid */}
      <section id="artikel" className="relative z-10 max-w-7xl mx-auto my-20 px-6 pb-24">
        <div className="text-center mb-16">
          <span className="text-xs font-mono text-fuchsia-400 uppercase tracking-widest">
            Database Pengetahuan
          </span>
          <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2">
            Eksplorasi Artikel Futuristik
          </h3>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Arahkan kursor pada kartu untuk merasakan kedalaman efek 3D tilt
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              id: 1,
              title: "Arsitektur Kursor 60 FPS",
              tag: "Animasi",
              color: "from-cyan-500 to-blue-600",
              img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop",
            },
            {
              id: 2,
              title: "Komputasi Matriks 3D Tilt",
              tag: "Grafika",
              color: "from-purple-500 to-indigo-600",
              img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop",
            },
            {
              id: 3,
              title: "Partikel Canvas Real-Time",
              tag: "Kinerja",
              color: "from-fuchsia-500 to-pink-600",
              img: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600&auto=format&fit=crop",
            },
          ].map((item) => (
            <TiltCard
              key={item.id}
              className="rounded-2xl p-[1px] bg-slate-800/80 hover:bg-gradient-to-b hover:from-cyan-400 hover:via-purple-500 hover:to-transparent transition-all duration-300 shadow-xl"
            >
              <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="bg-[#0c1222] rounded-[15px] h-full flex flex-col justify-between overflow-hidden"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${item.color} shadow-lg`}>
                      {item.tag}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-white hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                      Eksperimen penerapan visual modern yang memadukan komputasi vektor ringan dengan akselerasi GPU perangkat.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono">#NODE_{item.id}</span>
                    <span className="text-cyan-400 font-bold flex items-center space-x-1 hover:translate-x-1 transition-transform">
                      <span>Buka Modul</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#02050b] py-8 text-center text-xs text-slate-500 font-mono">
        <p>© 2026 VORTEX ENGINE. Didukung oleh React & Tailwind CSS v4.</p>
      </footer>
    </div>
  );
}