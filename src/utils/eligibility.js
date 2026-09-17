export const EDUCATION_HIERARCHY = [
  "10th Pass",
  "12th Pass",
  "ITI",
  "Diploma",
  "Undergraduate",
  "Graduate",
  "Postgraduate",
  "Doctorate",
];

const aliases = {
  "10th": "10th Pass",
  "10th pass": "10th Pass",
  "10th pass (ssc)": "10th Pass",
  ssc: "10th Pass",
  "12th": "12th Pass",
  "12th pass": "12th Pass",
  "12th pass (hsc)": "12th Pass",
  hsc: "12th Pass",
  "12th pass": "12th Pass",
  "12th pass - science": "12th Pass",
  "12th pass - commerce": "12th Pass",
  "12th pass - arts/humanities": "12th Pass",
  "12th pass - vocational": "12th Pass",
  iti: "ITI",
  "polytechnic diploma": "Diploma",
  diploma: "Diploma",
  "b.e. / b.tech": "Undergraduate",
  "b.sc / b.c.a.": "Undergraduate",
  "b.com / b.b.a.": "Undergraduate",
  "b.a.": "Undergraduate",
  "other bachelor's degree": "Undergraduate",
  "m.e. / m.tech": "Postgraduate",
  "m.sc / m.c.a.": "Postgraduate",
  "m.com / m.b.a.": "Postgraduate",
  "m.a. / other master's degree": "Postgraduate",
  "ph.d. / doctorate": "Doctorate",
  "doctorate (ph.d.)": "Doctorate",
  "vocational / skill certification": "ITI",
  "self-taught / online certification": "Undergraduate",
  "undergraduate (ug / bachelor's)": "Undergraduate",
  undergraduate: "Undergraduate",
  ug: "Undergraduate",
  "bachelor's": "Undergraduate",
  graduate: "Graduate",
  graduation: "Graduate",
  "postgraduate (pg / master's)": "Postgraduate",
  postgraduate: "Postgraduate",
  pg: "Postgraduate",
  "master's": "Postgraduate",
  doctorate: "Doctorate",
  "ph.d.": "Doctorate",
};

export function normalizeQualification(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (aliases[text]) return aliases[text];
  if (text.includes("ph.d") || text.includes("doctorate") || text.includes("doctoral")) return "Doctorate";
  if (text.includes("12th") || text.includes("hsc")) return "12th Pass";
  if (text === "iti" || text.includes("iti")) return "ITI";
  if (text.includes("postgraduate") || text.includes("master") || /(^|\W)m\.?[a-z]/.test(text)) return "Postgraduate";
  if (text.includes("undergraduate")) return "Undergraduate";
  if (text.includes("bachelor") || /(^|\W)b\.?[a-z]/.test(text)) return "Undergraduate";
  if (text.includes("polytechnic") || text.includes("diploma")) return "Diploma";
  if (text.includes("vocational") || text.includes("skill certification") || text.includes("iti")) return "ITI";
  return EDUCATION_HIERARCHY.find((level) => text.includes(level.toLowerCase())) || "";
}

export function qualificationRank(value) {
  const normalized = normalizeQualification(value);
  const ranks = {
    "10th Pass": 0,
    "12th Pass": 1,
    ITI: 1,
    Diploma: 2,
    Undergraduate: 3,
    Graduate: 3,
    Postgraduate: 4,
    Doctorate: 5,
  };
  return ranks[normalized] ?? -1;
}

export function meetsMinimumQualification(candidateQualification, minimumQualification) {
  const candidateRank = qualificationRank(candidateQualification);
  const minimumRank = qualificationRank(minimumQualification);
  return candidateRank >= 0 && minimumRank >= 0 && candidateRank >= minimumRank;
}

export function isEligible(userEdu, minJobEdu) {
  const normalizedUserEducation = normalizeQualification(userEdu);
  if (!normalizedUserEducation || normalizedUserEducation === "Not provided") {
    return false;
  }
  return !minJobEdu || meetsMinimumQualification(normalizedUserEducation, minJobEdu);
}

export function qualificationLabel(value) {
  return normalizeQualification(value) || "Not provided";
}
