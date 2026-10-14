
import { useState } from "react";

const API_URL = "http://localhost:4000";

export default function EditProfile({
  user,
  onSaved,
  onCancel,
}) {
  const [form, setForm] = useState({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    dateOfBirth: user.dateOfBirth
      ? String(user.dateOfBirth).slice(0, 10)
      : "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    setError("");

    if (!form.firstName.trim() ||
        !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/me`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Profile update failed."
        );
      }

      // Let App update the shared authenticated user.
      onSaved(data.user);
    } catch (error) {
      setError(error.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Edit Profile</h1>
        <p className="subtitle">
          Update your personal information.
        </p>

        {error && (
          <p className="alert error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="editFirstName">
              First name
            </label>
            <input
              id="editFirstName"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="editLastName">
              Last name
            </label>
            <input
              id="editLastName"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="editEmail">
              Email address
            </label>
            <input
              id="editEmail"
              value={user.email}
              disabled
            />
            <small>
              Email changes require separate verification.
            </small>
          </div>

          <div className="field">
            <label htmlFor="editDob">
              Date of birth
            </label>
            <input
              id="editDob"
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
        </form>
      </section>
    </main>
  );
}
