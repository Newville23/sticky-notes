import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="starter">
      <section className="starter__intro">
        <div className="starter__hero">
          <img
            src={heroImg}
            className="starter__hero-image starter__hero-image--base"
            width="170"
            height="179"
            alt=""
          />
          <img
            src={reactLogo}
            className="starter__hero-image starter__hero-image--react"
            alt="React logo"
          />
          <img
            src={viteLogo}
            className="starter__hero-image starter__hero-image--vite"
            alt="Vite logo"
          />
        </div>
        <div>
          <h1 className="starter__heading starter__heading--primary">
            Get started
          </h1>
          <p className="starter__copy">
            Edit <code className="starter__code">src/App.tsx</code> and save to
            test <code className="starter__code">HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="starter__counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="starter__ticks"></div>

      <section className="starter__resources">
        <div className="starter__resource starter__resource--docs">
          <svg
            className="starter__resource-icon"
            role="presentation"
            aria-hidden="true"
          >
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2 className="starter__heading starter__heading--secondary">
            Documentation
          </h2>
          <p className="starter__copy">Your questions, answered</p>
          <ul className="starter__link-list">
            <li className="starter__link-item">
              <a
                className="starter__link"
                href="https://vite.dev/"
                target="_blank"
              >
                <img className="starter__link-icon" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li className="starter__link-item">
              <a
                className="starter__link"
                href="https://react.dev/"
                target="_blank"
              >
                <img className="starter__link-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div className="starter__resource starter__resource--social">
          <svg
            className="starter__resource-icon"
            role="presentation"
            aria-hidden="true"
          >
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2 className="starter__heading starter__heading--secondary">
            Connect with us
          </h2>
          <p className="starter__copy">Join the Vite community</p>
          <ul className="starter__link-list">
            <li className="starter__link-item">
              <a
                className="starter__link"
                href="https://github.com/vitejs/vite"
                target="_blank"
              >
                <svg
                  className="starter__link-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li className="starter__link-item">
              <a
                className="starter__link"
                href="https://chat.vite.dev/"
                target="_blank"
              >
                <svg
                  className="starter__link-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li className="starter__link-item">
              <a
                className="starter__link"
                href="https://x.com/vite_js"
                target="_blank"
              >
                <svg
                  className="starter__link-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li className="starter__link-item">
              <a
                className="starter__link"
                href="https://bsky.app/profile/vite.dev"
                target="_blank"
              >
                <svg
                  className="starter__link-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="starter__ticks"></div>
      <section className="starter__spacer"></section>
    </main>
  )
}

export default App
