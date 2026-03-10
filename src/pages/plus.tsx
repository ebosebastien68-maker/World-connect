import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatItem {
  target: number;
  label: string;
}

interface ServiceCard {
  icon: string;
  title: string;
  description: string;
}

interface SolutionCard {
  icon: string;
  title: string;
  description: string;
}

interface ProblemItem {
  number: string;
  title: string;
  paragraphs: string[];
  bold: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS: StatItem[] = [
  { target: 200, label: "Projets Réalisés" },
  { target: 99, label: "% Satisfaction" },
  { target: 24, label: "Support / 7 Jours" },
  { target: 60, label: "Technologies" },
];

const SERVICES: ServiceCard[] = [
  { icon: "🌐", title: "Sites Web & Design", description: "Sites professionnels ultra-modernes, e-commerce performants, landing pages qui convertissent. Design 2026 et expérience utilisateur exceptionnelle." },
  { icon: "📱", title: "Applications Mobile", description: "Applications iOS et Android natives, APK personnalisés, applications hybrides. Interface fluide et performances optimales." },
  { icon: "💻", title: "Applications Web", description: "Plateformes web complètes, SaaS, dashboards interactifs, outils métiers sur mesure avec toutes fonctionnalités." },
  { icon: "🖥️", title: "Logiciels Sur Mesure", description: "Développement de logiciels desktop, solutions d'entreprise, outils spécifiques adaptés à vos besoins." },
  { icon: "⚙️", title: "Programmation Machines", description: "Automatisation industrielle, IoT, systèmes embarqués, contrôle et monitoring de machines intelligentes." },
  { icon: "🤖", title: "Intelligence Artificielle", description: "Chatbots intelligents, automatisation IA avancée, machine learning, analyse prédictive et traitement de données." },
  { icon: "🔐", title: "Backend & Sécurité", description: "Architecture robuste et sécurisée, API performantes, bases de données optimisées, authentification multi-niveaux." },
  { icon: "☁️", title: "Cloud & DevOps", description: "Déploiement cloud automatisé, CI/CD, infrastructure scalable, monitoring 24/7 et maintenance proactive." },
];

const SOLUTIONS: SolutionCard[] = [
  { icon: "🔔", title: "Notifications Push Directes", description: "Communiquez directement avec vos clients via notifications push. Sans algorithme. Sans payer pour être vu." },
  { icon: "💾", title: "Base Clients Permanente", description: "Votre base de données clients vous appartient à 100% et pour toujours. Personne ne peut vous la retirer." },
  { icon: "💳", title: "Paiements Automatiques", description: "Système de paiement intégré : commandes, abonnements, paiements récurrents. Même quand vous dormez." },
  { icon: "⚙️", title: "Automatisation Totale", description: "Réponses automatiques, prise de rendez-vous, suivis clients, confirmations. 24h/24, 7j/7 sans intervention." },
  { icon: "📊", title: "Analytics Avancés", description: "Dashboard complet : chiffre d'affaires, taux de conversion, rétention client. Tout est mesurable et optimisable." },
  { icon: "🏆", title: "Image Professionnelle", description: "La crédibilité d'une vraie entreprise. Exactement ce que font les grandes sociétés avant d'exploser." },
];

const PROBLEMS: ProblemItem[] = [
  {
    number: "01",
    title: "Les réseaux sociaux ne vous appartiennent pas",
    paragraphs: [
      "Aujourd'hui votre entreprise est visible. Demain, votre compte peut être bloqué, limité ou supprimé sans préavis.",
      "Un signalement malveillant, un changement d'algorithme… Et votre visibilité disparaît instantanément.",
    ],
    bold: "Votre entreprise ne peut pas dépendre d'une plateforme où d'autres décident à votre place. Quand la plateforme tranche, votre activité s'arrête net.",
  },
  {
    number: "02",
    title: "Les réseaux sociaux génèrent des impressions inutiles",
    paragraphs: [
      "Sur les réseaux sociaux, les gens ne viennent pas pour acheter. Ils scrollent, se divertissent, passent le temps.",
      "Vous obtenez des milliers de vues, des likes, des impressions… Mais très peu de vraies conversions.",
    ],
    bold: "Le pire ? Toutes ces impressions inutiles sont facturées dans vos frais de publicité. Vous payez pour être vu, pas pour vendre.",
  },
  {
    number: "03",
    title: "Vous perdez un temps énorme sur des tâches répétitives",
    paragraphs: [
      "Les mêmes questions chaque jour. Des messages sans suite. Des appels inutiles. Des tâches manuelles interminables.",
      "Ce temps précieux devrait être automatisé, optimisé, pas consommé.",
    ],
    bold: "Une vraie entreprise ne fonctionne pas à la main : elle fonctionne avec des systèmes intelligents et automatisés.",
  },
  {
    number: "04",
    title: "Vos données et clients sont éparpillés",
    paragraphs: [
      "WhatsApp, Instagram, Facebook, messages, appels… Résultat : aucune vision d'ensemble claire.",
      "Impossible de savoir précisément : combien de vrais clients vous avez, ce que vous gagnez réellement, ce qui fonctionne vraiment.",
    ],
    bold: "Les grandes entreprises centralisent TOUT : clients, paiements, historiques, analyses, performances. C'est leur secret.",
  },
  {
    number: "05",
    title: "Votre entreprise s'arrête quand vous vous déconnectez",
    paragraphs: [
      "Pas connecté → pas de réponses → pas de ventes. Aussi simple que ça.",
      "Votre entreprise dépend entièrement de votre présence constante en ligne.",
    ],
    bold: "Ce n'est pas une vraie entreprise. C'est une dépendance fragile qui ne peut pas croître ni scaler.",
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useIntersectionObserver(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, options);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, isVisible };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Particles() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 15}s`,
    duration: `${Math.random() * 10 + 10}s`,
  }));

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            width: 2,
            height: 2,
            background: "#00f3ff",
            borderRadius: "50%",
            opacity: 0.4,
            left: p.left,
            animation: `particleFloat ${p.duration} linear ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

function AnimatedBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>
      {[
        { size: 500, color: "#00f3ff", top: "-10%", left: "-10%", delay: "0s" },
        { size: 400, color: "#ff00ea", top: "50%", right: "-10%", delay: "-7s" },
        { size: 450, color: "#8b5cf6", bottom: "-10%", left: "30%", delay: "-14s" },
      ].map((orb, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent)`,
            borderRadius: "50%",
            filter: "blur(80px)",
            opacity: 0.5,
            top: orb.top,
            left: (orb as any).left,
            right: (orb as any).right,
            bottom: (orb as any).bottom,
            animation: `float 20s ease-in-out ${orb.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Navbar({ scrolled }: { scrolled: boolean }) {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) window.scrollTo({ top: (target as HTMLElement).offsetTop - 80, behavior: "smooth" });
    }
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 1000,
        padding: scrolled ? "1rem 5%" : "1.5rem 5%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: scrolled ? "rgba(10,10,15,0.95)" : "rgba(10,10,15,0.7)",
        backdropFilter: "blur(30px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        boxShadow: scrolled ? "0 10px 40px rgba(0,243,255,0.1)" : "none",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div
        style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "1.8rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}
        onClick={() => window.location.href = "https://www.world-connect.world/index.html"}
      >
        <div
          style={{
            width: 55, height: 55,
            background: "linear-gradient(135deg,#00f3ff,#ff00ea,#8b5cf6)",
            borderRadius: 15,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem",
            boxShadow: "0 0 30px rgba(0,243,255,0.5)",
            animation: "logoRotate 10s linear infinite",
          }}
        >🌍</div>
        <span style={{ background: "linear-gradient(135deg,#00f3ff,#ff00ea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>
          WORLD CONNECT
        </span>
      </div>

      <ul style={{ display: "flex", gap: "3rem", listStyle: "none", alignItems: "center" }}>
        {[["#services", "Services"], ["#stats", "Performance"], ["#problemes", "Problèmes"], ["#solutions", "Solutions"]].map(([href, label]) => (
          <li key={href}>
            <a href={href} onClick={(e) => handleNavClick(e, href)}
              style={{ color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: "0.95rem", letterSpacing: "0.5px", transition: "color 0.3s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#00f3ff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#fff")}
            >{label}</a>
          </li>
        ))}
      </ul>

      <a href="https://www.world-connect.world/messages.html"
        style={{
          padding: "0.8rem 2rem",
          background: "linear-gradient(135deg,#00f3ff,#ff00ea)",
          borderRadius: 50, color: "#0a0a0f", fontWeight: 700, fontSize: "0.9rem",
          textDecoration: "none", display: "inline-block",
          boxShadow: "0 5px 20px rgba(0,243,255,0.4)", transition: "all 0.3s ease",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(0,243,255,0.6)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 5px 20px rgba(0,243,255,0.4)"; }}
      >Nous Contacter</a>
    </nav>
  );
}

function HeroSection() {
  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5%", overflow: "hidden" }}>
      {/* Floating shapes */}
      {[
        { size: 200, color: "#00f3ff", top: "10%", left: "5%", delay: "0s", borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" },
        { size: 150, color: "#ff00ea", top: "60%", right: "10%", delay: "-8s", borderRadius: "70% 30% 30% 70% / 70% 70% 30% 30%" },
        { size: 180, color: "#8b5cf6", bottom: "20%", left: "15%", delay: "-16s", borderRadius: "50% 50% 30% 70% / 50% 50% 70% 30%" },
      ].map((s, i) => (
        <div key={i} style={{
          position: "absolute", width: s.size, height: s.size, opacity: 0.15,
          background: `linear-gradient(45deg,${s.color},transparent)`,
          borderRadius: s.borderRadius,
          top: (s as any).top, left: (s as any).left, right: (s as any).right, bottom: (s as any).bottom,
          animation: `rotate3d 25s linear ${s.delay} infinite`,
          pointerEvents: "none",
        }} />
      ))}

      <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 1200, animation: "fadeInUp 1s ease 0.5s both" }}>
        <div style={{
          display: "inline-block", padding: "0.6rem 1.5rem",
          background: "rgba(0,243,255,0.1)", border: "1px solid rgba(0,243,255,0.3)",
          borderRadius: 50, fontSize: "0.9rem", fontWeight: 600, color: "#00f3ff",
          marginBottom: "2rem", animation: "pulse 3s ease-in-out infinite",
        }}>🚀 Solutions Digitales Innovantes 2026</div>

        <h1 style={{
          fontFamily: "'Orbitron',sans-serif", fontSize: "clamp(3rem,10vw,7rem)", fontWeight: 900, lineHeight: 1.1,
          marginBottom: "2rem",
          background: "linear-gradient(135deg,#00f3ff 0%,#ff00ea 50%,#8b5cf6 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundSize: "200% 200%", animation: "gradientFlow 5s ease infinite",
        }}>WORLD CONNECT</h1>

        <p style={{ fontSize: "clamp(1.3rem,3vw,2.2rem)", color: "#fff", marginBottom: "1.5rem", fontWeight: 300, letterSpacing: 1 }}>
          Sites Web • Applications Mobile • Logiciels • APK • Programmation Machines • Intelligence Artificielle
        </p>
        <p style={{ fontSize: "clamp(1.1rem,2vw,1.4rem)", color: "rgba(255,255,255,0.7)", marginBottom: "3rem", lineHeight: 1.8, maxWidth: 800, marginLeft: "auto", marginRight: "auto" }}>
          Nous créons des solutions digitales complètes qui vous appartiennent à 100%. Arrêtez de dépendre des plateformes que vous ne contrôlez pas. Construisez votre empire numérique avec World Connect.
        </p>

        <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Btn href="https://www.world-connect.world/index.html" primary>Accéder à Notre Plateforme</Btn>
          <Btn href="https://www.world-connect.world/messages.html">Nous Envoyer un Message</Btn>
        </div>
      </div>
    </section>
  );
}

function Btn({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a href={href}
      style={{
        padding: "1.3rem 3.5rem", fontSize: "1.1rem", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: 1, borderRadius: 50,
        cursor: "pointer", textDecoration: "none", display: "inline-block",
        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
        ...(primary
          ? {
              background: "linear-gradient(135deg,#00f3ff,#ff00ea)", color: "#0a0a0f",
              boxShadow: hovered ? "0 20px 60px rgba(0,243,255,0.6)" : "0 10px 40px rgba(0,243,255,0.4)",
              transform: hovered ? "translateY(-5px) scale(1.02)" : "none",
            }
          : {
              background: "transparent", color: "#00f3ff",
              border: "2px solid #00f3ff",
              boxShadow: hovered ? "0 0 40px rgba(0,243,255,0.5)" : "0 0 20px rgba(0,243,255,0.2)",
              transform: hovered ? "translateY(-5px) scale(1.02)" : "none",
              backgroundColor: hovered ? "rgba(0,243,255,0.1)" : "transparent",
            }),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >{children}</a>
  );
}

function SectionHeader({ tag, title, subtitle, tagColor = "#8b5cf6" }: { tag: string; title: string; subtitle: string; tagColor?: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "6rem" }}>
      <div style={{
        display: "inline-block", padding: "0.5rem 1.5rem",
        background: `rgba(${tagColor === "#8b5cf6" ? "139,92,246" : "0,243,255"},0.1)`,
        border: `1px solid rgba(${tagColor === "#8b5cf6" ? "139,92,246" : "0,243,255"},0.3)`,
        borderRadius: 50, fontSize: "0.85rem", fontWeight: 600, color: tagColor,
        marginBottom: "1.5rem", textTransform: "uppercase" as const, letterSpacing: 2,
      }}>{tag}</div>
      <h2 style={{
        fontFamily: "'Orbitron',sans-serif", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 900, marginBottom: "1.5rem",
        background: "linear-gradient(135deg,#fff,#00f3ff)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>{title}</h2>
      <p style={{ fontSize: "1.3rem", color: "rgba(255,255,255,0.6)", maxWidth: 700, margin: "0 auto", lineHeight: 1.8 }}>{subtitle}</p>
    </div>
  );
}

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.5 });
  const started = useRef(false);

  useEffect(() => {
    if (!isVisible || started.current) return;
    started.current = true;
    const duration = 2500;
    const increment = target / (duration / 16);
    let current = 0;
    const tick = () => {
      current += increment;
      if (current < target) { setCount(Math.floor(current)); requestAnimationFrame(tick); }
      else setCount(target);
    };
    tick();
  }, [isVisible, target]);

  return (
    <div ref={ref} style={{
      fontFamily: "'Orbitron',sans-serif", fontSize: "5rem", fontWeight: 900, position: "relative", display: "inline-block",
      background: "linear-gradient(135deg,#00f3ff,#ff00ea)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "1rem",
    }}>
      {count}
      <span style={{ position: "absolute", right: -30, top: 0, fontSize: "3rem", color: "#00f3ff" }}>+</span>
    </div>
  );
}

function StatsSection() {
  return (
    <section id="stats" style={{ padding: "8rem 5%", background: "#0a0a0f", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#00f3ff,transparent)" }} />
      <SectionHeader tag="Performance" title="Nos Résultats" subtitle="Des chiffres qui témoignent de notre expertise" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "4rem", maxWidth: 1200, margin: "0 auto" }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <AnimatedCounter target={s.target} />
            <div style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServiceCardItem({ card, delay }: { card: ServiceCard; delay: number }) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.15, rootMargin: "0px 0px -100px 0px" });
  const [hovered, setHovered] = useState(false);

  return (
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(0,243,255,0.5)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 25, padding: "3rem 2.5rem", position: "relative", overflow: "hidden",
        backdropFilter: "blur(10px)",
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? hovered ? "translateY(-15px) scale(1.02)" : "translateY(0) rotateX(0deg)"
          : "translateY(50px) rotateX(10deg)",
        transition: `all 0.5s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
        boxShadow: hovered ? "0 25px 70px rgba(0,243,255,0.2)" : "none",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: "linear-gradient(90deg,#00f3ff,#ff00ea,#8b5cf6)",
        transform: hovered ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left",
        transition: "transform 0.5s ease",
      }} />
      <div style={{
        fontSize: "4rem", marginBottom: "2rem", display: "inline-block",
        filter: "drop-shadow(0 0 20px rgba(0,243,255,0.5))",
        transform: hovered ? "scale(1.2) rotate(360deg)" : "scale(1)",
        transition: "all 0.5s cubic-bezier(0.68,-0.55,0.265,1.55)",
      }}>{card.icon}</div>
      <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "1.6rem", marginBottom: "1rem", color: "#fff", fontWeight: 700 }}>{card.title}</h3>
      <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, fontSize: "1.05rem" }}>{card.description}</p>
    </div>
  );
}

function ServicesSection() {
  return (
    <section id="services" style={{ position: "relative", padding: "10rem 5%", background: "linear-gradient(180deg,#050508 0%,rgba(10,10,15,0.95) 100%)" }}>
      <SectionHeader tag="Ce Que Nous Faisons" title="Services Complets" subtitle="De la conception au déploiement, nous gérons tout" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "2.5rem", maxWidth: 1400, margin: "0 auto" }}>
        {SERVICES.map((card, i) => <ServiceCardItem key={card.title} card={card} delay={i * 100} />)}
      </div>
    </section>
  );
}

function ProblemItemCard({ item, index }: { item: ProblemItem; index: number }) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.15 });
  const [hovered, setHovered] = useState(false);

  return (
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "linear-gradient(135deg,rgba(0,243,255,0.05),rgba(255,0,234,0.05))",
        borderLeft: "5px solid #00f3ff",
        borderRadius: 20, padding: "3rem", position: "relative", overflow: "hidden",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? (hovered ? "translateX(15px)" : "translateX(0)") : "translateX(-100px)",
        transition: `all 0.6s cubic-bezier(0.4,0,0.2,1) ${index * 100}ms`,
        boxShadow: hovered ? "0 15px 50px rgba(0,243,255,0.2)" : "none",
      }}
    >
      <div style={{
        fontFamily: "'Orbitron',sans-serif", fontSize: "4rem", fontWeight: 900,
        background: "linear-gradient(135deg,#00f3ff,#8b5cf6)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "1.5rem",
      }}>{item.number}</div>
      <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "2rem", color: "#fff", marginBottom: "1.5rem", fontWeight: 700 }}>{item.title}</h3>
      {item.paragraphs.map((p, i) => <p key={i} style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.9, fontSize: "1.1rem", marginBottom: "1rem" }}>{p}</p>)}
      <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.9, fontSize: "1.1rem" }}><strong>{item.bold}</strong></p>
    </div>
  );
}

function ProblemsSection() {
  return (
    <section id="problemes" style={{ padding: "10rem 5%", background: "linear-gradient(180deg,#0a0a0f 0%,#050508 100%)" }}>
      <SectionHeader tag="La Réalité" title="Les Vraies Raisons de Votre Échec" subtitle="Pourquoi votre activité ne prospère pas sur les réseaux sociaux" />
      <div style={{ maxWidth: 1100, margin: "4rem auto 0", display: "flex", flexDirection: "column", gap: "3rem" }}>
        {PROBLEMS.map((item, i) => <ProblemItemCard key={item.number} item={item} index={i} />)}
      </div>
    </section>
  );
}

function SolutionCardItem({ card, index }: { card: SolutionCard; index: number }) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.15 });
  const [hovered, setHovered] = useState(false);

  return (
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? "#00f3ff" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 25, padding: "3rem", textAlign: "center", position: "relative", overflow: "hidden",
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? hovered ? "translateY(-15px) scale(1.05)" : "scale(1) rotateY(0deg)"
          : "scale(0.8) rotateY(90deg)",
        transition: `all 0.6s cubic-bezier(0.68,-0.55,0.265,1.55) ${index * 100}ms`,
        boxShadow: hovered ? "0 25px 60px rgba(0,243,255,0.3)" : "none",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: "linear-gradient(90deg,#00f3ff,#ff00ea)",
        transform: hovered ? "scaleX(1)" : "scaleX(0)", transition: "transform 0.5s ease",
      }} />
      <div style={{
        fontSize: "4rem", marginBottom: "2rem",
        transform: hovered ? "scale(1.3) rotate(360deg)" : "scale(1)",
        transition: "all 0.5s ease",
      }}>{card.icon}</div>
      <h4 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "1.5rem", color: "#00f3ff", marginBottom: "1rem", fontWeight: 700 }}>{card.title}</h4>
      <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, fontSize: "1.05rem" }}>{card.description}</p>
    </div>
  );
}

function SolutionsSection() {
  return (
    <section id="solutions" style={{ padding: "10rem 5%", background: "#050508", position: "relative" }}>
      <SectionHeader tag="La Solution" title="Une Plateforme Qui Vous Appartient" subtitle="Reprenez le contrôle total de votre entreprise digitale" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "3rem", maxWidth: 1400, margin: "4rem auto 0" }}>
        {SOLUTIONS.map((card, i) => <SolutionCardItem key={card.title} card={card} index={i} />)}
      </div>
    </section>
  );
}

function CTASection() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.2 });

  return (
    <section style={{ padding: "10rem 5%", background: "linear-gradient(135deg,#0a0a0f 0%,#050508 50%,#0a0a0f 100%)", position: "relative", overflow: "hidden" }}>
      <div ref={ref} style={{
        maxWidth: 1000, margin: "0 auto", textAlign: "center", padding: "6rem 4rem",
        background: "linear-gradient(135deg,rgba(0,243,255,0.1),rgba(255,0,234,0.1))",
        border: "2px solid rgba(0,243,255,0.3)", borderRadius: 35, position: "relative", overflow: "hidden",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1)" : "scale(0.9)",
        transition: "all 0.8s ease",
      }}>
        <div style={{
          position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%",
          background: "radial-gradient(circle,rgba(0,243,255,0.15) 0%,transparent 70%)",
          animation: "rotateBg 15s linear infinite",
        }} />
        <h2 style={{
          fontFamily: "'Orbitron',sans-serif", fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 900, marginBottom: "2rem",
          position: "relative", zIndex: 1,
          background: "linear-gradient(135deg,#fff,#00f3ff)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Prêt à Transformer Votre Vision en Réalité ?</h2>
        <p style={{ fontSize: "1.4rem", color: "rgba(255,255,255,0.8)", marginBottom: "3rem", position: "relative", zIndex: 1, lineHeight: 1.8 }}>
          World Connect crée des solutions digitales complètes sur mesure : sites web ultra-modernes, applications mobiles performantes, logiciels professionnels et systèmes d'automatisation IA. 100% personnalisé, 100% à vous.
        </p>
        <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          <Btn href="https://www.world-connect.world/index.html" primary>Accéder à la Plateforme</Btn>
          <Btn href="https://www.world-connect.world/messages.html">Analyse Gratuite — Sans Engagement</Btn>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: "#050508", padding: "4rem 5%", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "3rem" }}>
        {[
          { title: "World Connect", links: [], text: "Solutions digitales innovantes pour entreprises ambitieuses. Développement complet de A à Z." },
          { title: "Services", links: [["#services","Sites Web & Design"],["#services","Applications Mobile"],["#services","Logiciels Sur Mesure"],["#services","Intelligence Artificielle"]], text: "" },
          { title: "Entreprise", links: [["https://www.world-connect.world/index.html","À Propos"],["https://www.world-connect.world/index.html","Portfolio"],["https://www.world-connect.world/messages.html","Contact"]], text: "" },
          { title: "Contact", links: [["https://www.world-connect.world/messages.html","Envoyer un Message"],["https://www.world-connect.world/index.html","Plateforme"]], text: "" },
        ].map((section) => (
          <div key={section.title}>
            <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "1.3rem", marginBottom: "1.5rem", color: "#00f3ff" }}>{section.title}</h3>
            {section.text && <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>{section.text}</p>}
            {section.links.map(([href, label]) => (
              <a key={label} href={href} style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, textDecoration: "none", display: "block", marginBottom: "0.8rem", transition: "color 0.3s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#00f3ff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              >{label}</a>
            ))}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
        © 2026 World Connect. Tous droits réservés. | Développement Complet • Design Moderne • Solutions Professionnelles
      </div>
    </footer>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function WorldConnect() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const win = window.innerHeight;
      const full = document.documentElement.scrollHeight;
      const s = window.scrollY;
      setScrollProgress((s / (full - win)) * 100);
      setScrolled(s > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Global styles via <style> tag injected into head */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; background: #050508; color: #fff; overflow-x: hidden; }
        @keyframes float {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(50px,-50px) scale(1.1); }
          66% { transform: translate(-30px,30px) scale(0.9); }
        }
        @keyframes particleFloat {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-100vh) translateX(100px); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,243,255,0.4); }
          50% { box-shadow: 0 0 0 20px rgba(0,243,255,0); }
        }
        @keyframes gradientFlow {
          0%,100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes logoRotate {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes rotate3d {
          0% { transform: translate(0,0) rotate(0deg) scale(1); }
          33% { transform: translate(50px,-30px) rotate(120deg) scale(1.1); }
          66% { transform: translate(-40px,40px) rotate(240deg) scale(0.9); }
          100% { transform: translate(0,0) rotate(360deg) scale(1); }
        }
        @keyframes rotateBg {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Scroll Progress Bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, height: 4, zIndex: 10000,
        width: `${scrollProgress}%`,
        background: "linear-gradient(90deg,#00f3ff,#ff00ea,#8b5cf6)",
        boxShadow: "0 0 10px rgba(0,243,255,0.5)",
        transition: "width 0.1s ease",
      }} />

      <AnimatedBackground />
      <Particles />
      <Navbar scrolled={scrolled} />
      <HeroSection />
      <StatsSection />
      <ServicesSection />
      <ProblemsSection />
      <SolutionsSection />
      <CTASection />
      <Footer />
    </>
  );
}
