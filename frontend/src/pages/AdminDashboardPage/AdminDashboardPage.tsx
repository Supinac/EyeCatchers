import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

type DashboardRow = ReturnType<typeof mapApiUsersToRows>[number];

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
  const { t } = useTranslation();
  const accuracyLabel = session.stats ? `${session.stats.accuracyPercent}%` : "—";
  const correctFoundLabel = session.stats ? `${session.stats.correctHits}/${session.maxScore}` : `${session.score}/${session.maxScore}`;
  const correctTapsLabel = session.stats ? String(session.stats.correctHits) : String(session.score);
  const wrongLabel = session.stats ? String(session.stats.wrongHits) : "0";
  const elapsedLabel = session.stats ? `${session.stats.elapsedSeconds}s` : "—";

  const configPills = [
    t("admin.session.pillGame", { value: formatLabel(session.gameKey) }),
    t("admin.session.pillDifficulty", { value: formatLabel(session.difficulty) }),
    session.stats?.previewSeconds ? t("admin.session.pillPreview", { value: session.stats.previewSeconds }) : null,
    session.stats?.maxGameSeconds ? t("admin.session.pillMaxTime", { value: session.stats.maxGameSeconds }) : null,
    session.stats?.contentMode ? t("admin.session.pillMode", { value: formatLabel(session.stats.contentMode) }) : null,
    session.stats?.gridSize ? t("admin.session.pillGridSize", { value: `${session.stats.gridSize} × ${session.stats.gridSize}` }) : null,
    session.stats?.correctObjectCount ? t("admin.session.pillRightObjects", { value: session.stats.correctObjectCount }) : null,
    session.stats?.figureSizeMode ? t("admin.session.pillFigureSize", { value: formatLabel(session.stats.figureSizeMode) }) : null,
    session.stats?.targetValue ? t("admin.session.pillTarget", { value: session.stats.targetValue }) : null,
  ].filter(Boolean) as string[];

  return (
    <article className={styles.sessionCard}>
      <div className={styles.sessionHeader}>
        <div className={styles.sessionHero}>
          <div
            className={`${styles.sessionBadge} ${session.success ? styles.sessionBadgeSuccess : styles.sessionBadgeFail}`.trim()}
          >
            {session.success ? t("admin.session.statusFinished") : t("admin.session.statusNotFinished")}
          </div>
          <div>
            <h4 className={styles.sessionTitle}>{session.gameTitle}</h4>
            <p className={styles.sessionMetaLine}>{t("admin.session.playedAt", { value: formatDateTime(session.playedAt) })}</p>
          </div>
        </div>
        <div className={styles.sessionScoreBlock}>
          <span className={styles.sessionScoreLabel}>{t("admin.session.correctFound")}</span>
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
        <AdminStatCard label={t("admin.session.accuracy")} value={accuracyLabel} />
        <AdminStatCard label={t("admin.session.correctTaps")} value={correctTapsLabel} />
        <AdminStatCard label={t("admin.session.wrongTaps")} value={wrongLabel} />
        <AdminStatCard label={t("admin.session.timeUsed")} value={elapsedLabel} />
      </div>
    </article>
  );
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getAuthState, logout } = useAuth();
  const auth = getAuthState();

  const [selectedRole, setSelectedRole] = useState<AuthRole>("child");
  const [viewedUserId, setViewedUserId] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DashboardRow | null>(null);
  const [hiddenDeletedIds, setHiddenDeletedIds] = useState<string[]>([]);
  const [login, setLogin] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [version, setVersion] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [studentRows, setStudentRows] = useState<DashboardRow[]>([]);
  const [adminRows, setAdminRows] = useState<DashboardRow[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [tableError, setTableError] = useState("");

  const hiddenDeletedIdsSet = useMemo(() => new Set(hiddenDeletedIds), [hiddenDeletedIds]);
  const allTableRows = useMemo(
    () => [...studentRows, ...adminRows].filter((row) => !hiddenDeletedIdsSet.has(row.id)),
    [adminRows, hiddenDeletedIdsSet, studentRows],
  );
  const filteredRows = useMemo(
    () => (selectedRole === "admin" ? adminRows : studentRows).filter((row) => !hiddenDeletedIdsSet.has(row.id)),
    [adminRows, hiddenDeletedIdsSet, selectedRole, studentRows],
  );
  const viewedUser = useMemo(
    () => (viewedUserId ? getUserById(viewedUserId) : undefined),
    [viewedUserId, version],
  );
  const viewedSessions = useMemo(
    () => (viewedUser ? getSessionsForUser(viewedUser.id) : []),
    [viewedUser, version],
  );

  async function loadUsers(hiddenIdsOverride?: string[]) {
    setIsTableLoading(true);
    setTableError("");

    try {
      const [studentsResponse, adminsResponse] = await Promise.all([getStudents(), getAdmins()]);
      const hiddenIds = new Set(hiddenIdsOverride ?? hiddenDeletedIds);

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

      const visibleStudents = studentsResponse.filter((user) => !hiddenIds.has(String(user.id)));
      const visibleAdmins = adminsResponse.filter((user) => !hiddenIds.has(String(user.id)) && !isSameAdminAccount(auth, { id: user.id, login: user.login, role: "admin" }));

      setStudentRows(mapApiUsersToRows("child", visibleStudents));
      setAdminRows(mapApiUsersToRows("admin", visibleAdmins));
    } catch (apiError) {
      setTableError(getApiErrorMessage(apiError, t("admin.messages.loadFailed")));
    } finally {
      setIsTableLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const getRoleLabel = (role: AuthRole) => (role === "admin" ? t("admin.roleAdmin") : t("admin.roleStudent"));
  const getRoleLabelLower = (role: AuthRole) => (role === "admin" ? t("admin.roleAdminLower") : t("admin.roleStudentLower"));
  const selectedRolePlural = selectedRole === "admin" ? t("admin.roleAdmins") : t("admin.roleStudents");

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

    if (!targetRow) {
      return;
    }

    if (isSameAdminAccount(auth, { id: userId, login: targetRow.login, role: targetRow.role })) {
      setMessage(t("admin.messages.cannotRemoveOwnAccount"));
      setMessageType("error");
      return;
    }

    setDeleteTarget(targetRow);
  }

  function handleCloseDeleteModal() {
    setDeleteTarget(null);
  }

  async function handleDeleteUser() {
    if (!deleteTarget) {
      return;
    }

    if (isSameAdminAccount(auth, { id: deleteTarget.id, login: deleteTarget.login, role: deleteTarget.role })) {
      setMessage(t("admin.messages.cannotRemoveOwnAccount"));
      setMessageType("error");
      handleCloseDeleteModal();
      return;
    }

    const targetId = deleteTarget.id;
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

      const nextHiddenDeletedIds = [...new Set([...hiddenDeletedIds, targetId])];
      setHiddenDeletedIds(nextHiddenDeletedIds);

      if (targetRole === "admin") {
        setAdminRows((current) => current.filter((row) => row.id !== targetId));
      } else {
        setStudentRows((current) => current.filter((row) => row.id !== targetId));
      }

      setDeleteTarget(null);
      setVersion((current) => current + 1);
      setMessage(t("admin.messages.removed", { role: getRoleLabel(targetRole), login: targetLogin }));
      setMessageType("success");

      await loadUsers(nextHiddenDeletedIds);

      if (deletedOwnAccount) {
        logout();
        navigate(routes.entry);
      }
    } catch (apiError) {
      setMessage(getApiErrorMessage(apiError, t("admin.messages.removeFailed", { role: getRoleLabelLower(deleteTarget.role) })));
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

      setMessage(t("admin.messages.created", { role: getRoleLabel(selectedRole), login: response.login }));
      setMessageType("success");
      setVersion((current) => current + 1);
      resetForm();

      window.setTimeout(() => {
        setIsCreateModalOpen(false);
        setMessage("");
        setMessageType("");
      }, 500);
    } catch (apiError) {
      setMessage(getApiErrorMessage(apiError, t("admin.messages.createFailed", { role: getRoleLabelLower(selectedRole) })));
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
            <p className={styles.eyebrow}>{t("admin.eyebrow")}</p>
            <h1 className={styles.title}>{t("admin.title")}</h1>
            <p className={styles.subtitle}>{t("admin.subtitle")}</p>
          </div>

          <div className={styles.topbarActions}>
            <div className={styles.userBadge}>
              <div className={styles.avatar}>{auth?.displayName?.slice(0, 1).toUpperCase() || "A"}</div>
              <div>
                <strong>{auth?.displayName || t("admin.roleAdmin")}</strong>
                <span>{t("admin.userRoleLabel")}</span>
              </div>
            </div>
            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              {t("admin.logout")}
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
              {t("admin.students")}
            </button>
            <button
              type="button"
              className={`${styles.segmentButton} ${selectedRole === "admin" ? styles.segmentButtonActive : ""}`}
              onClick={() => setSelectedRole("admin")}
            >
              {t("admin.admins")}
            </button>
          </div>

          {tableError ? (
            <div className={`${styles.feedback} ${styles.feedbackError}`}>{tableError}</div>
          ) : null}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("admin.table.fullName")}</th>
                  <th>{t("admin.table.login")}</th>
                  <th>{t("admin.table.gamesPlayed")}</th>
                  <th>{t("admin.table.bestScore")}</th>
                  <th>{t("admin.table.lastPlayed")}</th>
                  <th className={styles.actionColumn}>{t("admin.table.action")}</th>
                </tr>
              </thead>
              <tbody>
                {isTableLoading ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyTable}>
                      {t("admin.table.loading", { role: selectedRolePlural })}
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
                              {t("admin.actions.view")}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => handleOpenDeleteModal(row.id)}
                          >
                            {t("admin.actions.remove")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyTable}>
                      {t("admin.table.empty", { role: selectedRolePlural })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.tableFooter}>
            <button type="button" className={styles.createButton} onClick={() => handleOpenCreateModal(selectedRole)}>
              {t("admin.actions.createNew", { role: getRoleLabelLower(selectedRole) })}
            </button>
          </div>
        </section>
      </div>

      {isCreateModalOpen ? (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>{t("admin.modal.createAccount")}</p>
                <h2>{t("admin.modal.createNew", { role: getRoleLabelLower(selectedRole) })}</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setIsCreateModalOpen(false)}>
                ×
              </button>
            </div>

            <form className={styles.modalForm} onSubmit={handleCreateUser}>
              <div className={styles.fieldGroup}>
                <label htmlFor="create-login">{t("admin.modal.labelLogin")}</label>
                <input
                  id="create-login"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                  placeholder={t("admin.modal.placeholderLogin")}
                  minLength={AUTH_LOGIN_MIN_LENGTH}
                  maxLength={AUTH_FIELD_MAX_LENGTH}
                  disabled={isCreating}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="create-full-name">{t("admin.modal.labelFullName")}</label>
                <input
                  id="create-full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder={t("admin.modal.placeholderFullName")}
                  minLength={AUTH_NAME_MIN_LENGTH}
                  maxLength={AUTH_FIELD_MAX_LENGTH}
                  disabled={isCreating}
                />
              </div>

              {selectedRole === "admin" ? (
                <div className={styles.fieldGroup}>
                  <label htmlFor="create-password">{t("admin.modal.labelPassword")}</label>
                  <input
                    id="create-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("admin.modal.placeholderPassword")}
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
                    ? t("admin.modal.helperAdmin")
                    : t("admin.modal.helperStudent"))}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
                  {t("admin.modal.cancel")}
                </button>
                <button type="submit" className={styles.primaryButton} disabled={isCreating}>
                  {isCreating ? t("admin.modal.creating") : t("admin.modal.create", { role: getRoleLabelLower(selectedRole) })}
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
                <p className={styles.modalEyebrow}>{t("admin.modal.deleteUser")}</p>
                <h2>{t("admin.modal.removeRole", { role: getRoleLabelLower(deleteTarget.role === "admin" ? "admin" : "child") })}</h2>
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
                {deleteTarget.role === "child" ? t("admin.modal.deleteWarningWithResults") : t("admin.modal.deleteWarning")}
              </p>

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={handleCloseDeleteModal} disabled={isDeleting}>
                  {t("admin.modal.cancel")}
                </button>
                <button type="button" className={styles.dangerButton} onClick={handleDeleteUser} disabled={isDeleting}>
                  {isDeleting ? t("admin.modal.removing") : t("admin.modal.removeUser")}
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
                <p className={styles.modalEyebrow}>{t("admin.modal.userResults")}</p>
                <h2>{`${viewedUser.name} ${viewedUser.surname}`.trim() || viewedUser.login}</h2>
                <p className={styles.detailMeta}>
                  @{viewedUser.login} · {getRoleLabel(viewedUser.role === "admin" ? "admin" : "child")} · {t("admin.modal.createdAt", { value: formatDateTime(viewedUser.createdAt) })}
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
                    <h3>{t("admin.modal.playedGames")}</h3>
                    <p className={styles.historySubtitle}>{t("admin.modal.historySubtitle")}</p>
                  </div>
                  <span>{t("admin.modal.total", { value: viewedSessions.length })}</span>
                </div>

                {viewedSessions.length ? (
                  <div className={styles.historyList}>
                    {viewedSessions.map((session) => (
                      <SessionResultCard key={session.id} session={session} />
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>{t("admin.modal.noGames")}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
