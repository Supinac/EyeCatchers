import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { routes } from "../../app/router/routes";
import styles from "./AdminDashboardPage.module.css";

const results = [
  { id: 1, player: "Emma", game: "Find Circle", score: 14, difficulty: "Easy", date: "2026-03-19" },
  { id: 2, player: "Karel", game: "Memory Pairs", score: 11, difficulty: "Medium", date: "2026-03-19" },
  { id: 3, player: "Mia", game: "Shape Match", score: 19, difficulty: "Easy", date: "2026-03-18" },
  { id: 4, player: "Alex", game: "Find Circle", score: 9, difficulty: "Hard", date: "2026-03-18" },
];

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { getAuthState, logout } = useAuth();
  const auth = getAuthState();

  function handleLogout() {
    logout();
    navigate(routes.entry);
  }

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>Logout</button>
        <div className={styles.userBadge}>
          <div className={styles.avatar}>{auth?.displayName?.slice(0, 1).toUpperCase() || "A"}</div>
          <span>{auth?.displayName || "Admin"}</span>
        </div>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>Admin dashboard</h1>
        <p className={styles.subtitle}>See recent players and example results.</p>
      </header>

      <section className={styles.statsGrid}>
        <article className={styles.statCard}><span>Total Players</span><strong>12</strong></article>
        <article className={styles.statCard}><span>Games Played</span><strong>57</strong></article>
        <article className={styles.statCard}><span>Best Score</span><strong>19</strong></article>
      </section>

      <section className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Player</th>
              <th>Game</th>
              <th>Difficulty</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item) => (
              <tr key={item.id}>
                <td>{item.player}</td>
                <td>{item.game}</td>
                <td>{item.difficulty}</td>
                <td>{item.score}</td>
                <td>{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
