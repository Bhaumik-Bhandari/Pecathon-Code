
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Sparkles,
  UserRound,
} from "lucide-react";

import "./Login.css";

const REMEMBERED_EMAIL_KEY = "pecfest-remembered-email";

export default function Login() {
  const [view, setView] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
    } catch {
      return "";
    }
  });

  function changeView(nextView) {
    setView(nextView);
    setStatus("");
    setShowPassword(false);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const submittedEmail = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    if (view === "forgot") {
      setStatus(
        `Password recovery for ${submittedEmail} requires a configured authentication backend.`,
      );
      return;
    }

    if (view === "signup") {
      const name = String(form.get("name") || "").trim();
      const confirmPassword = String(
        form.get("confirmPassword") || "",
      );

      if (!name) {
        setStatus("Please enter your full name.");
        return;
      }

      if (password.length < 8) {
        setStatus("Your password must contain at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setStatus("The passwords do not match. Please try again.");
        return;
      }

      setStatus(
        "Your details are valid. Account creation needs backend integration.",
      );
      return;
    }

    const remember = form.get("remember") === "on";

    try {
      if (remember) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, submittedEmail);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch {
      // The sign-in form remains usable when browser storage is unavailable.
    }

    setEmail(submittedEmail);

    setStatus(
      "Your details are ready. Connect the login API to authenticate your account.",
    );
  }

  function handleGoogleSignIn() {
    setStatus(
      "Google sign-in needs OAuth configuration before it can authenticate you.",
    );
  }

  function handleForgotPassword(event) {
    event.preventDefault();
    changeView("forgot");
  }

  function handleCreateAccount(event) {
    event.preventDefault();
    changeView("signup");
  }

  function handleBackToSignIn(event) {
    event.preventDefault();
    changeView("signin");
  }

  const isSignUp = view === "signup";
  const isForgot = view === "forgot";

  const heading = isForgot
    ? "Reset password."
    : isSignUp
      ? "Join the festival."
      : "Enter the festival.";

  const description = isForgot
    ? "Enter your email to start recovering your account."
    : isSignUp
      ? "Create your account and become part of the experience."
      : "Your next chapter begins here.";

  return (
    <main className="mk-login-page">
      {/* The image fills the screen; the card creates its own glass effect. */}
      <div className="mk-login-backdrop" aria-hidden="true" />

      <section
        className="mk-login-card"
        aria-labelledby="mk-login-title"
      >
        <div className="mk-login-card-glow" aria-hidden="true" />

        {/* The keyed content re-enters when switching between views. */}
        <div
          key={view}
          className="mk-login-card-content"
          data-view={view}
        >
          {/* PECFEST identity */}
          <div className="mk-login-brand">
            <div className="mk-login-brand-mark">
              <span>P</span>
              <Sparkles
                className="mk-login-brand-sparkle"
                size={14}
                aria-hidden="true"
              />
            </div>

            <div className="mk-login-brand-copy">
              <span className="mk-login-brand-name">PECFEST</span>
              <span className="mk-login-brand-subtitle">
                THE DIGITAL SANCTUARY
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mk-login-card-heading">
            <p className="mk-login-card-kicker">
              <span className="mk-login-kicker-line" />
              A MYSTIC MIKADO
              <span className="mk-login-kicker-line" />
            </p>

            <h1 id="mk-login-title">{heading}</h1>

            <p className="mk-login-card-description">
              {description}
            </p>
          </div>

          {/* Google sign-in is shown only in sign-in mode. */}
          {!isSignUp && !isForgot && (
            <>
              <button
                className="mk-login-google"
                type="button"
                onClick={handleGoogleSignIn}
              >
                <svg
                  className="mk-login-google-icon"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.27 5.64c4.25-3.92 7.5-9.72 7.5-17.29Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19Z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.27-5.64c-2.02 1.35-4.6 2.15-8.63 2.15-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                  />
                </svg>

                <span>Continue with Google</span>

                <ArrowRight
                  className="mk-login-google-arrow"
                  size={17}
                  aria-hidden="true"
                />
              </button>

              <div className="mk-login-divider">
                <span />
                <p>OR CONTINUE WITH EMAIL</p>
                <span />
              </div>
            </>
          )}

          {/* Email, sign-up and password-recovery forms */}
          <form
            className="mk-login-form"
            onSubmit={handleSubmit}
            noValidate={false}
          >
            {isSignUp && (
              <label className="mk-login-field">
                <span className="mk-login-label">FULL NAME</span>

                <span className="mk-login-input-wrap">
                  <UserRound
                    className="mk-login-input-icon"
                    size={17}
                    aria-hidden="true"
                  />

                  <input
                    className="mk-login-input mk-login-input-with-icon"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    required
                    maxLength={100}
                  />
                </span>
              </label>
            )}

            <label className="mk-login-field">
              <span className="mk-login-label">EMAIL ADDRESS</span>

              <input
                className="mk-login-input"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            {!isForgot && (
              <label className="mk-login-field">
                <span className="mk-login-label">PASSWORD</span>

                <span className="mk-login-password-wrap">
                  <input
                    className="mk-login-input mk-login-password-input"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    minLength={isSignUp ? 8 : undefined}
                    placeholder={
                      isSignUp
                        ? "Create a password (8+ characters)"
                        : "Enter your password"
                    }
                    required
                  />

                  <button
                    className="mk-login-password-toggle"
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} aria-hidden="true" />
                    ) : (
                      <Eye size={17} aria-hidden="true" />
                    )}
                  </button>
                </span>
              </label>
            )}

            {isSignUp && (
              <label className="mk-login-field">
                <span className="mk-login-label">CONFIRM PASSWORD</span>

                <input
                  className="mk-login-input"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Enter your password again"
                  required
                />
              </label>
            )}

            {view === "signin" && (
              <div className="mk-login-options">
                <label className="mk-login-remember">
                  <input
                    type="checkbox"
                    name="remember"
                    defaultChecked={Boolean(email)}
                  />
                  <span>Remember me</span>
                </label>

                <a
                  className="mk-login-text-link"
                  href="#forgot-password"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </a>
              </div>
            )}

            {isSignUp && (
              <label className="mk-login-remember mk-login-terms">
                <input type="checkbox" name="terms" required />
                <span>
                  I agree to the applicable terms and privacy policy.
                </span>
              </label>
            )}

            {status && (
              <p className="mk-login-status" role="status" aria-live="polite">
                {status}
              </p>
            )}

            <button className="mk-login-submit" type="submit">
              <span>
                {isForgot
                  ? "Request password reset"
                  : isSignUp
                    ? "Create account"
                    : "Enter the festival"}
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>

          {/* Switch between sign-in and sign-up with animated content. */}
          <p className="mk-login-signup">
            {isForgot ? (
              <>
                Remember your password?{" "}
                <a href="#signin" onClick={handleBackToSignIn}>
                  Back to sign in
                </a>
              </>
            ) : isSignUp ? (
              <>
                Already a member?{" "}
                <a href="#signin" onClick={handleBackToSignIn}>
                  Sign in
                </a>
              </>
            ) : (
              <>
                New to PECFEST?{" "}
                <a href="#signup" onClick={handleCreateAccount}>
                  Create an account
                </a>
              </>
            )}
          </p>

          <div className="mk-login-card-bottom">
            <span className="mk-login-bottom-line" />
            <span className="mk-login-footer-symbol">✳</span>
            <p>ONE FESTIVAL. INFINITE POSSIBILITIES.</p>
            <span className="mk-login-bottom-line" />
          </div>
        </div>
      </section>
    </main>
  );
}
