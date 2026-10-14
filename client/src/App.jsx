import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import "./App.css";

const API_URL = "http://localhost:4000";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  dateOfBirth: "",
  password: "",
  confirmPassword: "",
};

function App() {
  const [form, setForm] = useState(initialForm);
  const [view, setView] = useState("signup");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Update whichever field the user changes
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function validateForm() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return "First name and last name are required.";
    }

    if (
      form.firstName.trim().length > 100 ||
      form.lastName.trim().length > 100
    ) {
      return "Names must contain at most 100 characters.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ||
      form.email.trim().length > 320
    ) {
      return "Enter a valid email address.";
    }

    const today = new Date().toLocaleDateString("en-CA");

    if (
      !form.dateOfBirth ||
      form.dateOfBirth > today
    ) {
      return "Enter a valid date of birth.";
    }

    if (form.password.length < 12) {
      return "Password must contain at least 12 characters.";
    }

    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create account."
        );
      }

      setSuccess("Account created successfully! You can now sign in.");
      setForm(initialForm);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    const credential = credentialResponse.credential;

    if (!credential) {
      setError("Google did not return a credential.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ credential }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Google verification failed."
        );
      }

      setSuccess(
        `Google identity verified for ${
          data.user?.email || "your account"
        }.`
      );
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }


function handleLoginChange(event) {
  const { name, value } = event.target;

  setLoginForm((previous) => ({
    ...previous,
    [name]: value,
  }));

  setError("");
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  if (loading) return;

  setError("");
  setSuccess("");

  if (
    !loginForm.email.trim() ||
    !loginForm.password
  ) {
    setError("Email and password are required.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      `${API_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Login verification failed."
      );
    }

    // We will turn this into a real login session
    // in Lesson 7.
    setSuccess(
      `Credentials verified! Welcome, ${data.user.firstName}.`
    );

    setLoginForm({
      email: "",
      password: "",
    });
  } catch (error) {
    setError(
      error.message || "Unable to verify credentials."
    );
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-symbol">A</div>
          <span>Auth Learning</span>
        </div>

        <h1>{view === "signup" ? "Create an account" : "Welcome back"}</h1>

        <p className="subtitle">
          {view === "signup"
            ? "Enter your details to get started."
            : "Sign in with your email and password."}
        </p>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert success" role="status">
            {success}
          </div>
        )}

        {view === "signup" ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="name-grid">
              <div className="field">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  placeholder="Alex"
                  maxLength={100}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  placeholder="Morgan"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="alex@example.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="dateOfBirth">Date of birth</label>
              <input
                id="dateOfBirth"
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-group">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="At least 12 characters"
                  required
                />
                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Repeat your password"
                required
              />
            </div>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Create account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} noValidate>
            <div className="field">
              <label htmlFor="loginEmail">Email address</label>

              <input
                id="loginEmail"
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="loginPassword">Password</label>

              <div className="password-group">
                <input
                  id="loginPassword"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => {
                    setShowPassword((current) => !current);
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Verifying..." : "Sign in"}
            </button>
          </form>
        )}

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="google-container">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError("Google sign-in failed.");
            }}
          />
        </div>

        <p className="switch-auth">
          {view === "signup"
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            onClick={() => {
              setView(view === "signup" ? "login" : "signup");
              setError("");
              setSuccess("");
            }}
          >
            {view === "signup" ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default App;
