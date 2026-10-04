import PublicPageLayout from "./PublicPageLayout.jsx";

export default function CookiePolicy() {
  return <PublicPageLayout title="Cookie & Local Storage Policy" eyebrow="Legal">
    <p>The web app uses browser local storage to retain authentication tokens and selected profile information so your session and application experience can continue between page loads.</p>
    <p>Access and refresh tokens are used to authenticate requests. You can sign out to remove authentication tokens from this browser. Clearing site data will also remove locally stored session information.</p>
    <p>Essential storage supports account security and core platform features. MyCareerPath does not use this storage to sell personal information.</p>
  </PublicPageLayout>;
}
