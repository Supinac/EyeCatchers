import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { deleteAdmin, deleteStudent, getAdmins, getStudents, registerAdmin, registerStudent, type UserListItemResponse } from "../../api/authApi";
import { getApiErrorMessage } from "../../api/client";
import {
  deleteUser,
  formatDateTime,
  getSessionsForUser,
  getUserById,
  upsertUserFromApi,
} from "../../features/users/model/userStore";
import type { StoredGameSession } from "../../features/users/model/userTypes";
import type { AuthRole } from "../../features/auth/model/authTypes";
import {
  AUTH_FIELD_MAX_LENGTH,
  AUTH_LOGIN_MIN_LENGTH,
  AUTH_NAME_MIN_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  validateLogin,
  validateName,
  validatePassword,
} from "../../features/auth/utils/authValidation";
import styles from "./AdminDashboardPage.module.css";

function formatLabel(value: string | undefined) {
  if (!value) return "—";
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mapApiUsersToRows(role: AuthRole, users: UserListItemResponse[]) {
  return users.map((user) => {
    const sessions = getSessionsForUser(String(user.id));
    const bestSession = sessions.reduce<StoredGameSession | null>((best, current) => {
      if (!best) {
        return current;
      }

      const bestRatio = best.maxScore === 0 ? 0 : best.score / best.maxScore;
      const currentRatio = current.maxScore === 0 ? 0 : current.score / current.maxScore;
      return currentRatio > bestRatio ? current : best;
    }, null);

    return {
      id: String(user.id),
      role,
      login: user.login,
      fullName: user.name?.trim() || "—",
      gamesPlayed: sessions.length,
      bestScoreLabel: bestSession ? `${bestSession.score}/${bestSession.maxScore}` : "—",
      lastPlayed: sessions[0]?.playedAt ? formatDateTime(sessions[0].playedAt) : "—",
    };
  });
}

function isSameAdminAccount(
  auth: ReturnType<ReturnType<typeof useAuth>["getAuthState"]>,
  candidate: { id?: number | string; login?: string; role?: AuthRole },
) {
  if (!auth || auth.role !== "admin") {
    return false;
  }

  const candidateId = candidate.id == null ? "" : String(candidate.id);
  return candidateId === auth.userId || candidate.login === auth.login;
}

function AdminStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.sessionStatCard}>
      <span className={styles.sessionStatLabel}>{label}</span>
      <strong className={styles.sessionStatValue}>{value}</strong>
    </div>
  );
}

