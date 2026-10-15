
export default function Dashboard({
  user,
  onLogout,
  loggingOut,
  error,
  onEdit,
}) {
  const fullName = [
    user.firstName,
    user.lastName,
  ].filter(Boolean).join(" ");

  const initials = [
    user.firstName?.[0],
    user.lastName?.[0],
  ].filter(Boolean).join("").toUpperCase();

  return (
    <main className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">AUTH LEARNING</p>
            <h1>My Dashboard</h1>
          </div>

          <button
            className="logout-button"
            onClick={onLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>

        {error && (
          <p className="dashboard-error" role="alert">
            {error}
          </p>
        )}

        <div className="profile-header">
          {user.profilePicture ? (
            <img
              className="profile-avatar"
              src={user.profilePicture}
              alt="Profile"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="profile-avatar initials">{initials || "U"}</div>
          )}

          <div>
            <h2>Welcome, {user.firstName}!</h2>
            <p>{user.email}</p>
          </div>
        </div>

        <button type="button" className="edit-profile-button" onClick={onEdit}>
          Edit Profile
        </button>

        <h3>Account information</h3>

        <dl className="profile-grid">
          <div>
            <dt>First name</dt>
            <dd>{user.firstName}</dd>
          </div>

          <div>
            <dt>Last name</dt>
            <dd>{user.lastName}</dd>
          </div>

          <div>
            <dt>Full name</dt>
            <dd>{fullName}</dd>
          </div>

          <div>
            <dt>Email address</dt>
            <dd>{user.email}</dd>
          </div>

          <div>
            <dt>Date of birth</dt>
            <dd>
              {user.dateOfBirth
                ? String(user.dateOfBirth).slice(0, 10)
                : "Not provided"}
            </dd>
          </div>

          <div>
            <dt>Account ID</dt>
            <dd>{user.id}</dd>
          </div>
        </dl>

        <p className="dashboard-note">
          Your profile was loaded from PostgreSQL using your authenticated
          session.
        </p>
      </div>
    </main>
  );
}
