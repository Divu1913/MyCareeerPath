import { useState } from "react";
import ChatDialog from "./src/ChatDialog.jsx";

// ---------- Static data ----------

const regularSkills = [
  "Accounting", "Banking", "Civil Engineering", "C++",
  "Data Analysis", "Typing", "Data Analytics", "Content Marketing",
  "Digital Marketing", "Java", "Data Science", "Python",
  "React Native", "Enterprise Sales", ".NET", "View All"
];

const localSkills = [
  "Delivery Executive", "Housekeeping Staff", "Cleaner", "Janitor",
  "Factory Worker", "Packing Staff", "Warehouse Associate", "Driver",
  "Security Guard", "Construction Helper", "Laundry Worker", "Farm Worker",
  "Mechanic Helper", "Salon Assistant", "Tailoring Assistant",
  "Vegetable & Fruit Shop Staff", "Kirana Store Helper",
  "Office Boy / Office Assistant", "Telecaller"
];

const popularJobs = [
  "IT & Software", "Office & Administration", "Customer Support / BPO",
  "Sales & Marketing", "Healthcare & Medical", "Education & Training",
  "Retail & Store", "Delivery & Logistics", "Manufacturing & Factory",
  "Skilled Trades & Local Services"
];

const cities = ["Pune", "Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Chennai", "Ahmedabad", "Kolkata", "Nagpur", "Surat"];

// Amravati, Maharashtra — local companies and industries
const amravatiAreas = ["Amravati", "Badnera", "MIDC Amravati", "Nandgaon Peth", "Rajapeth", "Camp Amravati"];

const amravatiCompanies = [
  "Siyaram Silk Mills Ltd", "Damodar Industries Ltd", "Aasutosh Spinning & Textile Industries",
  "Gajanan Sakhar Karkhana", "Khodke Agro Products", "Rattanindia Power Ltd",
  "Anjali Electrodes Pvt. Ltd.", "Balkrishna Chemical Industries", "Renuka Industries",
  "Vinayaka Industries", "Indiabulls Power Ltd", "VHM Industries"
];

const companyRoles = ["Machine Operator", "Factory Helper", "Production Supervisor", "Quality Control Staff", "Store / Warehouse Assistant"];

const amravatiIndustries = [
  "Textile & Spinning Mills", "Agro & Food Processing", "Sugar Industry",
  "Power & Energy", "Chemicals & Fertilizers", "Engineering & Machinery",
  "Cotton Trading & Ginning", "Retail & Local Trade", "Transport & Logistics",
  "Education & Government Services"
];

const industryData = {
  "Textile & Spinning Mills": { roles: ["Loom Operator", "Spinning Machine Helper", "Quality Checker", "Production Supervisor", "Packing Staff"], companies: ["Siyaram Silk Mills Ltd", "Aasutosh Spinning & Textile Industries", "Damodar Industries Ltd"] },
  "Agro & Food Processing": { roles: ["Processing Helper", "Packing Staff", "Quality Checker", "Machine Operator", "Warehouse Assistant"], companies: ["Khodke Agro Products", "Renuka Industries"] },
  "Sugar Industry": { roles: ["Mill Operator", "Boiler Helper", "Packing Staff", "Quality Control Staff", "Warehouse Assistant"], companies: ["Gajanan Sakhar Karkhana"] },
  "Power & Energy": { roles: ["Plant Helper", "Maintenance Technician", "Control Room Assistant", "Security Guard", "Store Assistant"], companies: ["Rattanindia Power Ltd", "Indiabulls Power Ltd"] },
  "Chemicals & Fertilizers": { roles: ["Plant Helper", "Lab Assistant", "Packing Staff", "Machine Operator", "Quality Checker"], companies: ["Balkrishna Chemical Industries", "Khodke Agro Products"] },
  "Engineering & Machinery": { roles: ["Fitter", "Welder Helper", "Machine Operator", "Quality Checker", "Store Assistant"], companies: ["Anjali Electrodes Pvt. Ltd.", "Vinayaka Industries", "VHM Industries"] },
  "Cotton Trading & Ginning": { roles: ["Ginning Machine Helper", "Cotton Grader", "Warehouse Assistant", "Loader", "Packing Staff"], companies: ["Local Cotton Traders", "Amravati Ginning Mills"] },
  "Retail & Local Trade": { roles: ["Shop Assistant", "Billing Staff", "Store Helper", "Delivery Staff", "Sales Assistant"], companies: ["Rajapeth Traders", "Camp Road Retailers"] },
  "Transport & Logistics": { roles: ["Driver", "Loader", "Warehouse Helper", "Dispatch Assistant", "Delivery Staff"], companies: ["MSRTC Amravati Depot", "Local Transport Co."] },
  "Education & Government Services": { roles: ["Office Assistant", "Peon", "Clerk", "Data Entry Operator", "Lab Assistant"], companies: ["Local Schools & Colleges", "Zilla Parishad Amravati"] }
};

