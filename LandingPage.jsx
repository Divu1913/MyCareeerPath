import { useState, useRef, useEffect } from "react";
import JobsPage from "./JobsPage";
import ChatDialog from "./src/ChatDialog.jsx";
import ProfileDropdown from "./src/components/ProfileDropdown.jsx";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  ExternalLink,
  Menu,
  ShieldCheck,
  User,
  X,
  Building2,
  Megaphone,
  Laptop,
  Truck,
  Factory,
  Headset,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
} from "lucide-react";

const navItems = [
  { label: "Services", icon: ShieldCheck },
  { label: "Job Alerts", icon: BriefcaseBusiness },
];

export default function LandingPage({ onLogin, onRegister, onRecruiters, onExploreCategorySelect, onSearch, onDashboard, user, onProfile, onSettings, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [roleQuery, setRoleQuery] = useState("");
  const [expLevel, setExpLevel] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [activeTab, setActiveTab] = useState("category");
  const [activeCategory, setActiveCategory] = useState("Healthcare & Medical");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const track1Ref = useRef(null);
  const track2Ref = useRef(null);
  const exploreJobsRef = useRef(null);

  const handleCategorySelect = (categoryName) => {
    setActiveCategory(categoryName);
    onExploreCategorySelect?.(categoryName);
  };

  const exploreCategories = [
    { name: "Office & Administration", icon: Building2, jobs: "120 Jobs", iconBg: "#3B5BDB", gridColumn: 1, gridRow: 1, featured: false },
    { name: "Sales & Marketing", icon: Megaphone, jobs: "85 Jobs", iconBg: "#9C36B5", gridColumn: 2, gridRow: 1, featured: false },
    { name: "IT & Technology", icon: Laptop, jobs: "85 Jobs", iconBg: "#0B8457", gridColumn: 3, gridRow: "1 / span 2", featured: true },
    { name: "Delivery & Logistics", icon: Truck, jobs: "85 Jobs", iconBg: "#1971C2", gridColumn: 4, gridRow: 1, featured: false },
    { name: "Manufacturing & Factory", icon: Factory, jobs: "70 Jobs", iconBg: "#E8590C", gridColumn: 5, gridRow: 1, featured: false },
    { name: "Customer Support", icon: Headset, jobs: "97 Jobs", iconBg: "#0C8599", gridColumn: 1, gridRow: 2, featured: false },
    { name: "Retail & Store Jobs", icon: ShoppingBag, jobs: "85 Jobs", iconBg: "#E64980", gridColumn: 2, gridRow: 2, featured: false },
    { name: "Healthcare & Medical", icon: HeartPulse, jobs: "27 Jobs", iconBg: "#E03131", gridColumn: 4, gridRow: 2, featured: false, active: true },
    { name: "Education & Training", icon: GraduationCap, jobs: "25 Jobs", iconBg: "#3B5BDB", gridColumn: 5, gridRow: 2, featured: false },
  ];

  const workModeCards = [
    { name: "Remote", jobs: "198 Jobs", iconBg: "#3B5BDB" },
    { name: "Hybrid", jobs: "156 Jobs", iconBg: "#9C36B5" },
    { name: "On-site", jobs: "214 Jobs", iconBg: "#0B8457" },
    { name: "Freelance", jobs: "78 Jobs", iconBg: "#E8590C" },
    { name: "Internship", jobs: "54 Jobs", iconBg: "#0C8599" },
  ];

  const scrollExploreCategories = (direction) => {
    if (!exploreJobsRef.current) return;
    exploreJobsRef.current.scrollBy({
      left: direction === "next" ? 420 : -420,
      behavior: "smooth",
    });
  };

  const handleExploreCardSelect = (categoryName) => {
    setActiveCategory(categoryName);
    onExploreCategorySelect?.(categoryName);
  };

  const roles = [
    { icon:"🔧", title:"Technician", count:"535 openings" },
    { icon:"💻", title:"Admin / Office Assistant", count:"507 openings" },
    { icon:"🍳", title:"Restaurant Staff / Kitchen", count:"476 openings" },
    { icon:"🏭", title:"Manufacturing / Production", count:"474 openings" },
    { icon:"📋", title:"Receptionist / Front Office", count:"474 openings" },
    { icon:"🏋️", title:"Fitness Trainer / Dietician", count:"64 openings" },
    { icon:"❄️", title:"AC Technician", count:"59 openings" },
    { icon:"🩺", title:"Doctor / Dentist", count:"57 openings" },
    { icon:"⚖️", title:"Legal", count:"57 openings" },
    { icon:"✍️", title:"Content Writing", count:"51 openings" },
    { icon:"🎨", title:"Graphic Designer", count:"216 openings" },
    { icon:"🧹", title:"Office Help / Peon", count:"200 openings" },
    { icon:"👶", title:"Maid / Baby Care", count:"197 openings" },
    { icon:"📷", title:"Photography / Video Editing", count:"181 openings" },
    { icon:"🛋️", title:"Interior Designer", count:"168 openings" },
    { icon:"🎓", title:"Corporate Trainer", count:"15 openings" },
    { icon:"🖨️", title:"DTP Operator / Printer", count:"14 openings" },
    { icon:"🚰", title:"Plumber", count:"12 openings" },
    { icon:"🏥", title:"Ward Helper", count:"9 openings" },
    { icon:"🖌️", title:"Painter", count:"8 openings" },
  ];

  function RoleCard({ r }) {
    return (
      <div className="flex-none flex items-center gap-[14px] bg-white border border-[#e6e8eb] rounded-[14px] px-[22px] py-[16px] min-w-[260px] whitespace-nowrap transition-all duration-200 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:border-[#d5dbd8] hover:-translate-y-[2px]">
        <div className="w-11 h-11 rounded-full bg-[#f4f6f5] flex items-center justify-center text-xl shrink-0">
          {r.icon}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-semibold text-[15px] text-[#1a1a1a]">
            {r.title}
            <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] opacity-55" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 6l6 6-6 6"/>
            </svg>
          </div>
          <div className="text-[13px] text-[#6b7280] mt-[2px]">{r.count}</div>
        </div>
      </div>
    );
  }

  const row1 = roles.slice(0, 10);
  const row2 = roles.slice(10, 20);

  return (
    <main className="flex min-h-screen flex-col bg-white font-sans text-[#101010]">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#fffdf5]/95 backdrop-blur">
        <div className="mx-auto flex h-[84px] max-w-7xl items-center justify-between gap-6 px-6">
          <a href="#home" aria-label="MyCareerPath home" className="flex shrink-0 items-center gap-3 text-[#1E3A8A]">
            <img
              src="/assets/logo.png"
              alt="MyCareerPath Logo"
              className="h-10 w-auto rounded-lg object-contain"
            />
            <span className="text-[20px] font-bold leading-tight tracking-[-0.04em] sm:text-[22px]">My Career <span className="text-[#F97316]">Path</span></span>
          </a>
          <nav className="hidden flex-1 items-center gap-9 lg:flex">
            {navItems.map(({ label, icon: Icon }) => <a key={label} href={`#${label.toLowerCase().replace(" ", "-")}`} className="flex items-center gap-2 text-base font-medium text-slate-900 transition hover:text-[#F97316]"><Icon size={20} strokeWidth={1.8} className="text-[#F97316]" />{label}</a>)}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <>
                {/* Logged-in CTAs: an explicit "Go to Dashboard" pill routes the
                    user to their role-appropriate view via `onDashboard`, and
                    the avatar pill (ProfileDropdown) sits beside it for the
                    profile menu / sign-out. Both replace the Register/Login
                    pair that anonymous visitors see. */}
                <button
                  type="button"
                  onClick={onDashboard}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#16306f] focus:outline-none focus:ring-2 focus:ring-[var(--theme-orange)]"
                >
                  Go to Dashboard
                  <ArrowRight size={16} />
                </button>
                <ProfileDropdown
                  user={user}
                  onProfile={onProfile}
                  onDashboard={onDashboard}
                  onSettings={onSettings}
                  onLogout={onLogout}
                />
              </>
            ) : (
              <>
                <button type="button" onClick={onRegister} className="rounded-xl bg-[#F97316] px-7 py-3 text-base font-bold text-white transition hover:bg-[#ea580c]">Register</button>
                <button type="button" onClick={onLogin} className="rounded-xl border border-[#1E3A8A] bg-white px-8 py-3 text-base font-semibold text-[#1E3A8A] transition hover:bg-[#eff4ff]">Login</button>
              </>
            )}
            <span className="mx-2 h-7 w-px bg-slate-300" />
            <button type="button" onClick={onRecruiters} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-base font-medium text-slate-600 transition hover:bg-slate-50">For Recruiters <ExternalLink size={17} /></button>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="rounded-lg p-2 text-slate-800 hover:bg-orange-50 lg:hidden" aria-label="Toggle navigation" aria-expanded={isOpen}>{isOpen ? <X size={25} /> : <Menu size={25} />}</button>
        </div>
        {isOpen && (
          <div className="border-t border-slate-200 bg-[#fffdf5] px-6 py-4 lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1">
              {navItems.map(({ label, icon: Icon }) => (
                <a key={label} href="#home" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 font-medium text-slate-800 hover:bg-orange-50">
                  <Icon size={19} className="text-[#F97316]" />{label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-4">
                {user ? (
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => { setIsOpen(false); onDashboard?.(); }}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#16306f]"
                    >
                      Go to Dashboard
                      <ArrowRight size={16} />
                    </button>
                    <ProfileDropdown
                      user={user}
                      onProfile={() => { setIsOpen(false); onProfile?.(); }}
                      onDashboard={() => { setIsOpen(false); onDashboard?.(); }}
                      onSettings={() => { setIsOpen(false); onSettings?.(); }}
                      onLogout={() => { setIsOpen(false); onLogout?.(); }}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => { setIsOpen(false); onRegister(); }} className="rounded-xl bg-[#F97316] py-3 font-bold text-white">Register</button>
                    <button type="button" onClick={() => { setIsOpen(false); onLogin(); }} className="rounded-xl border border-[#1E3A8A] bg-white py-3 font-semibold text-[#1E3A8A]">Login</button>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => { setIsOpen(false); onRecruiters?.(); }} className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 font-medium text-slate-600">For Recruiters <ExternalLink size={17} /></button>
            </nav>
          </div>
        )}
      </header>

      <div className="flex-1">
        <section id="home" className="relative bg-[radial-gradient(ellipse_at_center_30%,#fffdf5_0%,#fff8d3_100%)] px-4 pb-8 pt-16 sm:px-6 sm:pt-20 lg:pt-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
            <h1 className="text-4xl font-black tracking-tight text-black sm:text-5xl lg:text-[48px]">Search Your Dream Job</h1>
            <p className="mt-4 text-lg text-[#6e6c66] sm:text-xl">Discover 5 lakh+ Job Opportunities</p>

            <form onSubmit={(event) => { event.preventDefault(); onSearch?.({ role: roleQuery, experience: expLevel, location: locationQuery }); }} className="mt-14 flex w-full max-w-[1000px] flex-col rounded-[30px] bg-white p-2 shadow-[0_20px_40px_rgba(191,164,68,0.14)] ring-1 ring-black/5 md:flex-row md:items-center">
              <label className="flex min-w-0 flex-1 items-center border-b border-[#dedede] px-7 py-4 md:border-b-0 md:border-r"><input id="search-skills" name="skills" aria-label="Skills or roles" value={roleQuery} onChange={(event) => setRoleQuery(event.target.value)} className="w-full bg-transparent text-lg text-[#252525] outline-none placeholder:text-[#b3b7bb]" placeholder="Enter Skills/Roles" /></label>
              <label className="relative flex min-w-0 flex-1 items-center border-b border-[#dedede] px-7 py-4 md:border-b-0 md:border-r"><select id="search-experience" name="experience" aria-label="Experience" value={expLevel} onChange={(event) => setExpLevel(event.target.value)} className="w-full appearance-none bg-transparent text-lg text-[#b3b7bb] outline-none"><option value="">Select Experience</option><option>Fresher</option><option>1–3 Years</option><option>3+ Years</option></select><ChevronDown size={21} className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 text-[#77776e]" /></label>
              <label className="flex min-w-0 flex-1 items-center px-7 py-4"><input id="search-location" name="location" aria-label="Location" value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} className="w-full bg-transparent text-lg text-[#252525] outline-none placeholder:text-[#b3b7bb]" placeholder="Enter Location" /></label>
              <button type="submit" className="rounded-2xl border border-[#d6a800] bg-[#fffbed] px-12 py-4 text-lg font-semibold text-[#5a4600] transition hover:bg-[#ffefb4] md:ml-2">Search</button>
            </form>

            <div className="mt-8 inline-flex items-center rounded-full bg-[#f4f6fb] p-1.5 pl-5 shadow-sm ring-1 ring-[#e5e7ee]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8ebf3] text-[#2c3e6a]">
                <User size={16} fill="#2c3e6a" />
              </span>
              <span className="ml-3 text-base font-medium text-[#2c3e6a]">Walkin drives near you - register now</span>
              <span className="ml-3 inline-flex items-center rounded-md bg-[#2c3e6a] px-2 py-0.5 text-xs font-bold text-white">Live</span>
              <span className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#e8ebf3] text-[#2c3e6a]">
                <ArrowRight size={16} />
              </span>
            </div>

            <div className="relative mt-6 w-full max-w-5xl px-4 sm:px-6">
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src="/people.png"
                  alt="Diverse happy professionals and students celebrating career success"
                  className="-mt-[25%] h-auto w-full object-contain"
                />
              </div>
              <div className="pointer-events-none absolute -bottom-2 left-1/2 h-6 w-3/4 -translate-x-1/2 rounded-full bg-amber-900/10 blur-2xl" />
            </div>
          </div>
        </section>

        <section className="w-full px-4 py-20" style={{ background: "#FDF0E8" }}>
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-center justify-center gap-4">
              <button aria-label="Previous" onClick={() => scrollExploreCategories("prev")} className="text-[#8B7F77] transition hover:text-[#1E3A5F]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="rounded-full bg-white px-6 py-2 text-sm font-semibold tracking-[0.22em] text-[#1E3A5F] shadow-sm">EXPLORE JOBS</span>
              <button aria-label="Next" onClick={() => scrollExploreCategories("next")} className="text-[#8B7F77] transition hover:text-[#1E3A5F]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="mb-12 flex justify-center">
              <div className="inline-flex rounded-full bg-[#F5E4D8] p-1.5">
                <button onClick={() => setActiveTab("category")} className={`rounded-full px-8 py-2.5 text-sm font-medium transition-all ${activeTab === "category" ? "bg-[#1E3A5F] text-white shadow-[0_8px_20px_rgba(30,58,95,0.22)]" : "text-[#6B5A4C] hover:text-[#1E3A5F]"}`}>By category</button>
                <button onClick={() => setActiveTab("workmode")} className={`rounded-full px-8 py-2.5 text-sm font-medium transition-all ${activeTab === "workmode" ? "bg-[#1E3A5F] text-white shadow-[0_8px_20px_rgba(30,58,95,0.22)]" : "text-[#6B5A4C] hover:text-[#1E3A5F]"}`}>By work mode</button>
              </div>
            </div>

            {activeTab === "category" && (
              <div ref={exploreJobsRef} className="overflow-x-auto pb-2">
                <div className="grid min-w-[1120px] gap-[16px]" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gridTemplateRows: "repeat(2, auto)" }}>
                  {exploreCategories.map(({ name, icon: Icon, jobs, iconBg, gridColumn, gridRow, featured, active }) => {
                    const isSelected = activeCategory === name || active;
                    return (
                      <button key={name} onClick={() => handleExploreCardSelect(name)} style={{ gridColumn, gridRow }} className={`flex flex-col items-center justify-center gap-4 rounded-[12px] bg-white px-5 py-8 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(30,58,95,0.08)] ${featured ? "min-h-[380px]" : "min-h-[178px]"} ${isSelected ? "border border-transparent shadow-[0_6px_18px_rgba(30,58,95,0.05)]" : "border border-transparent shadow-[0_6px_18px_rgba(30,58,95,0.05)]"}`}>
                        <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: iconBg }}><Icon size={24} className="text-white" strokeWidth={1.8} /></span>
                        <span className="text-[13px] font-medium leading-snug text-[#1E3A5F]">{name}</span>
                        <span className="text-[12px] text-[#9C8A7D]">{jobs}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "workmode" && (
              <div className="mx-auto max-w-[1120px] pb-2">
                <div className="flex items-stretch justify-between gap-5">
                  {workModeCards.map(({ name, jobs, iconBg }) => (
                    <button key={name} onClick={() => handleExploreCardSelect(name)} className="flex h-[178px] w-[200px] min-w-[200px] flex-col items-center justify-center gap-4 rounded-[12px] bg-white px-5 py-8 text-center shadow-[0_6px_18px_rgba(30,58,95,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(30,58,95,0.08)]">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: iconBg }}><BriefcaseBusiness size={24} className="text-white" strokeWidth={1.8} /></span>
                      <span className="text-[13px] font-medium leading-snug text-[#1E3A5F]">{name}</span>
                      <span className="text-[12px] text-[#9C8A7D]">{jobs}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="py-20 px-4" style={{ background: "#F0F3E4" }}>
          <div className="max-w-7xl mx-auto">
            <h2 className="mb-2 text-center text-[32px] font-extrabold tracking-tight text-[#2B3A1E]">Trending job roles on <span className="text-[#3B5BDB]">My Career Path</span></h2>
            <p className="mb-10 text-center text-[17px] font-semibold text-[#C0392B]">These are the most popular and actively hiring job roles in your city. Don’t miss the opportunity—apply now before positions are filled.</p>
            <div className="relative overflow-hidden w-full max-w-[1320px] mx-auto h-[120px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-white to-transparent" />
              <div ref={track1Ref} className="flex gap-4 px-2 animate-scroll-rtl hover:[animation-play-state:paused] items-center" style={{ width: 'max-content' }}>
                {row1.concat(row1).map((r, i) => <RoleCard key={i} r={r} />)}
              </div>
            </div>
            <div className="relative overflow-hidden w-full max-w-[1320px] mx-auto mt-4 h-[120px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-white to-transparent" />
              <div ref={track2Ref} className="flex gap-4 px-2 animate-scroll-rtl hover:[animation-play-state:paused] items-center" style={{ width: 'max-content' }}>
                {row2.concat(row2).map((r, i) => <RoleCard key={i} r={r} />)}
              </div>
            </div>
            <div className="mt-9 h-[58px]" />
          </div>
        </section>

        <section className="w-full flex justify-center py-10 px-4" style={{ background: "#EDF1F3" }}>
          <div className="max-w-6xl w-full bg-white border border-gray-200 rounded-[28px] shadow-[0_10px_30px_rgba(20,40,80,0.06)] px-8 md:px-14 py-10 flex flex-wrap items-center justify-between gap-8">
            <div className="max-w-md">
              <h2 className="text-[#0F6E56] text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Need help with a service?</h2>
              <p className="text-[#5C6B72] text-base md:text-lg leading-relaxed mb-6">We are available all days of the week from<br />10 am to 6 pm</p>
               <button onClick={() => setIsChatOpen(true)} className="inline-block bg-[#0B8457] text-white font-bold text-base tracking-wide px-6 py-3 rounded-lg hover:bg-[#096b47] transition">10505</button>
            </div>
            <div className="w-[560px] max-w-full flex-shrink-0">
              <img src="/profile.webp" alt="Support representative" className="w-full h-auto block rounded-2xl" />
            </div>
          </div>
        </section>

        <ChatDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} userRole="user" />
      </div>
    </main>
  );
}
