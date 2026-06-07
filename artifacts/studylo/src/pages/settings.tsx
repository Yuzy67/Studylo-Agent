import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useSettings, getInitials } from "@/hooks/use-settings";
import type { StudyLevel, DefaultMode, ResponseStyle, AccentColor } from "@/hooks/use-settings";
import {
  User, Brain, Palette, Shield, Info, Check,
  BookOpen, Code2, Zap, FileText, Globe,
  Trash2, RotateCcw, Wifi, Star, ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getListOpenaiConversationsQueryKey, useListOpenaiConversations } from "@workspace/api-client-react";

const SECTIONS = [
  { id: "profile",    label: "Profile",        icon: User },
  { id: "ai",         label: "AI Preferences", icon: Brain },
  { id: "appearance", label: "Appearance",      icon: Palette },
  { id: "data",       label: "Privacy & Data",  icon: Shield },
  { id: "about",      label: "About",           icon: Info },
];

const STUDY_LEVELS: { value: StudyLevel; label: string; desc: string }[] = [
  { value: "middle-school", label: "Middle School", desc: "Ages 11–14" },
  { value: "high-school",   label: "High School",   desc: "Ages 14–18" },
  { value: "university",    label: "University",    desc: "Undergrad / Postgrad" },
  { value: "self-learner",  label: "Self-learner",  desc: "Independent study" },
  { value: "developer",     label: "Developer",     desc: "Building things" },
  { value: "researcher",    label: "Researcher",    desc: "Academic / professional" },
];

const MODES: { value: DefaultMode; label: string; icon: React.ElementType }[] = [
  { value: "study",      label: "Study Assistant",      icon: BookOpen },
  { value: "research",   label: "Research (Live Web)",  icon: Wifi },
  { value: "dev-tools",  label: "Dev Tools",            icon: Code2 },
  { value: "vibe-coder", label: "Vibe Coder",           icon: Zap },
  { value: "notes",      label: "Smart Notes",          icon: FileText },
];

const RESPONSE_STYLES: { value: ResponseStyle; label: string; desc: string }[] = [
  { value: "concise",  label: "Concise",  desc: "Short, to the point" },
  { value: "balanced", label: "Balanced", desc: "Clear with context" },
  { value: "detailed", label: "Detailed", desc: "Deep explanations" },
];

const ACCENT_COLORS: { value: AccentColor; label: string; cls: string; glow: string }[] = [
  { value: "purple", label: "Purple",  cls: "bg-purple-600",  glow: "shadow-[0_0_16px_rgba(124,58,237,0.6)]" },
  { value: "blue",   label: "Ocean",   cls: "bg-blue-600",    glow: "shadow-[0_0_16px_rgba(37,99,235,0.6)]" },
  { value: "green",  label: "Emerald", cls: "bg-emerald-600", glow: "shadow-[0_0_16px_rgba(5,150,105,0.6)]" },
  { value: "orange", label: "Amber",   cls: "bg-orange-500",  glow: "shadow-[0_0_16px_rgba(249,115,22,0.6)]" },
];