const companies = {
  "Delivery Executive": ["Swift Logistics", "QuickDrop Delivery", "Zepto Partner Hub"],
  "Housekeeping Staff": ["Sunrise Residency", "CleanCare Services", "Metro Apartments"],
  "Cleaner": ["Sparkle FM Services", "CleanPro Facility", "Urban Maintenance Co."],
  "Janitor": ["CleanCare Facility Services", "Metro Mall Maintenance", "PureSpace FM"],
  "Factory Worker": ["Shree Industries", "Precision Manufacturing", "Apex Plastics Ltd"],
  "Packing Staff": ["FastPack Industries", "Sunrise Packaging Co.", "Prime Foods Packing Unit"],
  "Warehouse Associate": ["FastTrack Logistics", "Om Warehousing", "Cargo Point Storage"],
  "Driver": ["City Cab Services", "Reliable Transport Co.", "Prime Fleet Solutions"],
  "Security Guard": ["SecureLine Services", "Guardian Security Force", "SafeStep Agency"],
  "Construction Helper": ["Nirman Builders", "Skyline Construction", "Foundation Infra Co."],
  "Laundry Worker": ["QuickWash Laundry", "CleanFold Services", "Sparkle Dry Clean"],
  "Farm Worker": ["Green Valley Farms", "Harvest Fresh Agro", "Sunrise Orchards"],
  "Mechanic Helper": ["AutoFix Garage", "Precision Motors", "City Auto Works"],
  "Salon Assistant": ["Glow Beauty Salon", "Style Studio", "Trendy Cuts Salon"],
  "Tailoring Assistant": ["Fashion Stitch Boutique", "Perfect Fit Tailors", "Style Darzi House"],
  "Vegetable & Fruit Shop Staff": ["Fresh Farm Produce", "Green Basket Store", "Daily Fresh Mart"],
  "Kirana Store Helper": ["Sharma Kirana Store", "Local Bazaar", "Apna Store"],
  "Office Boy / Office Assistant": ["Corporate Solutions Pvt Ltd", "Metro Office Services", "BizSupport Co."],
  "Telecaller": ["BrightCall BPO", "ConnectFirst Services", "TalkPoint Solutions"],
  "IT & Software": ["TechNova Solutions", "CodeCraft Systems", "BlueWave IT Services"],
  "Office & Administration": ["Corporate Solutions Pvt Ltd", "Metro Office Services", "BizSupport Co."],
  "Customer Support / BPO": ["BrightCall BPO", "ConnectFirst Services", "TalkPoint Solutions"],
  "Sales & Marketing": ["PeakSell Enterprises", "MarketEdge Co.", "GrowthLine Marketing"],
  "Healthcare & Medical": ["CityCare Hospital", "LifeLine Clinic", "WellNest Healthcare"],
  "Education & Training": ["BrightMinds Academy", "SkillUp Institute", "LearnWell Tutorials"],
  "Retail & Store": ["Big Bazaar Mart", "City Fashion Store", "Star Retail"],
  "Delivery & Logistics": ["Swift Logistics", "QuickDrop Delivery", "Cargo Point Storage"],
  "Manufacturing & Factory": ["Shree Industries", "Precision Manufacturing", "Apex Plastics Ltd"],
  "Skilled Trades & Local Services": ["Nirman Builders", "AutoFix Garage", "CleanCare Services"]
};

