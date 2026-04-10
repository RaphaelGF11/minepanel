"use client";

import { useLanguage } from "@/lib/hooks/useLanguage";
import Image from "next/image";
import { FileBrowser } from "@/components/molecules/FileBrowser";

export default function WorldLibraryPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-400 font-minecraft flex items-center gap-3">
          <Image src="/images/grass.webp" alt="World Library" width={32} height={32} className="opacity-90" />
          {t("worldLibrary")}
        </h1>
        <p className="text-gray-400 mt-2">{t("worldLibraryDesc")}</p>
      </div>

      <FileBrowser serverId=".world" />
    </div>
  );
}
