export const EDUCATION_OPTIONS = [
  { label: "10th Pass", options: [] },
  { label: "12th Pass", options: ["Science", "Commerce", "Arts/Humanities", "Vocational"] },
  { label: "ITI", options: [] },
  { label: "Diploma", options: ["Polytechnic (Engineering)", "D.Pharm (Pharmacy)", "Nursing", "Agriculture", "Hotel Management", "Paramedical", "Other"] },
  { label: "Undergraduate", options: ["B.E./B.Tech", "B.Sc", "B.C.A.", "B.Pharm", "B.Com", "B.B.A.", "B.A.", "LL.B", "B.Sc Agri", "Other"] },
  { label: "Postgraduate", options: ["M.E./M.Tech", "M.Sc", "M.C.A.", "M.Pharm", "M.B.A.", "M.Com", "M.A.", "LL.M", "Other"] },
  { label: "Doctorate (Ph.D.)", options: ["Ph.D. in Engg/Tech", "Ph.D. in CS/IT", "Ph.D. in Sciences", "Ph.D. in Pharmacy", "Ph.D. in Management", "Ph.D. in Humanities", "Ph.D. in Agriculture", "Other"] },
  { label: "Other", options: [] },
];

export const EDUCATION_CATEGORY_OPTIONS = EDUCATION_OPTIONS.map(({ label }) => label);

export function getEducationOptions(category) {
  return EDUCATION_OPTIONS.find((entry) => entry.label === category)?.options || [];
}
