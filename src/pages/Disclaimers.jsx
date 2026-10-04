import PublicPageLayout from "./PublicPageLayout.jsx";

export default function Disclaimers() {
  return <PublicPageLayout title="Disclaimers" eyebrow="Resources">
    <h2 className="text-xl font-bold text-slate-900">No placement guarantee</h2><p>MyCareerPath provides discovery and hiring tools. It does not guarantee interviews, employment, salary, or placement outcomes.</p>
    <h2 className="text-xl font-bold text-slate-900">AI recommendations</h2><p>Recommendation scores are generated from skill and preference matching algorithms. They are informational aids and should not be treated as hiring decisions or guarantees.</p>
    <h2 className="text-xl font-bold text-slate-900">Third-party content</h2><p>External job links and third-party content are provided for convenience. Their accuracy, availability, and terms are controlled by the respective providers.</p>
  </PublicPageLayout>;
}