const salaryRanges = ["₹9,000 - ₹12,000/month", "₹10,000 - ₹14,000/month", "₹11,000 - ₹15,000/month", "₹12,000 - ₹16,000/month", "₹13,000 - ₹18,000/month"];
const experience = ["Fresher", "0-1 yrs", "1-2 yrs", "Any experience"];

function pick(arr, i) {
  return arr[((i % arr.length) + arr.length) % arr.length];
}

function generateJobsForSkill(skill, skillList) {
  const list = companies[skill] || ["Local Business", "Nearby Shop", "City Services"];
  const idx = skillList.indexOf(skill);
  const jobs = [];
  for (let i = 0; i < 5; i++) {
    jobs.push({
      title: skill,
      company: pick(list, i),
      city: pick(cities, i + idx),
      salary: pick(salaryRanges, i + 1),
      exp: pick(experience, i)
    });
  }
  return jobs;
}

function generateJobsGeneric(titlePool, companyPool, cityPool) {
  const jobs = [];
  for (let i = 0; i < 5; i++) {
    jobs.push({
      title: pick(titlePool, i),
      company: pick(companyPool, i + 1),
      city: pick(cityPool, i),
      salary: pick(salaryRanges, i + 1),
      exp: pick(experience, i)
    });
  }
  return jobs;
}

const TABS = [
  { key: "skills", label: "Jobs by Skills" },
  { key: "localskill", label: "Jobs by Local Skill" },
  { key: "company", label: "Jobs By Company" },
  { key: "industry", label: "Jobs by Industry" },
  { key: "popular", label: "Popular Jobs" }
];

// ---------- Component ----------

