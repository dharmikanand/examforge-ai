
"use client"

import React, { useState, useEffect } from 'react';
import { UploadSection } from '@/components/UploadSection';
import { ModeSelector } from '@/components/ModeSelector';
import { IntelligenceCard, ContentList, McqList } from '@/components/IntelligenceCard';
import { StudyLibrary } from '@/components/StudyLibrary';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { IntelligenceMode, FileData } from '@/lib/types';
import { 
  Sparkles, 
  BrainCircuit, 
  BookOpen, 
  Flame, 
  Dna, 
  Binary, 
  ClipboardCheck, 
  HelpCircle,
  AlertCircle,
  CheckCircle,
  FileText,
  Target,
  Zap,
  User as UserIcon,
  LogOut,
  Download
} from 'lucide-react';
import { survivalMode } from '@/ai/flows/survival-mode-flow';
import { examWeaponizer } from '@/ai/flows/exam-weaponizer-flow';
import { conceptTrapDetector } from '@/ai/flows/concept-trap-detector-flow';
import { generateMcqs } from '@/ai/flows/generate-mcqs-flow';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirebase, useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { signOut } from 'firebase/auth';

export default function Home() {
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileData[]>([]);
  const [mode, setMode] = useState<IntelligenceMode>('survival');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  // Auto sign-in anonymously if no user is present
  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const handleDataChange = (t: string, f: FileData[]) => {
    setText(t);
    setFiles(f);
  };

  const handleLoadSession = (session: any) => {
    if (!session || !session.generatedContent) {
      toast({
        variant: "destructive",
        title: "Session data missing",
        description: "This session doesn't contain AI generated content."
      });
      return;
    }

    let content = session.generatedContent;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse session content", e);
      }
    }
    
    setResult(content);
    setMode(session.intelligenceModeId as IntelligenceMode || 'survival');
    
    setTimeout(() => {
      const resultsElement = document.getElementById('results');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const exportToMarkdown = () => {
    if (!result) return;
    let content = `# ExamForge AI Intelligence Report\n\n`;
    content += `**Mode:** ${mode.replace('-', ' ').toUpperCase()}\n`;
    content += `**Date:** ${new Date().toLocaleString()}\n\n---\n\n`;

    if (mode === 'survival') {
      content += `## Revision Summary\n${result.revisionSummary}\n\n`;
      content += `## Key Formulas\n${result.keyFormulas.map((i: string) => `- ${i}`).join('\n')}\n\n`;
      content += `## Important Definitions\n${result.importantDefinitions.map((i: string) => `- ${i}`).join('\n')}\n\n`;
      content += `## Critical Theorems\n${result.criticalTheorems.map((i: string) => `- ${i}`).join('\n')}\n`;
    } else if (mode === 'weaponizer') {
      content += `## Probable Questions\n${result.probableQuestions.map((i: string) => `- ${i}`).join('\n')}\n\n`;
      content += `## Predicted Weightage\n**${result.predictedWeightage}**\n\n`;
      content += `## Important Derivations\n${result.importantDerivations.map((i: string) => `- ${i}`).join('\n')}\n\n`;
      content += `## Strategic Suggestions\n${result.strategicStudySuggestions.map((i: string) => `- ${i}`).join('\n')}\n`;
    } else if (mode === 'trap-detector') {
      content += `## Common Mistakes\n${result.commonMistakes.map((i: string) => `- ${i}`).join('\n')}\n\n`;
      content += `## Misconceptions\n${result.misconceptions.map((i: string) => `- ${i}`).join('\n')}\n\n`;
      content += `## Frequently Confused Concepts\n${result.frequentlyConfusedConcepts.map((i: string) => `- ${i}`).join('\n')}\n\n`;
      content += `## Trick Questions\n${result.trickQuestions.map((i: string) => `- ${i}`).join('\n')}\n\n`;
      content += `## Summary\n${result.summary}\n`;
    } else if (mode === 'mcq-generator') {
      content += `## Practice MCQs\n\n`;
      result.mcqs.forEach((mcq: any, idx: number) => {
        content += `### Q${idx + 1}: ${mcq.question}\n`;
        mcq.options.forEach((opt: string, oIdx: number) => {
          content += `${String.fromCharCode(65 + oIdx)}) ${opt}\n`;
        });
        content += `**Answer:** ${mcq.answer}\n`;
        content += `**Explanation:** ${mcq.explanation}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ExamForge_Intelligence_${mode}_${new Date().getTime()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "File Ready",
      description: "Your intelligence report has been downloaded."
    });
  };

  const generateIntelligence = async () => {
    if (!text && files.length === 0) {
      toast({
        variant: "destructive",
        title: "Input required",
        description: "Please provide some text, an image, or a document to analyze."
      });
      return;
    }

    if (!user || !firestore) return;

    setLoading(true);
    setResult(null);

    try {
      let output;
      const combinedText = text + files.map(f => f.textContent || '').join('\n');
      const firstImage = files.find(f => f.type.startsWith('image/'))?.dataUri;
      const docText = files.filter(f => f.type === 'application/pdf' || f.type.includes('presentation')).map(f => f.textContent).join('\n');

      switch (mode) {
        case 'survival':
          output = await survivalMode({ textContent: combinedText || "No text", imageReference: firstImage });
          break;
        case 'weaponizer':
          output = await examWeaponizer({ 
            text: text || combinedText || "Material",
            imageDataUri: firstImage,
            documentTextContent: docText
          });
          break;
        case 'trap-detector':
          output = await conceptTrapDetector({ studyMaterial: combinedText || text || "Material" });
          break;
        case 'mcq-generator':
          output = await generateMcqs({ studyMaterialText: combinedText || text, studyMaterialImage: firstImage });
          break;
      }
      
      if (!output) throw new Error("No output");
      setResult(output);

      const materialRef = doc(collection(firestore, 'users', user.uid, 'studyMaterials'));
      const materialData = {
        id: materialRef.id,
        userId: user.uid,
        title: text.substring(0, 30) || files[0]?.name || "Untitled Session",
        contentType: files.length > 0 ? files[0].type : 'TEXT',
        contentReference: "stored_in_doc",
        extractedText: combinedText,
        uploadDateTime: new Date().toISOString(),
        processingStatus: 'READY_FOR_AI',
        createdAt: serverTimestamp(),
        generatedContent: output,
        intelligenceModeId: mode,
      };
      setDocumentNonBlocking(materialRef, materialData, { merge: true });

      toast({
        title: "Intelligence Forged",
        description: "Saved to your library."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate intelligence."
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-white font-medium animate-pulse">Initializing Forge...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <StudyLibrary onSelectSession={handleLoadSession} />
      
      <SidebarInset className="min-h-screen pb-20">
        <nav className="bg-primary px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-white hover:bg-white/10" />
            <div className="flex items-center gap-2 font-black text-white text-xl tracking-tight">
              ExamForge <span className="text-accent">AI</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-white/50 uppercase font-bold tracking-tighter">
                  {user?.isAnonymous ? "Guest Mode" : "Personal Cloud"}
                </span>
                <span className="text-xs text-white font-medium truncate max-w-[150px]">
                  {user?.isAnonymous ? "Anonymous Scout" : user?.email}
                </span>
             </div>
             
             {user?.isAnonymous ? (
               <AuthModal />
             ) : (
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => auth && signOut(auth)}
                className="text-white hover:bg-white/10"
               >
                 <LogOut size={16} />
               </Button>
             )}

             <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white shadow-sm border border-white/20">
                <UserIcon size={16} />
             </div>
          </div>
        </nav>

        <header className="bg-primary pt-12 pb-24 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          </div>
          
          <div className="max-w-6xl mx-auto relative z-10 px-4">
            <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 px-3 py-1 rounded-full text-accent font-semibold text-xs mb-6 uppercase tracking-widest">
              <Sparkles size={14} /> Intelligence Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              Strategic Exam <span className="text-accent">Dominance</span>
            </h1>
            <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto">
              Transform raw notes, images, PDFs, and PPTX files into professional study weaponries using advanced AI analysis.
            </p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 -mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            <section className="space-y-6">
              <UploadSection onDataChange={handleDataChange} />
              
              <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <BrainCircuit className="text-accent" /> Select Intelligence Mode
                </h2>
                <p className="text-sm text-muted-foreground mb-6">Choose how the AI should analyze your materials for the best results.</p>
                
                <ModeSelector selectedMode={mode} onModeSelect={setMode} />
                
                <div className="mt-8 flex justify-center">
                  <Button 
                    size="lg" 
                    onClick={generateIntelligence} 
                    disabled={loading}
                    className="bg-accent hover:bg-accent/90 text-white font-bold px-10 h-14 rounded-full shadow-lg hover:shadow-accent/20 transition-all hover:scale-105"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Forging Intelligence...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 uppercase tracking-wide">
                        Generate Intelligence <Zap size={18} fill="white" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </section>

            {(loading || result) && (
              <section id="results" className="mt-12 space-y-8 scroll-mt-20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black text-primary mb-2">
                      Generated <span className="text-accent">Intelligence</span>
                    </h2>
                    <div className="h-1 w-20 bg-accent mx-auto md:mx-0 rounded-full" />
                  </div>
                  
                  {result && (
                    <Button 
                      onClick={exportToMarkdown} 
                      variant="outline"
                      className="gap-2 border-accent text-accent hover:bg-accent hover:text-white"
                    >
                      <Download size={18} /> Export as Markdown
                    </Button>
                  )}
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-card p-6 border border-border rounded-xl">
                        <Skeleton className="h-6 w-1/3 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-5/6 mb-2" />
                        <Skeleton className="h-4 w-4/6" />
                      </div>
                    ))}
                  </div>
                ) : result && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mode === 'survival' && (
                      <>
                        <IntelligenceCard title="Revision Summary" icon={<BookOpen />} delay={0}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.revisionSummary}</p>
                        </IntelligenceCard>
                        <IntelligenceCard title="Key Formulas" icon={<Binary />} delay={100}>
                          <ContentList items={result.keyFormulas} />
                        </IntelligenceCard>
                        <IntelligenceCard title="Important Definitions" icon={<FileText />} delay={200}>
                          <ContentList items={result.importantDefinitions} />
                        </IntelligenceCard>
                        <IntelligenceCard title="Critical Theorems" icon={<Target />} delay={300}>
                          <ContentList items={result.criticalTheorems} />
                        </IntelligenceCard>
                      </>
                    )}

                    {mode === 'weaponizer' && (
                      <>
                        <IntelligenceCard title="Probable Questions" icon={<HelpCircle />} delay={0}>
                          <ContentList items={result.probableQuestions} />
                        </IntelligenceCard>
                        <IntelligenceCard title="Predicted Weightage" icon={<Flame />} delay={100}>
                          <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-accent font-bold">
                              {result.predictedWeightage}
                            </div>
                            <p className="text-xs text-muted-foreground italic">Based on competitive exam patterns</p>
                          </div>
                        </IntelligenceCard>
                        <IntelligenceCard title="Important Derivations" icon={<Binary />} delay={200}>
                          <ContentList items={result.importantDerivations} />
                        </IntelligenceCard>
                        <IntelligenceCard title="Strategic Suggestions" icon={<ClipboardCheck />} delay={300}>
                          <ContentList items={result.strategicStudySuggestions} />
                        </IntelligenceCard>
                      </>
                    )}

                    {mode === 'trap-detector' && (
                      <>
                        <IntelligenceCard title="Common Mistakes" icon={<AlertCircle className="text-red-500" />} delay={0}>
                          <ContentList items={result.commonMistakes} />
                        </IntelligenceCard>
                        <IntelligenceCard title="Misconceptions" icon={<BrainCircuit />} delay={100}>
                          <ContentList items={result.misconceptions} />
                        </IntelligenceCard>
                        <IntelligenceCard title="Frequently Confused" icon={<Dna />} delay={200}>
                          <ContentList items={result.frequentlyConfusedConcepts} />
                        </IntelligenceCard>
                        <IntelligenceCard title="Summary" className="md:col-span-1" delay={300}>
                          <p className="text-sm italic text-muted-foreground">{result.summary}</p>
                        </IntelligenceCard>
                        <IntelligenceCard title="Trick Questions" icon={<HelpCircle />} delay={400}>
                          <ContentList items={result.trickQuestions} />
                        </IntelligenceCard>
                      </>
                    )}

                    {mode === 'mcq-generator' && (
                      <div className="md:col-span-2">
                        <IntelligenceCard title="Practice MCQs" icon={<CheckCircle />}>
                          <McqList mcqs={result.mcqs} />
                        </IntelligenceCard>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        </main>

        <footer className="mt-20 border-t border-border pt-10 pb-10 px-4 text-center">
          <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 px-4">
            <div className="flex items-center gap-2 font-bold text-primary">
              <span className="p-1 bg-accent rounded text-white"><Sparkles size={16} /></span>
              ExamForge AI
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering students from Grade 9 to Graduation. Your personal study vault is private and secure.
            </p>
            <div className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest font-bold">
              © 2026 ExamForge AI • Multimodal Intelligence Edition
            </div>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