export default function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [mobileShowContent, setMobileShowContent] = useState(false);
  const queryClient = useQueryClient();
  const { data: conversations } = useListOpenaiConversations();

  const initials = getInitials(settings.name);

  const handleSave = (partial: Parameters<typeof updateSettings>[0]) => {
    updateSettings(partial);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleSelectSection = (id: string) => {
    setActiveSection(id);
    setMobileShowContent(true);
  };

  const handleClearHistory = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    queryClient.setQueryData(getListOpenaiConversationsQueryKey(), []);
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    setConfirmClear(false);
  };

  const activeLabel = SECTIONS.find(s => s.id === activeSection)?.label ?? "";

  const SectionContent = () => (
    <div className="space-y-6">

      {/* ── PROFILE ── */}
      {activeSection === "profile" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Your Profile</h2>
            <p className="text-white/40 text-sm mt-0.5">Personalise how Studylo addresses you.</p>
          </div>

          <div className="flex items-center gap-4 p-4 glass-card rounded-2xl border border-white/[0.07]">
            <div className="w-14 h-14 rounded-xl bg-violet-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 logo-glow">
              {initials}
            </div>
            <div>
              <p className="text-white font-semibold">{settings.name || "Student"}</p>
              <p className="text-white/40 text-sm capitalize">{settings.studyLevel.replace(/-/g, " ")}</p>
              <p className="text-violet-400 text-xs mt-0.5 flex items-center gap-1">
                <Star className="w-3 h-3" /> Studylo member
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/50">Display Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              onBlur={() => handleSave({})}
              placeholder="e.g. Alex"
              maxLength={40}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50">Study Level</label>
            <div className="grid grid-cols-2 gap-2">
              {STUDY_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  onClick={() => handleSave({ studyLevel: lvl.value })}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    settings.studyLevel === lvl.value
                      ? "bg-violet-600/15 border-violet-500/35 text-white"
                      : "bg-white/[0.03] border-white/[0.07] text-white/45 hover:text-white hover:border-white/[0.12]"
                  }`}
                >
                  <p className="font-semibold text-sm">{lvl.label}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">{lvl.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AI PREFERENCES ── */}
      {activeSection === "ai" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">AI Preferences</h2>
            <p className="text-white/40 text-sm mt-0.5">Control how the AI thinks and responds.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50">Default Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleSave({ defaultMode: m.value })}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    settings.defaultMode === m.value
                      ? "bg-violet-600/15 border-violet-500/35 text-white"
                      : "bg-white/[0.03] border-white/[0.07] text-white/45 hover:text-white hover:border-white/[0.12]"
                  }`}
                >
                  <m.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{m.label}</span>
                  {settings.defaultMode === m.value && <Check className="w-4 h-4 ml-auto text-violet-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50">Response Style</label>
            <div className="grid grid-cols-3 gap-2">
              {RESPONSE_STYLES.map((rs) => (
                <button
                  key={rs.value}
                  onClick={() => handleSave({ responseStyle: rs.value })}
                  className={`p-3 rounded-xl border transition-all ${
                    settings.responseStyle === rs.value
                      ? "bg-violet-600/15 border-violet-500/35 text-white"
                      : "bg-white/[0.03] border-white/[0.07] text-white/45 hover:text-white hover:border-white/[0.12]"
                  }`}
                >
                  <p className="font-semibold text-sm">{rs.label}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{rs.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-white/[0.07]">
            <div>
              <p className="text-sm font-semibold text-white">Show Web Search Badge</p>
              <p className="text-xs text-white/35 mt-0.5">Display badge on Research answers</p>
            </div>
            <button
              onClick={() => handleSave({ showWebBadge: !settings.showWebBadge })}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings.showWebBadge ? "bg-violet-600" : "bg-white/[0.1]"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.showWebBadge ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/50">Daily Study Goal</label>
              <span className="text-violet-400 text-sm font-bold">{settings.dailyGoalMinutes} min</span>
            </div>
            <input
              type="range" min={15} max={240} step={15}
              value={settings.dailyGoalMinutes}
              onChange={(e) => updateSettings({ dailyGoalMinutes: Number(e.target.value) })}
              onMouseUp={() => handleSave({})}
              onTouchEnd={() => handleSave({})}
              className="w-full accent-violet-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-white/25">
              <span>15 min</span><span>1 hr</span><span>2 hr</span><span>4 hr</span>
            </div>
          </div>
        </div>
      )}

      {/* ── APPEARANCE ── */}
      {activeSection === "appearance" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Appearance</h2>
            <p className="text-white/40 text-sm mt-0.5">Customise the look and feel.</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-white/50">Accent Colour</label>
            <div className="flex gap-3 flex-wrap">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleSave({ accentColor: c.value })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    settings.accentColor === c.value ? "border-white/20 bg-white/[0.04]" : "border-transparent hover:border-white/[0.08]"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full ${c.cls} ${settings.accentColor === c.value ? c.glow : ""} transition-all flex items-center justify-center`}>
                    {settings.accentColor === c.value && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-xs text-white/40">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PRIVACY & DATA ── */}
      {activeSection === "data" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Privacy & Data</h2>
            <p className="text-white/40 text-sm mt-0.5">Manage your conversations and settings.</p>
          </div>

          <div className="p-4 glass-card rounded-xl border border-white/[0.07]">
            <p className="text-sm text-white/60">Conversations stored</p>
            <p className="text-3xl font-bold text-violet-400 mt-1">{conversations?.length ?? 0}</p>
            <p className="text-xs text-white/25 mt-1">Stored privately in your own database.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-red-500/15">
              <div>
                <p className="text-sm font-semibold text-white">Clear Chat History</p>
                <p className="text-xs text-white/35 mt-0.5">Removes all conversations</p>
              </div>
              <button
                onClick={handleClearHistory}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
                  confirmClear ? "bg-red-600 text-white" : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {confirmClear ? "Confirm" : "Clear"}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-white/[0.07]">
              <div>
                <p className="text-sm font-semibold text-white">Reset All Settings</p>
                <p className="text-xs text-white/35 mt-0.5">Restores defaults</p>
              </div>
              <button
                onClick={resetSettings}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-white/[0.04] text-white/50 border border-white/[0.07] hover:text-white transition-all flex-shrink-0"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ABOUT ── */}
      {activeSection === "about" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">About Studylo</h2>
            <p className="text-white/40 text-sm mt-0.5">App info and AI model details.</p>
          </div>

          <div className="p-5 glass-card rounded-2xl border border-white/[0.07] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center logo-glow">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <p className="text-white font-bold">Studylo</p>
                <p className="text-white/40 text-sm">AI Study & Dev Companion</p>
              </div>
            </div>
            <div className="h-px bg-white/[0.05]" />
            <div className="space-y-2.5 text-sm">
              {[
                { label: "Version",         value: "1.0.0" },
                { label: "AI Router",       value: "OpenRouter" },
                { label: "Study Model",     value: "GPT-4o mini" },
                { label: "Research Model",  value: "Perplexity Sonar" },
                { label: "Dev Tools Model", value: "GPT-4o mini" },
                { label: "Database",        value: "PostgreSQL" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-white/40">{label}</span>
                  <span className="text-white/80 font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/25 leading-relaxed p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            Studylo uses OpenRouter to route your queries to the best AI model for each task. Your conversations are stored privately in your own database. No data is shared with third parties.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <AppLayout>
      {/* Saved toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-16 md:top-5 right-4 flex items-center gap-2 px-4 py-2.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-sm font-semibold z-50 backdrop-blur-xl"
          >
            <Check className="w-4 h-4" /> Saved
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex h-full overflow-hidden">

        {/* ── Desktop sidebar nav ── */}
        <div className="w-52 flex-shrink-0 border-r border-white/[0.05] bg-[#080810] flex-col gap-1 p-3 pt-6 hidden sm:flex">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeSection === s.id
                  ? "bg-white/[0.07] text-white border border-white/[0.08]"
                  : "text-white/40 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <s.icon className={`w-4 h-4 flex-shrink-0 ${activeSection === s.id ? "text-violet-400" : ""}`} />
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Mobile: section list ── */}
        {!mobileShowContent && (
          <div className="flex-1 overflow-y-auto p-4 sm:hidden">
            <h2 className="text-lg font-bold text-white mb-4">Settings</h2>
            <div className="space-y-2">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSection(s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white/70 hover:text-white hover:bg-white/[0.06] transition-all text-left"
                >
                  <s.icon className="w-5 h-5 text-violet-400 flex-shrink-0" />
                  <span className="font-medium">{s.label}</span>
                  <Globe className="w-4 h-4 ml-auto text-white/20 hidden" />
                  <span className="ml-auto text-white/25">›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Mobile: section content ── */}
        {mobileShowContent && (
          <div className="flex-1 overflow-y-auto p-4 sm:hidden">
            <button
              onClick={() => setMobileShowContent(false)}
              className="flex items-center gap-1.5 text-violet-400 text-sm font-medium mb-5 -ml-1"
            >
              <ChevronLeft className="w-4 h-4" /> Settings
            </button>
            <SectionContent />
          </div>
        )}

        {/* ── Desktop: content ── */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 hidden sm:block">
          <div className="max-w-2xl mx-auto">
            <SectionContent />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
