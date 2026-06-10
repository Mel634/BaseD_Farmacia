import { useLang } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex items-center rounded-full border bg-white text-xs overflow-hidden" role="group" aria-label="Language">
      <Languages className="h-3 w-3 ml-2 text-muted-foreground" />
      <button
        onClick={() => setLang("es")}
        className={`px-2 py-1 font-medium transition ${lang === "es" ? "bg-emerald-600 text-white" : "hover:bg-slate-100"}`}
      >ES</button>
      <button
        onClick={() => setLang("en")}
        className={`px-2 py-1 font-medium transition ${lang === "en" ? "bg-emerald-600 text-white" : "hover:bg-slate-100"}`}
      >EN</button>
    </div>
  );
}
