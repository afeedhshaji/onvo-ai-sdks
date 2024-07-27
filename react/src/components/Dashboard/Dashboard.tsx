import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useBackend } from "../Wrapper";
import { Dashboard as DashboardType, Widget } from "@onvo-ai/js";
import usePrefersColorScheme from "use-prefers-color-scheme";
import { defaults } from "chart.js";
import { toast } from "sonner";

type DashboardContext = {
  id: string | undefined;
  dashboard?: DashboardType;
  widgets: Widget[];
  setWidgets: (widgets: Widget[]) => void;
  refreshDashboard: () => Promise<void>;
  refreshWidgets: () => Promise<void>;
  theme: "light" | "dark";
  adminMode?: boolean;
  selectedWidget: Widget | undefined;
  setSelectedWidget: (widget: Widget | undefined) => void;
};

const Context = createContext<DashboardContext>({
  id: undefined,
  dashboard: undefined,
  widgets: [],
  setWidgets: () => {},
  refreshDashboard: async () => {},
  refreshWidgets: async () => {},
  theme: "light",
  adminMode: false,
  selectedWidget: undefined,
  setSelectedWidget: () => {},
});

const r = document.querySelector(":root") as any;
r.style.setProperty(
  "--font-override",
  "'Inter','Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
);
defaults.font.family =
  "'Inter','Helvetica Neue', 'Helvetica', 'Arial', sans-serif";

export const Dashboard: React.FC<{
  id: string;
  adminMode?: boolean;
  children: any;
  className?: string;
}> = ({ id, children, adminMode, className }) => {
  const [dashboard, setDashboard] = useState<DashboardType>();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const backend = useBackend();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const prefersColorScheme = usePrefersColorScheme();
  const [selectedWidget, setSelectedWidget] = useState<Widget>();
  const initialized = useRef(false);

  const refreshDashboard = async () => {
    if (!backend) return;
    await backend.dashboards.get(id).then(setDashboard);
  };

  const refreshWidgets = async () => {
    if (!backend) return;
    await backend.widgets.list({ dashboard: id }).then(setWidgets);
  };

  useEffect(() => {
    if (
      !initialized.current &&
      dashboard &&
      widgets.length > 0 &&
      new Date(dashboard.last_updated_at).getTime() + 300000 <
        new Date().getTime()
    ) {
      initialized.current = true;
      backend
        ?.dashboard(dashboard.id)
        .updateWidgetCache()
        .then((data) => {
          setWidgets(data);
          refreshDashboard();
          toast.success(
            "Your dashboard has been automatically updated in the background"
          );
        });
    }
  }, [dashboard, widgets]);

  useEffect(() => {
    if (id && backend) {
      refreshDashboard();
      refreshWidgets();
    }
  }, [id, backend]);

  useEffect(() => {
    const r = document.documentElement;

    r.style.setProperty(
      "--onvo-font-override",
      "'Inter','Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
    );
    defaults.font.family =
      "'Inter','Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
    let newTheme: "light" | "dark" =
      prefersColorScheme === "dark" ? "dark" : "light";
    if (dashboard && dashboard.settings) {
      if (dashboard.settings?.theme === "dark") {
        newTheme = "dark";
        document.body.classList.add("onvo-dark");
        defaults.borderColor = "#334155";
      } else if (dashboard.settings?.theme === "light") {
        newTheme = "light";
        document.body.classList.remove("onvo-dark");
        defaults.borderColor = "#cbd5e1";
      } else {
        if (prefersColorScheme === "dark") {
          document.body.classList.add("onvo-dark");
          newTheme = "dark";
          defaults.borderColor = "#334155";
        } else {
          newTheme = "light";
          document.body.classList.remove("onvo-dark");
          defaults.borderColor = "#cbd5e1";
        }
      }

      const settings = dashboard.settings;
      r.style.setProperty("--onvo-background-color", settings.light_background);
      r.style.setProperty(
        "--onvo-dark-background-color",
        settings.dark_background
      );

      r.style.setProperty("--onvo-foreground-color", settings.light_foreground);
      r.style.setProperty(
        "--onvo-dark-foreground-color",
        settings.dark_foreground
      );

      r.style.setProperty(
        "--onvo-dark-font-color",
        settings.dark_text || "#aaaaaa"
      );
      r.style.setProperty(
        "--onvo-font-color",
        settings.light_text || "#666666"
      );

      if (newTheme === "dark") {
        defaults.color = settings.dark_text || "#aaaaaa";
      } else {
        defaults.color = settings.light_text || "#666666";
      }

      if (dashboard.settings.font !== "inter") {
        r.style.setProperty("--onvo-font-override", settings.font);
        defaults.font.family = settings.font;
      }

      setTheme(newTheme);
    }
    return () => {
      r.style.setProperty("--onvo-background-color", "");
      r.style.setProperty("--onvo-foreground-color", "");
      r.style.setProperty("--onvo-font-override", "");

      defaults.font.family =
        "'Inter','Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
    };
  }, [dashboard, prefersColorScheme]);

  const style = dashboard?.settings?.custom_css || "";
  return (
    <Context.Provider
      value={{
        setWidgets,
        id,
        dashboard,
        widgets,
        refreshDashboard,
        refreshWidgets,
        theme,
        selectedWidget,
        setSelectedWidget,
        adminMode,
      }}
    >
      <div
        key={theme === "dark" ? "dark" : "light"}
        className={`onvo-dashboard-context onvo-relative onvo-scrollbar-thumb-rounded-full onvo-scrollbar-track-transparent onvo-translate-x-0 onvo-h-full onvo-background-color onvo-flex onvo-flex-col ${
          theme === "dark"
            ? "onvo-dark onvo-scrollbar-thumb-slate-500"
            : "onvo-scrollbar-thumb-slate-400"
        } ${className}`}
      >
        <style>{style}</style>

        {children}
      </div>
    </Context.Provider>
  );
};
export const useDashboard = () => useContext(Context);
