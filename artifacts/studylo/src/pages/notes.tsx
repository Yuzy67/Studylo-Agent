import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGenerateFlashcards } from "@workspace/api-client-react";
import { FileText, Wand2, Layers, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Notes() {
  const [notes, setNotes] = useState("");
  const [deck, setDeck] = useState<any>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const generateCards = useGenerateFlashcards();

  const handleGenerate = () => {
    if (!notes.trim()) return;
    generateCards.mutate(
      { data: { notes } },
      {
        onSuccess: (data) => {
          setDeck(data);
          setCurrentCardIndex(0);
          setIsFlipped(false);
        },
      }
    );
  };

  const handleNext = () => {
    if (deck && currentCardIndex < deck.flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex((prev) => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex((prev) => prev - 1), 150);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">

          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2.5" style={{ fontFamily: "var(--app-font-serif)" }}>
              <FileText className="w-6 h-6 md:w-7 md:h-7 text-violet-400 flex-shrink-0" />
              Smart Notes
            </h1>
            <p className="text-white/40 text-sm md:text-base">
              Paste your notes and generate an interactive flashcard deck instantly.
            </p>
          </div>

          {/* Two-column layout — stacks on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">

            {/* Input panel */}
            <div className="flex flex-col gap-3">
              <div className="glass-card rounded-2xl border border-white/[0.07] flex flex-col" style={{ minHeight: "280px" }}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Paste your lecture notes, readings, or any text here…"
                  className="flex-1 w-full bg-transparent border-none text-white text-sm resize-none focus:outline-none placeholder:text-white/20 p-4 md:p-5 min-h-[220px] md:min-h-[320px]"
                />
                <div className="px-4 pb-4 md:px-5 md:pb-5 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
                  <span className="text-xs text-white/25">{notes.trim().split(/\s+/).filter(Boolean).length} words</span>
                  <button
                    onClick={handleGenerate}
                    disabled={!notes.trim() || generateCards.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl clay-button transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Wand2 className="w-4 h-4" />
                    {generateCards.isPending ? "Generating…" : "Generate Deck"}
                  </button>
                </div>
              </div>
            </div>

            {/* Flashcard panel */}
            <div className="flex flex-col items-center justify-center min-h-[280px]">
              {!deck ? (
                <div className="glass-card rounded-2xl border border-dashed border-white/[0.1] w-full flex flex-col items-center justify-center text-white/25 gap-3 p-8 text-center min-h-[280px] md:min-h-[380px]">
                  <Layers className="w-12 h-12 text-violet-500/25 mb-1" />
                  <p className="font-semibold text-white/40">No deck yet</p>
                  <p className="text-sm leading-relaxed">Paste your notes and click Generate Deck to create flashcards.</p>
                </div>
              ) : (
                <div className="w-full max-w-md space-y-5 md:space-y-6">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg md:text-xl font-bold text-white">{deck.title}</h2>
                    <p className="text-violet-400 text-sm font-medium">
                      Card {currentCardIndex + 1} of {deck.flashcards.length}
                    </p>
                  </div>

                  {/* Card flip */}
                  <div
                    className="relative w-full cursor-pointer select-none"
                    style={{ height: "220px", perspective: "1000px" }}
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <motion.div
                      className="w-full h-full relative"
                      style={{ transformStyle: "preserve-3d" }}
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.55, type: "spring", stiffness: 280, damping: 22 }}
                    >
                      {/* Front */}
                      <div
                        className="absolute inset-0 glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-white/[0.08]"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-violet-500/10 text-violet-400 text-[10px] rounded-lg uppercase tracking-wider font-semibold">
                          {deck.flashcards[currentCardIndex].topic}
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-white leading-snug">
                          {deck.flashcards[currentCardIndex].front}
                        </h3>
                        <div className="absolute bottom-4 flex items-center gap-1.5 text-white/25 text-xs">
                          <RotateCcw className="w-3 h-3" /> Tap to flip
                        </div>
                      </div>

                      {/* Back */}
                      <div
                        className="absolute inset-0 glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-violet-500/20 bg-violet-950/30"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      >
                        <p className="text-sm md:text-base text-white/80 leading-relaxed">
                          {deck.flashcards[currentCardIndex].back}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center items-center gap-4">
                    <button
                      onClick={handlePrev}
                      disabled={currentCardIndex === 0}
                      className="p-3 rounded-full bg-white/[0.05] text-white hover:bg-violet-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-white/[0.08]"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Dots */}
                    <div className="flex gap-1.5">
                      {deck.flashcards.slice(0, Math.min(deck.flashcards.length, 8)).map((_: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => { setIsFlipped(false); setCurrentCardIndex(i); }}
                          className={`rounded-full transition-all ${i === currentCardIndex ? "w-4 h-1.5 bg-violet-400" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"}`}
                        />
                      ))}
                      {deck.flashcards.length > 8 && <span className="text-white/25 text-[10px] self-center">+{deck.flashcards.length - 8}</span>}
                    </div>

                    <button
                      onClick={handleNext}
                      disabled={currentCardIndex === deck.flashcards.length - 1}
                      className="p-3 rounded-full bg-white/[0.05] text-white hover:bg-violet-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-white/[0.08]"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
