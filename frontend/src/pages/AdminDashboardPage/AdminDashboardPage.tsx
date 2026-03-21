import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { useAuth } from "../../features/auth/hooks/useAuth";
import {
  createUser,
  deleteUser,
  formatDateTime,
  getSessionsForUser,
  getUserById,
  getUserStatsRows,
} from "../../features/users/model/userStore";
import type { AuthRole } from "../../features/auth/model/authTypes";
import styles from "./AdminDashboardPage.module.css";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { getAuthState, logout } = useAuth();
  const auth = getAuthState();

  const [selectedRole, setSelectedRole] = useState<AuthRole>("child");
  const [viewedUserId, setViewedUserId] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>("");
  const [login, setLogin] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [version, setVersion] = useState(0);

  const rows = useMemo(() => getUserStatsRows(), [version]);
  const filteredRows = useMemo(
    () => rows.filter((row) => row.role === selectedRole),
    [rows, selectedRole],
  );
  const viewedUser = useMemo(
    () => (viewedUserId ? getUserById(viewedUserId) : undefined),
    [viewedUserId, version],
  );
  const viewedSessions = useMemo(
    () => (viewedUser ? getSessionsForUser(viewedUser.id) : []),
    [viewedUser, version],
  );
  const deleteTarget = useMemo(
    () => (deleteTargetId ? getUserById(deleteTargetId) : undefined),
    [deleteTargetId, version],
  );

  function handleLogout() {
    logout();
    navigate(routes.entry);
  }

  function resetForm() {
    setLogin("");
    setFullName("");
    setPassword("");
  }

  function handleOpenCreateModal(role: AuthRole) {
    setSelectedRole(role);
    setMessage("");
    setMessageType("");
    resetForm();
    setIsCreateModalOpen(true);
  }

  function handleOpenUserModal(userId: string) {
    setViewedUserId(userId);
    setIsUserModalOpen(true);
  }

  function handleOpenDeleteModal(userId: string) {
    setDeleteTargetId(userId);
  }

  function handleCloseDeleteModal() {
    setDeleteTargetId("");
  }

  function handleDeleteUser() {
    if (!deleteTargetId) {
      return;
    }

    const result = deleteUser(deleteTargetId);
    if (!result.ok) {
      setMessage(result.message);
      setMessageType("error");
      handleCloseDeleteModal();
      return;
    }

    const deletedOwnAccount = auth?.userId === deleteTargetId;

    if (viewedUserId === deleteTargetId) {
      setViewedUserId("");
      setIsUserModalOpen(false);
    }

    setVersion((current) => current + 1);
    setMessage(`${deleteTarget?.role === "admin" ? "Admin" : "Student"} ${deleteTarget?.login ?? "user"} was removed.`);
    setMessageType("success");
    handleCloseDeleteModal();

    if (deletedOwnAccount) {
      logout();
      navigate(routes.entry);
    }
  }

  function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedFullName = fullName.trim();

    const result = createUser({
      role: selectedRole,
      login,
      fullName: trimmedFullName,
      password: selectedRole === "admin" ? password : undefined,
    });

    if (!result.ok) {
      setMessage(result.message);
      setMessageType("error");
      return;
    }

    setMessage(`${selectedRole === "admin" ? "Admin" : "Student"} ${result.user.login} was created.`);
    setMessageType("success");
    setVersion((current) => current + 1);
    resetForm();
    window.setTimeout(() => {
      setIsCreateModalOpen(false);
      setMessage("");
      setMessageType("");
    }, 500);
  }

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.topbar}>
          <div className={styles.headingBlock}>
            <p className={styles.eyebrow}>Administration</p>
            <h1 className={styles.title}>Users</h1>
            <p className={styles.subtitle}>Switch between students and admins, create new accounts, review student results, and remove users when needed.</p>
          </div>

          <div className={styles.topbarActions}>
            <div className={styles.userBadge}>
              <div className={styles.avatar}>{auth?.displayName?.slice(0, 1).toUpperCase() || "A"}</div>
              <div>
                <strong>{auth?.displayName || "Admin"}</strong>
                <span>Administrator</span>
              </div>
            </div>
            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className={styles.panel}>
          <div className={styles.segmentedControl}>
            <button
              type="button"
              className={`${styles.segmentButton} ${selectedRole === "child" ? styles.segmentButtonActive : ""}`}
              onClick={() => setSelectedRole("child")}
            >
              Students
            </button>
            <button
              type="button"
              className={`${styles.segmentButton} ${selectedRole === "admin" ? styles.segmentButtonActive : ""}`}
              onClick={() => setSelectedRole("admin")}
            >
              Admins
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Full name</th>
                  <th>Login</th>
                  <th>Games played</th>
                  <th>Best score</th>
                  <th>Last played</th>
                  <th className={styles.actionColumn}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length ? (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.fullName.trim() || "—"}</td>
                      <td>@{row.login}</td>
                      <td>{row.gamesPlayed}</td>
                      <td>{row.bestScoreLabel}</td>
                      <td>{row.lastPlayed}</td>
                      <td className={styles.actionCell}>
                        <div className={styles.actionButtons}>
                          {row.role === "child" ? (
                            <button
                              type="button"
                              className={styles.viewButton}
                              onClick={() => handleOpenUserModal(row.id)}
                            >
                              View
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => handleOpenDeleteModal(row.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyTable}>
                      No {selectedRole === "admin" ? "admins" : "students"} found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.tableFooter}>
            <button type="button" className={styles.createButton} onClick={() => handleOpenCreateModal(selectedRole)}>
              Create new {selectedRole === "admin" ? "admin" : "student"}
            </button>
          </div>
        </section>
      </div>

      {isCreateModalOpen ? (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Create account</p>
                <h2>Create new {selectedRole === "admin" ? "admin" : "student"}</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setIsCreateModalOpen(false)}>
                ×
              </button>
            </div>

            <form className={styles.modalForm} onSubmit={handleCreateUser}>
              <div className={styles.fieldGroup}>
                <label htmlFor="create-login">Login</label>
                <input
                  id="create-login"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                  placeholder="e.g. oliver"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="create-full-name">Full name</label>
                <input
                  id="create-full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="e.g. Oliver Smith"
                />
              </div>

              {selectedRole === "admin" ? (
                <div className={styles.fieldGroup}>
                  <label htmlFor="create-password">Password</label>
                  <input
                    id="create-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Admin password"
                  />
                </div>
              ) : null}

              <div
                className={`${styles.feedback} ${
                  messageType === "success"
                    ? styles.feedbackSuccess
                    : messageType === "error"
                      ? styles.feedbackError
                      : ""
                }`}
              >
                {message ||
                  (selectedRole === "admin"
                    ? "Admins require login, full name, and password."
                    : "Students require login and full name.")}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton}>
                  Create {selectedRole === "admin" ? "admin" : "student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}


      {deleteTarget ? (
        <div className={styles.modalOverlay} onClick={handleCloseDeleteModal}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Delete user</p>
                <h2>Remove {deleteTarget.role === "admin" ? "admin" : "student"}?</h2>
                <p className={styles.detailMeta}>
                  {`${deleteTarget.name} ${deleteTarget.surname}`.trim() || deleteTarget.login} · @{deleteTarget.login}
                </p>
              </div>
              <button type="button" className={styles.closeButton} onClick={handleCloseDeleteModal}>
                ×
              </button>
            </div>

            <div className={styles.deleteModalBody}>
              <p className={styles.deleteText}>
                This action will permanently remove the user account{deleteTarget.role === "child" ? " and all saved game results" : ""}.
              </p>

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={handleCloseDeleteModal}>
                  Cancel
                </button>
                <button type="button" className={styles.dangerButton} onClick={handleDeleteUser}>
                  Remove user
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isUserModalOpen && viewedUser ? (
        <div className={styles.modalOverlay} onClick={() => setIsUserModalOpen(false)}>
          <div className={`${styles.modalCard} ${styles.userModalCard}`} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>User results</p>
                <h2>{`${viewedUser.name} ${viewedUser.surname}`.trim() || viewedUser.login}</h2>
                <p className={styles.detailMeta}>
                  @{viewedUser.login} · {viewedUser.role === "admin" ? "Admin" : "Student"} · Created {formatDateTime(viewedUser.createdAt)}
                </p>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setIsUserModalOpen(false)}>
                ×
              </button>
            </div>

            <div className={styles.userModalBody}>
              <div className={styles.historyCard}>
                <div className={styles.historyTitleRow}>
                  <h3>Played games</h3>
                  <span>{viewedSessions.length} total</span>
                </div>

                {viewedSessions.length ? (
                  <div className={styles.historyList}>
                    {viewedSessions.map((session) => (
                      <article key={session.id} className={styles.historyRow}>
                        <div className={styles.historyPrimary}>
                          <strong>{session.gameTitle}</strong>
                          <span>{formatDateTime(session.playedAt)}</span>
                        </div>
                        <div className={styles.historySecondary}>
                          <span>{session.difficulty}</span>
                          <span>
                            {session.score}/{session.maxScore}
                          </span>
                          <span>{session.success ? "Finished" : "Not finished"}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>This user has not played any games yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