export default function JobsPage({ categoryFilter = null }) {
  const [activeTab, setActiveTab] = useState("skills");
  const [selected, setSelected] = useState(null); // { key, jobs, title, count }
  const [isChatOpen, setIsChatOpen] = useState(false);

  function handleTabClick(key) {
    setActiveTab(key);
    setSelected(null);
  }

  const categoryMapping = {
    "IT & Technology": "IT & Software",
    "Customer Support": "Customer Support / BPO",
    "Retail & Store Jobs": "Retail & Store",
    "Healthcare & Medical": "Healthcare & Medical",
    "Education & Training": "Education & Training",
    "Office & Administration": "Office & Administration",
    "Sales & Marketing": "Sales & Marketing",
    "Delivery & Logistics": "Delivery & Logistics",
    "Manufacturing & Factory": "Manufacturing & Factory",
  };

  const selectedCategory = categoryMapping[categoryFilter] || categoryFilter || "IT & Software";

  function handleItemClick(item) {
    let jobs = [];
    let count = 0;

    if (activeTab === "localskill" || activeTab === "popular") {
      const list = activeTab === "localskill" ? localSkills : popularJobs;
      jobs = generateJobsForSkill(item, list);
      count = 120 + list.indexOf(item) * 7;
    } else if (activeTab === "company") {
      jobs = generateJobsGeneric(companyRoles, [item], amravatiAreas);
      count = 15 + amravatiCompanies.indexOf(item) * 3;
    } else if (activeTab === "industry") {
      const data = industryData[item] || { roles: ["Staff"], companies: ["Local Business"] };
      jobs = generateJobsGeneric(data.roles, data.companies, amravatiAreas);
      count = 60 + amravatiIndustries.indexOf(item) * 9;
    }

    setSelected({ key: item, jobs, title: item, count });
  }

  const isClickableTab = activeTab !== "skills";
  const currentItems =
    activeTab === "skills" ? regularSkills :
    activeTab === "localskill" ? localSkills :
    activeTab === "company" ? amravatiCompanies :
    activeTab === "industry" ? amravatiIndustries :
    popularJobs;

  const filteredCategoryJobs = generateJobsForSkill(selectedCategory, popularJobs);
  const filteredCategoryCount = 120 + popularJobs.indexOf(selectedCategory) * 7;

  if (categoryFilter) {
    const categoryJobs = filteredCategoryJobs;
    return (
      <div
        style={{
          background: "linear-gradient(180deg, #FFF8EE 0%, #EEF1FA 100%)",
          padding: "40px 20px 0",
          fontFamily: FONT_STACK
        }}
      >
        <style>{CSS}</style>
        <div className="card results show">
          <div className="results-header">
            <div className="results-title">
              {selectedCategory} Jobs
              <span className="results-count">
                {filteredCategoryCount}+ openings near you
              </span>
            </div>
          </div>

          <div className="job-list">
            {categoryJobs.map((job, i) => (
              <div className="job-card" key={`${selectedCategory}-${i}`}>
                <div className="job-main">
                  <div className="job-title">{job.title}</div>
                  <div className="job-company">{job.company}</div>
                  <div className="job-meta">
                    <span>📍 {job.city}</span>
                    <span>🧰 {job.exp}</span>
                  </div>
                </div>
                <div className="job-salary">{job.salary}</div>
                <button className="job-apply">Apply Now</button>
              </div>
            ))}
          </div>

          <div className="view-all-row">
            <div className="h-[38px]" aria-hidden="true"></div>
          </div>
        </div>
        <Footer />
        <ChatDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} userRole="user" />
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #FFF8EE 0%, #EEF1FA 100%)",
        padding: "40px 20px 0",
        fontFamily: FONT_STACK
      }}
    >
      <style>{CSS}</style>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Explore Jobs by Skills, Location, Companies & More</h2>
          <span className="chevron">&#9650;</span>
        </div>

        <div className="tabs">
          {TABS.map(tab => (
            <div
              key={tab.key}
              className={"tab" + (activeTab === tab.key ? " active" : "")}
              onClick={() => handleTabClick(tab.key)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        <hr />

        <div className="grid">
          {currentItems.map(item => {
            const label = item === "View All" ? "View All" : item + " Jobs";
            if (isClickableTab) {
              return (
                <button
                  key={item}
                  className={"skill-link" + (selected && selected.key === item ? " selected" : "")}
                  onClick={() => handleItemClick(item)}
                >
                  {label}
                </button>
              );
            }
            return (
              <span key={item} className="skill-plain">{label}</span>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="card results show">
          <div className="results-header">
            <div className="results-title">
              {selected.title} Jobs
              <span className="results-count">
                {selected.count}+ openings {activeTab === "company" || activeTab === "industry" ? "in Amravati" : "near you"}
              </span>
            </div>
          </div>

          <div className="job-list">
            {selected.jobs.map((job, i) => (
              <div className="job-card" key={i}>
                <div className="job-main">
                  <div className="job-title">{job.title}</div>
                  <div className="job-company">{job.company}</div>
                  <div className="job-meta">
                    <span>📍 {job.city}</span>
                    <span>🧰 {job.exp}</span>
                  </div>
                </div>
                <div className="job-salary">{job.salary}</div>
                <button className="job-apply">Apply Now</button>
              </div>
            ))}
          </div>

          <div className="view-all-row">
            <div className="h-[38px]" aria-hidden="true"></div>
          </div>
        </div>
      )}

      <Footer />
      <ChatDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} userRole="user" />
    </div>
  );
}

function Footer() {
  const partners = [
    { cls: "spark", initials: "SL", name: "Spark Lab Solutions" },
    { cls: "prpote", initials: "PR", name: "P. R. Pote College of Engineering & Management" },
    { cls: "sgbau", initials: "SG", name: "Sant Gadge Baba Amravati University" },
    { cls: "govt", initials: "GC", name: "Government College of Engineering, Amravati" }
  ];
  const marqueeItems = [...partners, ...partners]; // duplicated for seamless loop

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-col">
          <h4>Trending Blogs <span className="chev">&#9662;</span></h4>
        </div>
        <div className="footer-col">
          <h4>Trending Jobs <span className="chev">&#9662;</span></h4>
        </div>
      </div>

      <div className="footer-top" style={{ marginTop: 16 }}>
        <div className="footer-col">
          <h4>Important Links</h4>
          <a href="#">Employer Home</a>
          <a href="#">About Us</a>
          <a href="#">Contact Us</a>
          <a href="#">Fraud Alert</a>
        </div>
        <div className="footer-col">
          <h4>Job Seekers</h4>
          <a href="#">Register/Login</a>
          <a href="#">Job Search</a>
          <a href="#">Create Free Job Alert</a>
          <a href="#">Job Assistance Services</a>
          <a href="#">Courses</a>
        </div>
        <div className="footer-col">
          <h4>Resources</h4>
          <a href="#">Business News</a>
          <a href="#">English News</a>
          <a href="#">Disclaimer</a>
          <a href="#">FAQ's</a>
        </div>
        <div className="footer-col">
          <h4>Employers</h4>
          <a href="#">Register/Log-In</a>
          <a href="#">Recruiter India</a>
          <a href="#">Post a Job</a>
        </div>
      </div>

      <div className="app-partner-row">
        <div className="partner-sites">
          <div className="partner-title">Our Partner Sites</div>
          <div className="partner-logos-marquee" style={{ maxWidth: '1320px', margin: '0 auto', width: '100%' }}>
            <div className="partner-logos-track">
              {marqueeItems.map((p, i) => (
                <div className={"partner-logo " + p.cls} key={i}>
                  <span className="logo-badge">{p.initials}</span>
                  <span className="pname">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-brand">
          <span className="footer-logo-circle">S</span>
          <span>&#64; 2026 Shine.com | All Right Reserved</span>
        </div>

        <div className="footer-legal">
          <a href="#">T&C</a>
          <span className="divider">|</span>
          <a href="#">Privacy Policy</a>
          <span className="divider">|</span>
          <a href="#">Cookie Policy</a>
          <span className="divider">|</span>
          <a href="#">Report Job Posting</a>
        </div>

        <div className="footer-social">
          <span>CONNECT WITH US:</span>
          <span className="social-icon fb">f</span>
          <span className="social-icon ig">&#9737;</span>
          <span className="social-icon li">in</span>
          <span className="social-icon x">𝕏</span>
          <span className="social-icon yt">&#9654;</span>
        </div>
      </div>
    </footer>
  );
}

// ---------- Styles ----------

const FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const CSS = `
  * { box-sizing: border-box; }

  .card {
    max-width: 1520px;
    margin: 0 auto 24px;
    background: #ffffff;
    border: 1px solid #dfe5f2;
    border-radius: 12px;
    padding: 20px 28px 28px;
    box-shadow: 0 12px 30px rgba(30, 58, 95, 0.06);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
  }

  .card-title {
    font-size: 17px;
    font-weight: 700;
    color: #1E3A5F;
    margin: 0 0 16px 0;
  }

  .chevron {
    color: #444;
    font-size: 16px;
    margin-top: -8px;
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
  }

  .tab {
    padding: 8px 18px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    background: #ffffff;
    color: #333;
    border: 1px solid #e0e0e0;
    cursor: pointer;
    white-space: nowrap;
  }

  .tab.active {
    background: #eef4ff;
    border: 1px solid #9fb8de;
    color: #1E3A5F;
    font-weight: 700;
  }

  hr {
    border: none;
    border-top: 1px solid #d9d8e0;
    margin: 0 0 20px 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    column-gap: 32px;
    row-gap: 14px;
  }

  .grid button.skill-link {
    all: unset;
    position: relative;
    display: block;
    padding-left: 16px;
    font-size: 14.5px;
    color: #545465;
    cursor: pointer;
  }

  .grid button.skill-link::before {
    content: "";
    position: absolute;
    left: 0;
    top: 8px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #8a8a99;
  }

  .grid button.skill-link:hover,
  .grid button.skill-link.selected {
    color: #1E3A5F;
    text-decoration: underline;
  }

  .grid button.skill-link.selected::before {
    background: #1E3A5F;
  }

  .grid .skill-plain {
    position: relative;
    display: block;
    padding-left: 16px;
    font-size: 14.5px;
    color: #545465;
  }

  .grid .skill-plain::before {
    content: "";
    position: absolute;
    left: 0;
    top: 8px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #8a8a99;
  }

  .results { margin-top: 8px; }

  .results-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .results-title {
    font-size: 16px;
    font-weight: 700;
    color: #1E3A5F;
  }

  .results-count {
    font-size: 13px;
    color: #77778a;
    font-weight: 400;
    margin-left: 6px;
  }

  .job-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .job-card {
    background: #ffffff;
    border: 1px solid #e4e3ec;
    border-radius: 8px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .job-main { flex: 1; min-width: 220px; }

  .job-title {
    font-size: 14.5px;
    font-weight: 600;
    color: #222230;
    margin: 0 0 4px 0;
  }

  .job-company { font-size: 13px; color: #6b6b7c; }

  .job-meta {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    font-size: 12.5px;
    color: #77778a;
    margin-top: 6px;
  }

  .job-meta span { display: flex; align-items: center; gap: 4px; }

  .job-salary {
    font-size: 13.5px;
    font-weight: 600;
    color: #1f8a4c;
    white-space: nowrap;
  }

  .job-apply {
    background: #1E3A5F;
    color: #fff;
    border: none;
    border-radius: 20px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .job-apply:hover { background: #264d7a; }

  .view-all-row { text-align: center; margin-top: 16px; }

  .view-all-btn {
    background: #ffffff;
    border: 1px solid #d9d8e0;
    color: #333;
    padding: 9px 22px;
    border-radius: 20px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
  }

  .view-all-btn:hover { border-color: #1E3A5F; color: #1E3A5F; }

  @media (max-width: 900px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 520px) {
    .grid { grid-template-columns: 1fr; }
    .job-card { flex-direction: column; align-items: flex-start; }
    .job-apply { width: 100%; text-align: center; }
  }

  /* Scrollbar hiding utilities */
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  /* ===== Footer ===== */
  .site-footer {
    background: #1b2a52;
    margin: 24px -20px 0;
    padding: 20px 40px 14px;
  }

  .footer-top {
    max-width: 1520px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.1fr 1fr 1fr 1fr 1fr;
    gap: 24px;
  }

  .footer-col h4 {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 8px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #33447a;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
  }

  .footer-col h4 .chev { font-size: 12px; color: #9aa6c9; }

  .footer-col a {
    display: block;
    font-size: 14px;
    color: #aeb8d6;
    text-decoration: none;
    margin-bottom: 8px;
    cursor: pointer;
  }

  .footer-col a:hover { color: #ffffff; text-decoration: underline; }

  .app-partner-row {
    max-width: 1520px;
    margin: 16px auto 0;
    display: flex;
    align-items: stretch;
    gap: 24px;
    flex-wrap: wrap;
  }

  .app-download-card {
    flex: 1 1 480px;
    background: #2c3b68;
    border-radius: 10px;
    padding: 14px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }

  .app-download-card h3 { font-size: 19px; font-weight: 700; color: #ffffff; margin: 0 0 6px 0; }
  .app-download-card p { font-size: 13.5px; color: #aeb8d6; margin: 0; }

  .get-app-btn {
    background: #3c4d84;
    color: #ffffff;
    border: 1px solid #56679e;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 14.5px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }

  .get-app-btn:hover { background: #46578e; }

  .partner-sites { flex: 1 1 480px; }

  .partner-title {
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
    position: relative;
    margin-bottom: 10px;
  }

  .partner-title::before, .partner-title::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 30%;
    border-top: 1px solid #33447a;
  }

  .partner-title::before { left: 0; }
  .partner-title::after { right: 0; }

  .partner-logos-marquee {
    overflow: hidden;
    width: 100%;
    height: 80px;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  }

  .partner-logos-track {
    display: flex;
    gap: 16px;
    width: max-content;
    animation: partnerScroll 22s linear infinite;
    align-items: center;
  }

  .partner-logos-marquee:hover .partner-logos-track { animation-play-state: paused; }

  @keyframes partnerScroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  .partner-logo {
    background: #ffffff;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 12.5px;
    font-weight: 700;
    color: #222;
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    line-height: 1.25;
    width: 260px;
    height: 56px;
    flex: 0 0 auto;
    border-bottom: 3px solid transparent;
  }

  .partner-logo .logo-badge {
    width: 30px;
    height: 30px;
    min-width: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    color: #ffffff;
  }

  .partner-logo.spark { border-bottom-color: #ff7a3d; }
  .partner-logo.spark .logo-badge { background: linear-gradient(135deg, #ff7a3d, #ffb347); }
  .partner-logo.spark .pname { color: #ff7a3d; }

  .partner-logo.prpote { border-bottom-color: #1e6fd9; }
  .partner-logo.prpote .logo-badge { background: linear-gradient(135deg, #1e6fd9, #5aa9ff); }
  .partner-logo.prpote .pname { color: #1e6fd9; }

  .partner-logo.sgbau { border-bottom-color: #1f9d55; }
  .partner-logo.sgbau .logo-badge { background: linear-gradient(135deg, #1f9d55, #63d68a); }
  .partner-logo.sgbau .pname { color: #1f9d55; }

  .partner-logo.govt { border-bottom-color: #a52ad1; }
  .partner-logo.govt .logo-badge { background: linear-gradient(135deg, #a52ad1, #d17aef); }
  .partner-logo.govt .pname { color: #a52ad1; }

  .footer-bottom {
    max-width: 1520px;
    margin: 16px auto 0;
    border-top: 1px solid #33447a;
    padding: 12px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .footer-brand { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: #aeb8d6; }

  .footer-logo-circle {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #f5c518;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #1b2a52;
  }

  .footer-legal { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: #aeb8d6; flex-wrap: wrap; }
  .footer-legal a { color: #aeb8d6; text-decoration: none; }
  .footer-legal a:hover { color: #ffffff; text-decoration: underline; }
  .footer-legal .divider { color: #56679e; }

  .footer-social { display: flex; align-items: center; gap: 14px; }
  .footer-social span { font-size: 12px; font-weight: 700; letter-spacing: .5px; color: #aeb8d6; }

  .social-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    color: #ffffff;
    transition: transform .15s ease;
  }

  .social-icon:hover { transform: translateY(-2px); }

  .social-icon.fb { background: #1877f2; }
  .social-icon.ig { background: radial-gradient(circle at 30% 110%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%); }
  .social-icon.li { background: #0a66c2; }
  .social-icon.x { background: #000000; }
  .social-icon.yt { background: #ff0000; }

  @media (max-width: 1100px) {
    .footer-top { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 700px) {
    .footer-top { grid-template-columns: repeat(2, 1fr); }
    .footer-bottom { flex-direction: column; align-items: flex-start; }
  }
`;
