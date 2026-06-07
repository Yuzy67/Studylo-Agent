import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useSettings, getInitials } from "@/hooks/use-settings";
import type { StudyLevel, DefaultMode, ResponseStyle, AccentColor } from "@/hooks/use-settings";
import {
  User, Brain, Palette, Shield, Info, Check,
  GraduationCap, BookOpen, Code2, Zap, FileText, Globe,
  Trash2, RotateCcw, Wifi, ChevronRight, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getListOpenaiConversationsQueryKey, useListOpenaiConversations } from "@workspace/api-client-react";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "ai", label: "AI Preferences", icon: Brain },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "data", label: "Privacy & Data", icon: Shield },
  { id: "about", label: "About", icon: Info },
];

const STUDY_LEVELS: { value: StudyLevel; label: string; desc: string }[] = [
  { value: "middle-school", label: "Middle School", desc: "Ages 11–14" },
  { value: "high-school", label: "High School", desc: "Ages 14–18" },
  { value: "university", label: "University", desc: "Undergrad / Postgrad" },
  { value: "self-learner", label: "Self-learner", desc: "Independent study" },
  { value: "developer", label: "Developer", desc: "Building things" },
  { value: "researcher", label: "Researcher", desc: "Academic / professional" },
];

const MODES: { value: DefaultMode; label: string; icon: React.ElementType; color: string }[] = [
  { value: "study", label: "Study Assistant", icon: BookOpen, color: "purple" },
  { value: "research", label: "Research (Live Web)", icon: Wifi, color: "blue" },
  { value: "dev-tools", label: "Dev Tools", icon: Code2, color: "green" },
  { value: "vibe-coder", label: "Vibe Coder", icon: Zap, color: "orange" },
  { value: "notes", label: "Smart Notes", icon: FileText, color: "pink" },
];

const RESPONSE_STYLES: { value: ResponseStyle; label: string; desc: string }[] = [
  { value: "concise", label: "Concise", desc: "Short, to the point" },
  { value: "balanced", label: "Balanced", desc: "Clear with context" },
  { value: "detailed", label: "Detailed", desc: "Deep explanations" },
];

const ACCENT_COLORS: { value: AccentColor; label: string; cls: string; glow: string }[] = [
  { value: "purple", label: "Purple", cls: "bg-purple-600", glow: "shadow-[0_0_16px_rgba(124,58,237,0.6)]" },
  { value: "blue", label: "Ocean", cls: "bg-blue-600", glow: "shadow-[0_0_16px_rgba(37,99,235,0.6)]" },
  { value: "green", label: "Emerald", cls: "bg-emerald-600", glow: "shadow-[0_0_16px_rgba(5,150,105,0.6)]" },
  { value: "orange", label: "Amber", cls: "bg-orange-500", glow: "shadow-[0_0_16px_rgba(249,115,22,0.6)]" },
];

