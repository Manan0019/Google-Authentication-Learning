import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("Not signed in");
  const [loading, setLoading] = useState(false);

  async function handleGoogleSuccess(credentialResponse) {
    const credential = credentialResponse.credential;

    if (!credential) {
      setStatus("Google did not return an ID token.");
      return;
    }

    setLoading(true);
    setStatus("Verifying your Google account...");

    try {
      const response = await fetch(
        "http://localhost:4000/api/auth/google",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: credential,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Authentication failed"
        );
      }

      setUser(data.user);
      setStatus("Google identity successfully verified!");
    } catch (error) {
      setUser(null);
      setStatus(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Google Authentication Project</h1>

      <p>{status}</p>

      {loading && <p>Verifying your account...</p>}

      {!user && (
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            setStatus("Google sign-in failed.");
          }}
        />
      )}

      {user && (
        <section>
          <h2>Welcome, {user.name}!</h2>

          {user.picture && (
            <img
              src={user.picture}
              alt="Google profile"
              width="100"
              height="100"
              referrerPolicy="no-referrer"
            />
          )}

          <p>Email: {user.email}</p>
          <p>Google account verified: Yes</p>
          <p>
            Email verified: {user.emailVerified ? "Yes" : "No"}
          </p>

          <p>
            This is a verified identity demo.
            Persistent login is not implemented yet.
          </p>
        </section>
      )}
    </main>
  );
}

export default App;