function SessionResultCard({ session }: { session: StoredGameSession }) {
  const accuracyLabel = session.stats ? `${session.stats.accuracyPercent}%` : "—";
  const correctFoundLabel = session.stats ? `${session.stats.correctHits}/${session.maxScore}` : `${session.score}/${session.maxScore}`;
  const correctTapsLabel = session.stats ? String(session.stats.correctHits) : String(session.score);
  const wrongLabel = session.stats ? String(session.stats.wrongHits) : "0";
  const elapsedLabel = session.stats ? `${session.stats.elapsedSeconds}s` : "—";

  const configPills = [
    `Game: ${formatLabel(session.gameKey)}`,
    `Difficulty: ${formatLabel(session.difficulty)}`,
    session.stats?.previewSeconds ? `Preview: ${session.stats.previewSeconds}s` : null,
    session.stats?.maxGameSeconds ? `Max time: ${session.stats.maxGameSeconds}s` : null,
    session.stats?.contentMode ? `Mode: ${formatLabel(session.stats.contentMode)}` : null,
    session.stats?.gridSize ? `Grid size: ${session.stats.gridSize} × ${session.stats.gridSize}` : null,
    session.stats?.correctObjectCount ? `Right objects: ${session.stats.correctObjectCount}` : null,
    session.stats?.figureSizeMode ? `Figure size: ${formatLabel(session.stats.figureSizeMode)}` : null,
    session.stats?.targetValue ? `Target: ${session.stats.targetValue}` : null,
  ].filter(Boolean) as string[];

  return (
    <article className={styles.sessionCard}>
      <div className={styles.sessionHeader}>
        <div className={styles.sessionHero}>
          <div
            className={`${styles.sessionBadge} ${session.success ? styles.sessionBadgeSuccess : styles.sessionBadgeFail}`.trim()}
          >
            {session.success ? "Finished" : "Not finished"}
          </div>
          <div>
            <h4 className={styles.sessionTitle}>{session.gameTitle}</h4>
            <p className={styles.sessionMetaLine}>Played {formatDateTime(session.playedAt)}</p>
          </div>
        </div>
        <div className={styles.sessionScoreBlock}>
          <span className={styles.sessionScoreLabel}>Correct found</span>
          <strong className={styles.sessionScoreValue}>{correctFoundLabel}</strong>
        </div>
      </div>

      <div className={styles.sessionPills}>
        {configPills.map((pill) => (
          <span key={`${session.id}-${pill}`} className={styles.sessionPill}>
            {pill}
          </span>
        ))}
      </div>

      <div className={styles.sessionStatsGrid}>
        <AdminStatCard label="Accuracy" value={accuracyLabel} />
        <AdminStatCard label="Correct taps" value={correctTapsLabel} />
        <AdminStatCard label="Wrong taps" value={wrongLabel} />
        <AdminStatCard label="Time used" value={elapsedLabel} />
      </div>
    </article>
  );
}

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
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [studentRows, setStudentRows] = useState<ReturnType<typeof mapApiUsersToRows>>([]);
  const [adminRows, setAdminRows] = useState<ReturnType<typeof mapApiUsersToRows>>([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [tableError, setTableError] = useState("");

  const allTableRows = useMemo(() => [...studentRows, ...adminRows], [adminRows, studentRows]);
  const filteredRows = useMemo(() => (selectedRole === "admin" ? adminRows : studentRows), [adminRows, selectedRole, studentRows]);
  const viewedUser = useMemo(
    () => (viewedUserId ? getUserById(viewedUserId) : undefined),
    [viewedUserId, version],
  );
  const viewedSessions = useMemo(
    () => (viewedUser ? getSessionsForUser(viewedUser.id) : []),
    [viewedUser, version],
  );
  const deleteTarget = useMemo(
    () => (deleteTargetId ? allTableRows.find((row) => row.id === deleteTargetId) : undefined),
    [allTableRows, deleteTargetId],
  );

  async function loadUsers() {
    setIsTableLoading(true);
    setTableError("");

    try {
      const [studentsResponse, adminsResponse] = await Promise.all([getStudents(), getAdmins()]);

      studentsResponse.forEach((user) => {
        upsertUserFromApi({
          id: user.id,
          role: "child",
          login: user.login,
          name: user.name,
        });
      });

      adminsResponse.forEach((user) => {
        upsertUserFromApi({
          id: user.id,
          role: "admin",
          login: user.login,
          name: user.name,
        });
      });

      const visibleAdmins = adminsResponse.filter((user) => !isSameAdminAccount(auth, { id: user.id, login: user.login, role: "admin" }));

      setStudentRows(mapApiUsersToRows("child", studentsResponse));
      setAdminRows(mapApiUsersToRows("admin", visibleAdmins));
    } catch (apiError) {
      setTableError(getApiErrorMessage(apiError, "Failed to load users."));
    } finally {
      setIsTableLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

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
    const targetRow = allTableRows.find((row) => row.id === userId);

    if (isSameAdminAccount(auth, { id: userId, login: targetRow?.login, role: targetRow?.role })) {
      setMessage("You cannot remove your own admin account.");
      setMessageType("error");
      return;
    }

    setDeleteTargetId(userId);
  }

  function handleCloseDeleteModal() {
    setDeleteTargetId("");
  }

  async function handleDeleteUser() {
    if (!deleteTargetId || !deleteTarget) {
      return;
    }

    if (isSameAdminAccount(auth, { id: deleteTargetId, login: deleteTarget.login, role: deleteTarget.role })) {
      setMessage("You cannot remove your own admin account.");
      setMessageType("error");
      handleCloseDeleteModal();
      return;
    }

    const targetId = deleteTargetId;
    const targetRole = deleteTarget.role;
    const targetLogin = deleteTarget.login;
    const deletedOwnAccount = isSameAdminAccount(auth, { id: targetId, login: targetLogin, role: targetRole });

    setIsDeleting(true);
    setMessage("");
    setMessageType("");

    try {
      if (targetRole === "admin") {
        await deleteAdmin(Number(targetId));
      } else {
        await deleteStudent(Number(targetId));
      }

      deleteUser(targetId);

      if (viewedUserId === targetId) {
        setViewedUserId("");
        setIsUserModalOpen(false);
      }

      if (targetRole === "admin") {
        setAdminRows((current) => current.filter((row) => row.id !== targetId));
      } else {
        setStudentRows((current) => current.filter((row) => row.id !== targetId));
      }

      handleCloseDeleteModal();
      setVersion((current) => current + 1);
      setMessage(`${targetRole === "admin" ? "Admin" : "Student"} ${targetLogin} was removed.`);
      setMessageType("success");

      await loadUsers();

      if (deletedOwnAccount) {
        logout();
        navigate(routes.entry);
      }
    } catch (apiError) {
      setMessage(getApiErrorMessage(apiError, `Failed to remove ${deleteTarget.role === "admin" ? "admin" : "student"}.`));
      setMessageType("error");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedLogin = login.trim();
    const trimmedPassword = password.trim();

    const nameError = validateName(trimmedName);
    if (nameError) {
      setMessage(nameError);
      setMessageType("error");
      return;
    }

    const loginError = validateLogin(trimmedLogin);
    if (loginError) {
      setMessage(loginError);
      setMessageType("error");
      return;
    }

    if (selectedRole === "admin") {
      const passwordError = validatePassword(trimmedPassword);
      if (passwordError) {
        setMessage(passwordError);
        setMessageType("error");
        return;
      }
    }

    setIsCreating(true);
    setMessage("");
    setMessageType("");

    try {
      const response =
        selectedRole === "admin"
          ? await registerAdmin({
              name: trimmedName,
              login: trimmedLogin,
              password: trimmedPassword,
            })
          : await registerStudent({
              name: trimmedName,
              login: trimmedLogin,
            });

      upsertUserFromApi({
        id: response.id,
        role: selectedRole,
        login: response.login,
        name: response.name,
        password: selectedRole === "admin" ? trimmedPassword : undefined,
      });

      const nextRow = mapApiUsersToRows(selectedRole, [response])[0];
      if (selectedRole === "admin") {
        if (!isSameAdminAccount(auth, { id: response.id, login: response.login, role: "admin" })) {
          setAdminRows((current) => [...current.filter((row) => row.id !== nextRow.id), nextRow].sort((left, right) => left.login.localeCompare(right.login)));
        }
      } else {
        setStudentRows((current) => [...current.filter((row) => row.id !== nextRow.id), nextRow].sort((left, right) => left.login.localeCompare(right.login)));
      }

      setMessage(`${selectedRole === "admin" ? "Admin" : "Student"} ${response.login} was created.`);
      setMessageType("success");
      setVersion((current) => current + 1);
      resetForm();

      window.setTimeout(() => {
        setIsCreateModalOpen(false);
        setMessage("");
        setMessageType("");
      }, 500);
    } catch (apiError) {
      setMessage(getApiErrorMessage(apiError, `Failed to create ${selectedRole === "admin" ? "admin" : "student"}.`));
      setMessageType("error");
    } finally {
      setIsCreating(false);
    }
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

          {tableError ? (
            <div className={`${styles.feedback} ${styles.feedbackError}`}>{tableError}</div>
          ) : null}

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
                {isTableLoading ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyTable}>
                      Loading {selectedRole === "admin" ? "admins" : "students"}...
                    </td>
                  </tr>
                ) : filteredRows.length ? (
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
                  minLength={AUTH_LOGIN_MIN_LENGTH}
                  maxLength={AUTH_FIELD_MAX_LENGTH}
                  disabled={isCreating}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="create-full-name">Full name</label>
                <input
                  id="create-full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="e.g. Oliver Smith"
                  minLength={AUTH_NAME_MIN_LENGTH}
                  maxLength={AUTH_FIELD_MAX_LENGTH}
                  disabled={isCreating}
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
                    minLength={AUTH_PASSWORD_MIN_LENGTH}
                    maxLength={AUTH_FIELD_MAX_LENGTH}
                    disabled={isCreating}
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
                <button type="button" className={styles.secondaryButton} onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton} disabled={isCreating}>
                  {isCreating ? "Creating..." : `Create ${selectedRole === "admin" ? "admin" : "student"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}


      {deleteTarget ? (
        <div className={styles.modalOverlay} onClick={isDeleting ? undefined : handleCloseDeleteModal}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Delete user</p>
                <h2>Remove {deleteTarget.role === "admin" ? "admin" : "student"}?</h2>
                <p className={styles.detailMeta}>
                  {deleteTarget.fullName || deleteTarget.login} · @{deleteTarget.login}
                </p>
              </div>
              <button type="button" className={styles.closeButton} onClick={handleCloseDeleteModal} disabled={isDeleting}>
                ×
              </button>
            </div>

            <div className={styles.deleteModalBody}>
              <p className={styles.deleteText}>
                This action will permanently remove the user account{deleteTarget.role === "child" ? " and all saved game results" : ""}.
              </p>

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={handleCloseDeleteModal} disabled={isDeleting}>
                  Cancel
                </button>
                <button type="button" className={styles.dangerButton} onClick={handleDeleteUser} disabled={isDeleting}>
                  {isDeleting ? "Removing..." : "Remove user"}
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
                  <div>
                    <h3>Played games</h3>
                    <p className={styles.historySubtitle}>Each round now follows the same stat language as the active game result view.</p>
                  </div>
                  <span>{viewedSessions.length} total</span>
                </div>

                {viewedSessions.length ? (
                  <div className={styles.historyList}>
                    {viewedSessions.map((session) => (
                      <SessionResultCard key={session.id} session={session} />
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
