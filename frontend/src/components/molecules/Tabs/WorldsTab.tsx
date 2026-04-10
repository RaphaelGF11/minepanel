import { FC, useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AvailableWorld, ServerConfig } from "@/lib/types/types";
import { useLanguage } from "@/lib/hooks/useLanguage";
import { getServerWorlds, selectServerWorld } from "@/services/docker/fetchs";
import { mcToast } from "@/lib/utils/minecraft-toast";

interface WorldsTabProps {
  serverId: string;
  serverStatus: string;
  config: ServerConfig;
  updateConfig: <K extends keyof ServerConfig>(field: K, value: ServerConfig[K]) => void;
}

export const WorldsTab: FC<WorldsTabProps> = ({ serverId, serverStatus, config, updateConfig }) => {
  const { t } = useLanguage();
  const [worlds, setWorlds] = useState<AvailableWorld[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSource, setSelectedSource] = useState(config.worldSource ?? "");
  const [selectedScope, setSelectedScope] = useState<"local" | "global">(config.worldScope ?? "local");
  const [sourceFilter, setSourceFilter] = useState<"all" | "local" | "global">("all");
  const [worldLevelName, setWorldLevelName] = useState(config.worldLevelName || "world");
  const [forceWorldCopy, setForceWorldCopy] = useState(config.forceWorldCopy ?? false);

  const loadWorlds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getServerWorlds(serverId);
      setWorlds(response);
    } catch (error) {
      console.error("Error loading worlds:", error);
      mcToast.error(t("worldsLoadError"));
    } finally {
      setLoading(false);
    }
  }, [serverId, t]);

  useEffect(() => {
    loadWorlds();
  }, [loadWorlds]);

  useEffect(() => {
    setSelectedSource(config.worldSource ?? "");
    setSelectedScope(config.worldScope ?? "local");
    setWorldLevelName(config.worldLevelName || "world");
    setForceWorldCopy(config.forceWorldCopy ?? false);
  }, [config.worldSource, config.worldScope, config.worldLevelName, config.forceWorldCopy]);

  const handlePickWorld = (world: AvailableWorld) => {
    setSelectedSource(world.source);
    setSelectedScope(world.scope);
    if (!worldLevelName || worldLevelName === "world") {
      setWorldLevelName(world.defaultLevelName);
    }
  };

  const handleApply = async () => {
    if (!selectedSource) {
      mcToast.error(t("worldSelectRequired"));
      return;
    }

    const trimmedLevelName = worldLevelName.trim();
    if (!trimmedLevelName) {
      mcToast.error(t("worldLevelNameRequired"));
      return;
    }

    setSaving(true);
    try {
      const result = await selectServerWorld(serverId, {
        worldSource: selectedSource,
        worldScope: selectedScope,
        worldLevelName: trimmedLevelName,
        forceWorldCopy,
        restartIfRunning: true,
      });

      updateConfig("worldSource", result.config.worldSource ?? selectedSource);
      updateConfig("worldScope", result.config.worldScope ?? selectedScope);
      updateConfig("worldLevelName", result.config.worldLevelName ?? trimmedLevelName);
      updateConfig("forceWorldCopy", result.config.forceWorldCopy ?? forceWorldCopy);
      updateConfig("cfSetLevelFrom", "");

      mcToast.success(result.restarted ? t("worldAppliedAndRestarted") : t("worldApplied"));
      await loadWorlds();
    } catch (error) {
      console.error("Error applying world selection:", error);
      mcToast.error(t("worldApplyError"));
    } finally {
      setSaving(false);
    }
  };

  const isServerRunning = serverStatus === "running" || serverStatus === "starting";
  const visibleWorlds = worlds.filter((world) => sourceFilter === "all" || world.scope === sourceFilter);

  return (
    <Card className="bg-gray-900/60 border-gray-700/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-emerald-400 font-minecraft">{t("worlds")}</CardTitle>
        <CardDescription className="text-gray-300">{t("worldsDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700/50 rounded-md px-3 py-2">
          {isServerRunning ? t("worldsRestartNoticeRunning") : t("worldsRestartNoticeStopped")}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSourceFilter("all")} className={sourceFilter === "all" ? "border-emerald-500/70 text-emerald-300 bg-emerald-900/20" : "border-gray-600 text-gray-300"}>
              {t("allLabel")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setSourceFilter("local")} className={sourceFilter === "local" ? "border-emerald-500/70 text-emerald-300 bg-emerald-900/20" : "border-gray-600 text-gray-300"}>
              {t("worldSourceLocal")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setSourceFilter("global")} className={sourceFilter === "global" ? "border-emerald-500/70 text-emerald-300 bg-emerald-900/20" : "border-gray-600 text-gray-300"}>
              {t("worldSourceLibrary")}
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">{t("loading")}</p>
          ) : visibleWorlds.length === 0 ? (
            <p className="text-sm text-gray-400">{t("worldsEmpty")}</p>
          ) : (
            visibleWorlds.map((world) => (
              <button
                key={`${world.scope}:${world.source}`}
                type="button"
                onClick={() => handlePickWorld(world)}
                className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                  selectedSource === world.source && selectedScope === world.scope
                    ? "border-emerald-500/70 bg-emerald-900/20"
                    : "border-gray-700/60 bg-gray-800/40 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-gray-100">{world.displayPath}</p>
                    <p className="text-xs text-gray-400">{world.type === "directory" ? t("worldTypeFolder") : t("worldTypeArchive")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-blue-500/50 text-blue-300 bg-blue-950/20">
                      {world.scope === "global" ? t("worldSourceLibrary") : t("worldSourceLocal")}
                    </Badge>
                    {world.selected && <Badge variant="secondary">{t("selected")}</Badge>}
                    <Badge
                      variant={world.copied ? "default" : "outline"}
                      className={world.copied ? "" : "border-amber-500/70 text-amber-200 bg-amber-900/30"}
                    >
                      {world.copied ? t("worldCopied") : t("worldNotCopied")}
                    </Badge>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200" htmlFor="worldLevelName">
              {t("worldLevelName")}
            </label>
            <Input
              id="worldLevelName"
              value={worldLevelName}
              onChange={(e) => setWorldLevelName(e.target.value)}
              placeholder="world"
              className="bg-gray-800 border-gray-600 text-gray-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200" htmlFor="forceWorldCopy">
              {t("forceWorldCopy")}
            </label>
            <div className="flex items-center gap-3 rounded-md border border-gray-700/60 bg-gray-800/40 px-3 py-2">
              <Switch id="forceWorldCopy" checked={forceWorldCopy} onCheckedChange={setForceWorldCopy} />
              <span className="text-sm text-gray-300">{t("forceWorldCopyDescription")}</span>
            </div>
          </div>
        </div>

        <Button type="button" onClick={handleApply} disabled={saving || loading || visibleWorlds.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {saving ? t("saving") : t("applyWorldAndRestart")}
        </Button>
      </CardContent>
    </Card>
  );
};
