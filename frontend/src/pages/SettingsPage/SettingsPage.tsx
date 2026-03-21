import { Link } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { PageLayout } from "../../components/layout/PageLayout";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useSettings } from "../../features/settings/hooks/useSettings";

export function SettingsPage() {
  const { settings, save } = useSettings();

  return (
    <PageLayout
      title="Settings"
      actions={
        <Link to={routes.games}>
          <Button variant="ghost">Back</Button>
        </Link>
      }
    >
      <ScreenContainer>
        <Card>
          <div style={{ display: "grid", gap: 18 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(event) => save({ ...settings, soundEnabled: event.target.checked })}
              />
              Sound enabled
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
              Animation level
              <select
                value={settings.animationLevel}
                onChange={(event) =>
                  save({
                    ...settings,
                    animationLevel: event.target.value as "none" | "minimal",
                  })
                }
                style={{
                  background: "#000",
                  color: "#fff",
                  border: "1px solid #fff",
                  borderRadius: 12,
                  padding: "10px 12px",
                }}
              >
                <option value="none">None</option>
                <option value="minimal">Minimal</option>
              </select>
            </label>
          </div>
        </Card>
      </ScreenContainer>
    </PageLayout>
  );
}
