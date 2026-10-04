import PublicPageLayout from "./PublicPageLayout.jsx";

export default function CandidateTools({ kind }) {
  const isResume = kind === "resume";
  return <PublicPageLayout title={isResume ? "Resume Tools" : "AI Interview Preparation"} eyebrow="Candidate career tools">
    <p>{isResume ? "Use your candidate profile to organize experience, education, and skills into a stronger resume." : "Practice interview questions and prepare examples that show how your skills fit the role."}</p>
    <p>Sign in as a Candidate to access personalized career tools and recommendations.</p>
  </PublicPageLayout>;
}
