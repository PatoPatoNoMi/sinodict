import { Link } from "react-router-dom"
import { AppHeader } from "./components/AppHeader"
import "./App.css"

function ExternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="about-link"
    >
      {children}
    </a>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

export default function AboutPage() {
  return (
    <>
      <AppHeader />

      <main className="app-main">
        <section className="about-section">
          <h1 className="about-title">
            <span className="logo-sino">Sino</span>Dict
          </h1>
          <p className="about-tagline">
            Cross-language dictionary — Japanese, Korean, Mandarin &amp;
            Cantonese.
          </p>

          <div className="about-credits">
            <p className="about-made-by">Made by Patrick Aulie (パト)</p>
            <img
              src="https://avatars.githubusercontent.com/u/19844738?v=4"
              alt="Patrick Aulie"
              className="about-avatar"
            />
            <div className="about-links">
              <ExternalLink href="https://github.com/PatoPatoNoMi/">
                <GitHubIcon /> GitHub
              </ExternalLink>
              <ExternalLink href="https://www.instagram.com/patopatonomi/">
                <InstagramIcon /> Instagram
              </ExternalLink>
              <ExternalLink href="https://www.youtube.com/@PatoPatoNoMi">
                <YouTubeIcon /> YouTube
              </ExternalLink>
            </div>
            <div className="about-thanks">
              <p className="about-thanks-title">Special Thanks</p>
              <ul className="about-thanks-list">
                <li>Adrian L.K. Krøger</li>
                <li>Henrik Berbom</li>
              </ul>
            </div>
          </div>

<Link to="/" className="about-back">
            ← Back to search
          </Link>
        </section>
      </main>
    </>
  )
}