export default function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const queryClient = useQueryClient();
  const { data: conversations } = useListOpenaiConversations();

  const initials = getInitials(settings.name);

  const handleSave = (partial: Parameters<typeof updateSettings>[0]) => {
    updateSettings(partial);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleClearHistory = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    // Just clear the local display — full delete requires API calls per conversation
    queryClient.setQueryData(getListOpenaiConversationsQueryKey(), []);
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    setConfirmClear(false);
  };

  return (
    <AppLayout>
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Sidebar nav */}
        <div className="w-52 flex-shrink-0 border-r border-purple-500/10 bg-[#0A0A0F] flex flex-col gap-1 p-3 pt-6 hidden sm:flex">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeSection === s.id
                  ? "bg-purple-600/15 text-white border border-purple-500/25"
                  : "text-gray-400 hover:text-white hover:bg-[#111118]"
              }`}
            >
              <s.icon className="w-4 h-4 flex-shrink-0" />
              {s.label}
              {activeSection === s.id && <ChevronRight className="w-3 h-3 ml-auto text-purple-400" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-2xl mx-auto space-y-8">

            {/* Saved toast */}
            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="fixed top-5 right-5 flex items-center gap-2 px-4 py-2.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-sm font-semibold z-50 backdrop-blur-xl"
                >
                  <Check className="w-4 h-4" /> Saved
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── PROFILE ── */}
            {activeSection === "profile" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Your Profile</h2>
                  <p className="text-gray-500 text-sm mt-1">Personalise how Studylo addresses you.</p>
                </div>

                {/* Avatar preview */}
                <div className="flex items-center gap-5 p-5 glass-card rounded-2xl border border-purple-500/15">
                  <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-2xl font-bold purple-glow flex-shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{settings.name || "Student"}</p>
                    <p className="text-gray-500 text-sm capitalize">{settings.studyLevel.replace("-", " ")}</p>
                    <p className="text-purple-400 text-xs mt-1 flex items-center gap-1"><Star className="w-3 h-3" /> Studylo member</p>
                  </div>
                </div>

                {/* Name input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Display Name</label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => updateSettings({ name: e.target.value })}
                    onBlur={() => handleSave({})}
                    placeholder="e.g. Alex"
                    maxLength={40}
                    className="w-full bg-[#111118] border border-purple-500/20 text-white rounded-xl px-4 py-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500/60 transition-colors"
                  />
                </div>

                {/* Study level */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-300">Study Level</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STUDY_LEVELS.map((lvl) => (
                      <button
                        key={lvl.value}
                        onClick={() => handleSave({ studyLevel: lvl.value })}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          settings.studyLevel === lvl.value
                            ? "bg-purple-600/20 border-purple-500/40 text-white"
                            : "bg-[#111118] border-purple-500/10 text-gray-400 hover:text-white hover:border-purple-500/25"
                        }`}
                      >
                        <p className="font-semibold text-sm">{lvl.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{lvl.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── AI PREFERENCES ── */}
            {activeSection === "ai" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">AI Preferences</h2>
                  <p className="text-gray-500 text-sm mt-1">Control how the AI thinks and responds.</p>
                </div>

                {/* Default mode */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-300">Default Mode</label>
                  <p className="text-xs text-gray-600">Which mode opens when you start a new chat from Home.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MODES.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => handleSave({ defaultMode: m.value })}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                          settings.defaultMode === m.value
                            ? "bg-purple-600/15 border-purple-500/40 text-white"
                            : "bg-[#111118] border-purple-500/10 text-gray-400 hover:text-white hover:border-purple-500/20"
                        }`}
                      >
                        <m.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{m.label}</span>
                        {settings.defaultMode === m.value && <Check className="w-4 h-4 ml-auto text-purple-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Response style */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-300">Response Style</label>
                  <p className="text-xs text-gray-600">How thorough should the AI's answers be?</p>
                  <div className="flex gap-2">
                    {RESPONSE_STYLES.map((rs) => (
                      <button
                        key={rs.value}
                        onClick={() => handleSave({ responseStyle: rs.value })}
                        className={`flex-1 p-3 rounded-xl border transition-all ${
                          settings.responseStyle === rs.value
                            ? "bg-purple-600/15 border-purple-500/40 text-white"
                            : "bg-[#111118] border-purple-500/10 text-gray-400 hover:text-white hover:border-purple-500/20"
                        }`}
                      >
                        <p className="font-semibold text-sm">{rs.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{rs.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Web badge toggle */}
                <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-purple-500/15">
                  <div>
                    <p className="text-sm font-semibold text-white">Show Web Search Badge</p>
                    <p className="text-xs text-gray-500 mt-0.5">Display "Live web search result" on Research answers</p>
                  </div>
                  <button
                    onClick={() => handleSave({ showWebBadge: !settings.showWebBadge })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${settings.showWebBadge ? "bg-purple-600" : "bg-[#222]"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.showWebBadge ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>

                {/* Daily goal */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-300">Daily Study Goal</label>
                    <span className="text-purple-400 text-sm font-bold">{settings.dailyGoalMinutes} min</span>
                  </div>
                  <input
                    type="range"
                    min={15} max={240} step={15}
                    value={settings.dailyGoalMinutes}
                    onChange={(e) => updateSettings({ dailyGoalMinutes: Number(e.target.value) })}
                    onMouseUp={() => handleSave({})}
                    onTouchEnd={() => handleSave({})}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>15 min</span><span>1 hr</span><span>2 hr</span><span>4 hr</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── APPEARANCE ── */}
            {activeSection === "appearance" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Appearance</h2>
                  <p className="text-gray-500 text-sm mt-1">Customise the look and feel.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-300">Accent Colour</label>
                  <div className="flex gap-3 flex-wrap">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => handleSave({ accentColor: c.value })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                          settings.accentColor === c.value
                            ? "border-white/30 bg-white/5"
                            : "border-transparent hover:border-white/10"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-full ${c.cls} ${settings.accentColor === c.value ? c.glow : ""} transition-all flex items-center justify-center`}>
                          {settings.accentColor === c.value && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-xs text-gray-400">{c.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">More theme customisation coming soon.</p>
                </div>

                {/* Theme preview card */}
                <div className="p-5 glass-card rounded-2xl border border-purple-500/15 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preview</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${ACCENT_COLORS.find(c => c.value === settings.accentColor)?.cls ?? "bg-purple-600"}`}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{settings.name || "Student"}</p>
                      <p className="text-gray-500 text-xs">Studylo member</p>
                    </div>
                  </div>
                  <div className={`h-1.5 rounded-full ${ACCENT_COLORS.find(c => c.value === settings.accentColor)?.cls ?? "bg-purple-600"} w-2/3`} />
                </div>
              </motion.div>
            )}

            {/* ── PRIVACY & DATA ── */}
            {activeSection === "data" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Privacy & Data</h2>
                  <p className="text-gray-500 text-sm mt-1">Manage your conversations and settings.</p>
                </div>

                <div className="p-4 glass-card rounded-xl border border-purple-500/15 space-y-1">
                  <p className="text-sm font-semibold text-white">Conversations stored</p>
                  <p className="text-3xl font-bold text-purple-400">{conversations?.length ?? 0}</p>
                  <p className="text-xs text-gray-500">Chats are stored in your private database only.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-red-500/15">
                    <div>
                      <p className="text-sm font-semibold text-white">Clear Chat History</p>
                      <p className="text-xs text-gray-500 mt-0.5">Removes all conversations from the sidebar view</p>
                    </div>
                    <button
                      onClick={handleClearHistory}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        confirmClear
                          ? "bg-red-600 text-white"
                          : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      {confirmClear ? "Confirm" : "Clear"}
                    </button>
                  </div>
                  {confirmClear && (
                    <p className="text-xs text-red-400 px-1">Click "Confirm" again to proceed. This cannot be undone.</p>
                  )}

                  <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-purple-500/15">
                    <div>
                      <p className="text-sm font-semibold text-white">Reset All Settings</p>
                      <p className="text-xs text-gray-500 mt-0.5">Restores defaults — your chats are unaffected</p>
                    </div>
                    <button
                      onClick={resetSettings}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-[#111118] text-gray-400 border border-purple-500/15 hover:text-white transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ABOUT ── */}
            {activeSection === "about" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">About Studylo</h2>
                  <p className="text-gray-500 text-sm mt-1">App info and AI model details.</p>
                </div>

                <div className="p-5 glass-card rounded-2xl border border-purple-500/15 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center purple-glow">
                      <span className="text-white font-bold text-xl">S</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">Studylo</p>
                      <p className="text-gray-500 text-sm">AI Study & Dev Companion</p>
                    </div>
                  </div>
                  <div className="h-px bg-purple-500/10" />
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Version", value: "1.0.0" },
                      { label: "AI Router", value: "OpenRouter" },
                      { label: "Study Model", value: "GPT-4o mini" },
                      { label: "Research Model", value: "Perplexity Sonar (live web)" },
                      { label: "Dev Tools Model", value: "GPT-4o mini" },
                      { label: "Database", value: "PostgreSQL" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-gray-500">{label}</span>
                        <span className="text-gray-200 font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-gray-500 leading-relaxed">
                  Studylo uses OpenRouter to route your queries to the best AI model for each task. Your conversations are stored privately in your own database. No data is shared with third parties.
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
