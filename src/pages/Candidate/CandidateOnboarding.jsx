import { useState } from "react";
import { api, formatAccountError } from "../../api.js";

const SKILL_SUGGESTIONS = [
  "React", "Node.js", "Python", "FastAPI", "SQL", "MongoDB", "Data Analysis",
  "HTML", "CSS", "JavaScript", "Excel", "Project Management", "Customer Service",
  "Communication", "Electrician", "Plumbing", "Welding", "Driver", "Carpentry"
];

export default function CandidateOnboarding({ user, onComplete, onBack }) {
  const userId = user?.id || user?._id || "anon";
  const [step, setStep] = useState(1);

  // Form states
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [degree, setDegree] = useState("");
  const [institution, setInstitution] = useState("");
  const [eduYear, setEduYear] = useState("");
  const [experienceLevel, setExperienceLevel] = useState(""); // "fresher" | "intermediate" | "experienced"
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const nextStep = () => setStep((s) => Math.min(s + 1, 6));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const addSkill = (name) => {
    const t = name.trim();
    if (t && !skills.includes(t)) {
      setSkills([...skills, t]);
    }
    setSkillInput("");
  };

  const removeSkill = (name) => {
    setSkills(skills.filter((s) => s !== name));
  };

  const handleFinish = async () => {
    setSaving(true);
    setError("");
    try {
      // 1. Save core details to backend
      const profilePayload = {
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        website: portfolioUrl.trim() || undefined,
      };
      const updatedUser = await api.updateProfile(userId, profilePayload);

      // 2. Save rich profile fields (onboarding wizard info) to local storage.
      // `onboarding_complete` is the gate App.jsx reads via `isProfileComplete`
      // to decide whether to route the candidate straight to the dashboard on
      // next sign-in. It is set only after a successful wizard finish so a
      // mid-wizard refresh can't be mistaken for a completed profile.
      const richProfile = {
        dob,
        gender,
        highest_education: { degree, institution, year: eduYear },
        experience_level: experienceLevel,
        skills,
        resume_url: resumeUrl.trim(),
        portfolio_url: portfolioUrl.trim(),
        // Also sync local storage profile fields so profile page sees them
        education: degree ? [{ id: "onboarding-edu", degree, institution, startYear: eduYear, endYear: eduYear, current: false }] : [],
        onboarding_complete: true,
      };
      
      const stored = JSON.parse(localStorage.getItem(`mcp_profile_${userId}`) || "{}");
      localStorage.setItem(
        `mcp_profile_${userId}`,
        JSON.stringify({ ...stored, ...richProfile })
      );

      // 3. Callback to complete onboarding
      onComplete?.(updatedUser);
    } catch (err) {
      setError(formatAccountError(err, "Onboarding save failed."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-cream)] flex flex-col">
      {/* Top navigation header — brand logo + "Back to Home" exit hatch.
          The logo is the same MyCareerPath mark used on the landing page so
          users always recognise it; clicking the logo (or the "Back to Home"
          button) routes them back to the landing page via `onBack`. */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-[#fffdf5]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            aria-label="MyCareerPath home"
            className="flex items-center gap-2.5 text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[var(--theme-orange)] rounded-lg"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E3A8A]" aria-hidden="true">
              <svg viewBox="0 0 32 32" className="h-5 w-5 fill-none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 23.5 13 17.5l4 4L25 12" className="text-white" />
                <path d="M18.5 12H25v6.5" className="text-[#F97316]" />
              </svg>
            </span>
            <span className="text-[18px] font-bold leading-tight tracking-[-0.04em] sm:text-[20px]">
              My Career <span className="text-[#F97316]">Path</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--theme-orange)]"
          >
            <span aria-hidden="true">←</span>
            Back to Home
          </button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[var(--theme-border)] overflow-hidden">
          {/* Header Progress Bar */}
          <div className="bg-slate-50 border-b border-[var(--theme-border)] px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-md font-bold text-[var(--theme-navy)]">Candidate Onboarding</h1>
              <p className="text-xs text-slate-500">Let's set up your career path profile</p>
            </div>
            <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              Step {step} of 6
            </span>
          </div>

        {/* Form Body */}
        <div className="p-6 min-h-[300px] flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* STEP 1: Full Name */}
            {step === 1 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-800">What is your name?</h2>
                <p className="text-xs text-slate-500">We'll use this for your job applications and recruiter interactions.</p>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Full Name</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>
            )}

            {/* STEP 2: DOB, Gender & Optional Email */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">Tell us a bit about yourself</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Date of Birth</span>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Gender</span>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white outline-none focus:border-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Prefer not to say</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Email Address (Optional)</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>
            )}

            {/* STEP 3: Education */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">Your highest education</h2>
                <p className="text-xs text-slate-500">Provide details of your highest academic qualification.</p>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Degree / Certification</span>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>Select Education Level</option>
                    <option value="10th Pass (SSC)">10th Pass (SSC)</option>
                    <option value="12th Pass (HSC)">12th Pass (HSC)</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Undergraduate (UG / Bachelor's)">Undergraduate (UG / Bachelor's)</option>
                    <option value="Postgraduate (PG / Master's)">Postgraduate (PG / Master's)</option>
                    <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                  </select>
                </label>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Institution</span>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. SGBAU University"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Passing Year</span>
                      <input
                        type="number"
                        min="1980"
                        max="2030"
                        value={eduYear}
                        onChange={(e) => setEduYear(e.target.value)}
                        placeholder="2024"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Experience Level */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">What is your experience level?</h2>
                <div className="grid gap-3">
                  {[
                    { key: "fresher", title: "Fresher / Student", desc: "No commercial work experience yet" },
                    { key: "intermediate", title: "Skilled Worker / Mid-Level", desc: "1-3 years of work experience or skilled trade" },
                    { key: "experienced", title: "Experienced Professional", desc: "3+ years of professional/industry experience" }
                  ].map((lvl) => (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setExperienceLevel(lvl.key)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        experienceLevel === lvl.key
                          ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <p className="font-semibold text-sm text-slate-800">{lvl.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{lvl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Skills */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">Select your skills</h2>
                
                {/* Current */}
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {skills.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No skills selected</span>
                  ) : (
                    skills.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1">
                        {s}
                        <button type="button" onClick={() => removeSkill(s)} className="hover:bg-white/20 rounded-full px-1">×</button>
                      </span>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Type a skill..."
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill(skillInput);
                      }
                    }}
                  />
                  <button type="button" onClick={() => addSkill(skillInput)} className="bg-slate-800 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-slate-900">
                    Add
                  </button>
                </div>

                {/* AI Suggestions */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Recommended Skills</h3>
                  <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                    {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSkill(s)}
                        className="rounded-full border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 px-3 py-1 text-xs font-semibold text-slate-600 transition"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Resume Upload / Portfolio */}
            {step === 6 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Resume & Links</h2>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Optional</span>
                </div>
                <p className="text-xs text-slate-500">
                  This step is completely optional and skippable for blue-collar or skilled-worker roles.
                </p>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Portfolio or Website URL</span>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Link to Resume (Drive / Dropbox)</span>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>
            )}

          </div>

          {/* Action buttons */}
          <div className="mt-8 flex justify-between gap-3 pt-4 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {error && (
              <p className="text-xs text-red-600 font-semibold self-center flex-1 text-right mr-2">{error}</p>
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={step === 1 && !fullName.trim()}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-semibold shadow-md disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-semibold shadow-md disabled:opacity-60"
              >
                {saving ? "Finishing..." : "Finish Onboarding"}
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
