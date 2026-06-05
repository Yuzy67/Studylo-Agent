import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGenerateFlashcards } from "@workspace/api-client-react";
import { FileText, Wand2, Layers, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Notes() {
  const [notes, setNotes] = useState("");
  const [deck, setDeck] = useState<any>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const generateCards = useGenerateFlashcards();

  const handleGenerate = () => {
    if (!notes.trim()) return;
    
    generateCards.mutate({
      data: { notes }
    }, {
      onSuccess: (data) => {
        setDeck(data);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    });
  };

  const handleNext = () => {
    if (deck && currentCardIndex < deck.flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex(prev => prev - 1), 150);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white font-serif flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-500" />
              Smart Notes
            </h1>
            <p className="text-gray-400 text-lg">Paste your lecture notes or readings, and we'll instantly generate a flashcard deck.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-purple-600/10 rounded-2xl blur-lg transition-colors duration-500" />
                <div className="relative glass-card rounded-2xl p-4 flex flex-col h-[500px]">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Paste your notes here..."
                    className="flex-1 w-full bg-transparent border-none text-white resize-none focus:outline-none placeholder:text-gray-600"
                  />
                  <div className="pt-4 border-t border-purple-500/20 flex justify-end">
                    <button
                      onClick={handleGenerate}
                      disabled={!notes.trim() || generateCards.isPending}
                      className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                    >
                      <Wand2 className="w-5 h-5" />
                      {generateCards.isPending ? "Generating..." : "Generate Deck"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              {!deck ? (
                <div className="glass-card rounded-2xl border-dashed border-2 border-purple-500/20 w-full h-[500px] flex flex-col items-center justify-center text-gray-500 gap-4 p-8 text-center">
                  <Layers className="w-16 h-16 text-purple-500/30 mb-2" />
                  <h3 className="text-xl font-bold text-gray-300">No deck generated</h3>
                  <p>Paste your notes on the left and click generate to create an intelligent flashcard deck.</p>
                </div>
              ) : (
                <div className="w-full max-w-md space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">{deck.title}</h2>
                    <p className="text-purple-400 font-medium">Card {currentCardIndex + 1} of {deck.flashcards.length}</p>
                  </div>

                  <div className="relative h-[300px] w-full perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
                    <motion.div
                      className="w-full h-full relative preserve-3d cursor-pointer"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 backface-hidden glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-[0_10px_40px_rgba(124,58,237,0.15)] border-purple-500/30">
                        <div className="absolute top-4 left-4 px-3 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-lg uppercase tracking-wider font-semibold">
                          {deck.flashcards[currentCardIndex].topic}
                        </div>
                        <h3 className="text-2xl font-semibold text-white">{deck.flashcards[currentCardIndex].front}</h3>
                        <div className="absolute bottom-6 flex items-center gap-2 text-gray-500 text-sm">
                          <RotateCcw className="w-4 h-4" /> Click to flip
                        </div>
                      </div>

                      {/* Back */}
                      <div className="absolute inset-0 backface-hidden glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-[0_10px_40px_rgba(124,58,237,0.2)] border-purple-500/50 bg-[#1A1A24]" style={{ transform: "rotateY(180deg)" }}>
                        <p className="text-xl text-gray-200 leading-relaxed">{deck.flashcards[currentCardIndex].back}</p>
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex justify-center items-center gap-6">
                    <button
                      onClick={handlePrev}
                      disabled={currentCardIndex === 0}
                      className="p-3 rounded-full bg-[#111118] text-white hover:bg-purple-600 disabled:opacity-50 disabled:hover:bg-[#111118] transition-colors border border-purple-500/20"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentCardIndex === deck.flashcards.length - 1}
                      className="p-3 rounded-full bg-[#111118] text-white hover:bg-purple-600 disabled:opacity-50 disabled:hover:bg-[#111118] transition-colors border border-purple-500/20"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}} />
    </AppLayout>
  );
}
