import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileStack, Plus, Trash2, Loader2, ArrowLeft, Download, FileText, CheckCircle2, AlertTriangle, Handshake, Lightbulb, Trophy, ShieldAlert, BookOpen, Minus, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalyzedPaper {
  index: number;
  title: string;
  authors: string;
  year: string;
  source: string;
  key_claims: string[];
  methodology: string;
  conclusions: string;
  strengths: string[];
  limitations: string[];
  positive_points: string[];
  negative_points: string[];
}

interface Conflict {
  description: string;
  papers_involved: string[];
  severity: string;
  details: string;
  type: string;
}

interface Agreement {
  description: string;
  papers_involved: string[];
  strength: string;
}

interface NeutralFinding {
  description: string;
  paper: string;
}

interface ClaimComparison {
  claim: string;
  supporting_papers: string[];
  opposing_papers: string[];
  confidence: string;
}

interface PaperAnalysisResult {
  papers: AnalyzedPaper[];
  conflicts: Conflict[];
  agreements: Agreement[];
  neutral_findings: NeutralFinding[];
  key_claims_comparison: ClaimComparison[];
  research_insight: string;
  overall_confidence: number;
  recommendation: string;
}

const PIPELINE_STEPS = [
  'Retrieving research papers...',
  'Extracting claims & conclusions...',
  'Detecting contradictions...',
  'Finding agreements...',
  'Analyzing strengths & limitations...',
  'Generating conflict analysis report...',
];

interface PaperAnalyzerProps {
  onBack: () => void;
}

export function PaperAnalyzer({ onBack }: PaperAnalyzerProps) {
  const [paperInputs, setPaperInputs] = useState<string[]>(['', '']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [result, setResult] = useState<PaperAnalysisResult | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const addPaper = () => {
    if (paperInputs.length < 10) {
      setPaperInputs([...paperInputs, '']);
    }
  };

  const removePaper = (index: number) => {
    if (paperInputs.length > 2) {
      setPaperInputs(paperInputs.filter((_, i) => i !== index));
    }
  };

  const updatePaper = (index: number, value: string) => {
    const updated = [...paperInputs];
    updated[index] = value;
    setPaperInputs(updated);
  };

  const validPapers = paperInputs.filter(p => p.trim().length > 0);

  const runAnalysis = async () => {
    if (validPapers.length < 2) {
      toast.error('Please enter at least 2 papers to compare');
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    setPipelineStep(0);

    const interval = setInterval(() => {
      setPipelineStep((prev) => Math.min(prev + 1, PIPELINE_STEPS.length - 1));
    }, 2500);

    try {
      const { data, error } = await supabase.functions.invoke('paper-analyzer', {
        body: { papers: validPapers },
      });

      clearInterval(interval);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Analysis failed');

      setPipelineStep(PIPELINE_STEPS.length);
      setResult(data.data);
      toast.success('Paper analysis complete!');
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      toast.error(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadPDF = async () => {
    if (!result) return;
    setIsGeneratingPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const margin = 15;
      let y = margin;
      const pageWidth = doc.internal.pageSize.width;
      const maxWidth = pageWidth - margin * 2;

      const addText = (text: string, fontSize: number, bold = false, color: [number, number, number] = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, maxWidth);
        for (const line of lines) {
          if (y > 275) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += fontSize * 0.45;
        }
        y += 2;
      };

      const addSection = (title: string) => {
        y += 4;
        if (y > 260) { doc.addPage(); y = margin; }
        addText(title, 13, true, [0, 120, 140]);
        doc.setDrawColor(0, 120, 140);
        doc.line(margin, y, pageWidth - margin, y);
        y += 4;
      };

      addText('TrendScope AI — Paper Conflict Analysis', 18, true, [0, 80, 100]);
      addText(`Papers Compared: ${result.papers.length}`, 12, false, [80, 80, 80]);
      addText(`Generated: ${new Date().toLocaleDateString()}`, 9, false, [120, 120, 120]);
      addText(`Overall Confidence: ${Math.round(result.overall_confidence * 100)}%`, 11, true, [0, 120, 140]);
      y += 6;

      addSection('Research Insight');
      addText(result.research_insight, 10);

      addSection('Papers Analyzed');
      result.papers.forEach((p) => {
        addText(`${p.index}. ${p.title}`, 10, true);
        addText(`   Authors: ${p.authors} | Year: ${p.year} | Source: ${p.source}`, 9, false, [100, 100, 100]);
        addText(`   Methodology: ${p.methodology}`, 9, false, [80, 80, 80]);
        addText(`   Conclusions: ${p.conclusions}`, 9, false, [80, 80, 80]);
        if (p.positive_points?.length) {
          p.positive_points.forEach(pt => addText(`   ✅ ${pt}`, 9, false, [0, 120, 60]));
        }
        if (p.negative_points?.length) {
          p.negative_points.forEach(pt => addText(`   ⚠ ${pt}`, 9, false, [200, 60, 60]));
        }
        y += 2;
      });

      if (result.conflicts?.length > 0) {
        addSection('Conflicts Detected');
        result.conflicts.forEach((c, i) => {
          addText(`${i + 1}. [${c.severity.toUpperCase()}] ${c.description}`, 10, true);
          addText(`   Type: ${c.type} | Papers: ${c.papers_involved.join(' vs ')}`, 9, false, [100, 100, 100]);
          addText(`   ${c.details}`, 9, false, [80, 80, 80]);
        });
      }

      if (result.agreements?.length > 0) {
        addSection('Agreements Found');
        result.agreements.forEach((a, i) => {
          addText(`${i + 1}. [${a.strength.toUpperCase()}] ${a.description}`, 10);
          addText(`   Papers: ${a.papers_involved.join(', ')}`, 9, false, [100, 100, 100]);
        });
      }

      if (result.neutral_findings?.length > 0) {
        addSection('Neutral Findings');
        result.neutral_findings.forEach((n, i) => {
          addText(`${i + 1}. ${n.description}`, 10);
          addText(`   Paper: ${n.paper}`, 9, false, [100, 100, 100]);
        });
      }

      addSection('Key Claims Comparison');
      result.key_claims_comparison?.forEach((c, i) => {
        addText(`${i + 1}. ${c.claim} [${c.confidence}]`, 10, true);
        if (c.supporting_papers.length) addText(`   ✅ Supported by: ${c.supporting_papers.join(', ')}`, 9, false, [0, 120, 60]);
        if (c.opposing_papers.length) addText(`   ⚠ Opposed by: ${c.opposing_papers.join(', ')}`, 9, false, [200, 60, 60]);
      });

      addSection('Recommendation');
      addText(result.recommendation, 10);

      const filename = `PaperAnalysis_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error('PDF failed:', err);
      toast.error('PDF generation failed');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const severityColor = (s: string) => {
    if (s === 'high') return 'destructive';
    if (s === 'medium') return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="p-2.5 rounded-xl bg-primary/10">
          <FileStack className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Paper Analyzer</h2>
          <p className="text-sm text-muted-foreground">Compare specific papers for conflicts & agreements</p>
        </div>
      </motion.div>

      {/* Paper Inputs */}
      {!result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5 border-2 border-border space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Enter papers to compare</p>
              <Badge variant="secondary" className="text-xs">{validPapers.length} paper{validPapers.length !== 1 ? 's' : ''}</Badge>
            </div>

            <div className="space-y-3">
              {paperInputs.map((paper, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-xs font-medium text-muted-foreground w-6 shrink-0">#{index + 1}</span>
                  <Input
                    placeholder="Paper title, DOI, or link..."
                    value={paper}
                    onChange={(e) => updatePaper(index, e.target.value)}
                    disabled={isAnalyzing}
                    className="flex-1"
                  />
                  {paperInputs.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePaper(index)}
                      disabled={isAnalyzing}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={addPaper}
                disabled={isAnalyzing || paperInputs.length >= 10}
                className="gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Paper
              </Button>
              <span className="text-xs text-muted-foreground">
                {paperInputs.length}/10 papers (min 2)
              </span>
            </div>

            <Button
              onClick={runAnalysis}
              disabled={isAnalyzing || validPapers.length < 2}
              className="w-full gap-2"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileStack className="w-4 h-4" />}
              {isAnalyzing ? 'Analyzing Papers...' : `Analyze ${validPapers.length} Papers`}
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Pipeline Progress */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="p-5 border-2 border-primary/20 bg-primary/5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Comparing {validPapers.length} papers</p>
                  <Badge variant="secondary">{pipelineStep + 1}/{PIPELINE_STEPS.length}</Badge>
                </div>
                <Progress value={((pipelineStep + 1) / PIPELINE_STEPS.length) * 100} className="h-2" />
                <div className="space-y-2">
                  {PIPELINE_STEPS.map((step, i) => (
                    <div key={step} className={`flex items-center gap-2 text-sm ${i <= pipelineStep ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      {i < pipelineStep ? (
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      ) : i === pipelineStep ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />
                      )}
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Back to input + Confidence + Download */}
            <Card className="p-5 border-2 border-primary/20">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Confidence</p>
                    <p className="text-2xl font-bold text-foreground">{Math.round(result.overall_confidence * 100)}%</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    New Analysis
                  </Button>
                  <Button onClick={downloadPDF} disabled={isGeneratingPDF} variant="outline" className="gap-2">
                    {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /><FileText className="w-4 h-4" /></>}
                    {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Research Insight */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Research Insight</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{result.research_insight}</p>
            </Card>

            {/* Papers Analyzed */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Papers Analyzed ({result.papers?.length})</h3>
              </div>
              <div className="space-y-4">
                {result.papers?.map((paper, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-lg bg-muted/50 border border-border space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">#{paper.index}</Badge>
                        <h4 className="font-medium text-sm text-foreground">{paper.title}</h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{paper.authors} · {paper.year} · {paper.source}</p>
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Methodology:</span> {paper.methodology}</p>
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Conclusions:</span> {paper.conclusions}</p>

                    {/* Positive & Negative Points */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-foreground flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-primary" /> Positive</p>
                        {paper.positive_points?.map((pt, j) => (
                          <div key={j} className="flex items-start gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            {pt}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-foreground flex items-center gap-1"><ThumbsDown className="w-3 h-3 text-destructive" /> Negative</p>
                        {paper.negative_points?.map((pt, j) => (
                          <div key={j} className="flex items-start gap-1 text-xs text-muted-foreground">
                            <ShieldAlert className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                            {pt}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strengths & Limitations */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="space-y-1">
                        {paper.strengths?.map((s, j) => (
                          <div key={j} className="flex items-start gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            {s}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {paper.limitations?.map((l, j) => (
                          <div key={j} className="flex items-start gap-1 text-xs text-muted-foreground">
                            <ShieldAlert className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                            {l}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Conflicts */}
            {result.conflicts?.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold text-foreground">Conflicts Detected ({result.conflicts.length})</h3>
                </div>
                <div className="space-y-3">
                  {result.conflicts.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={severityColor(c.severity) as any} className="text-xs">{c.severity}</Badge>
                        <Badge variant="outline" className="text-xs">{c.type}</Badge>
                        <p className="text-sm font-medium text-foreground">{c.description}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Papers: {c.papers_involved.join(' vs ')}</p>
                      <p className="text-xs text-muted-foreground">{c.details}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Agreements */}
            {result.agreements?.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Handshake className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Agreements Found ({result.agreements.length})</h3>
                </div>
                <div className="space-y-3">
                  {result.agreements.map((a, i) => (
                    <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{a.strength}</Badge>
                        <p className="text-sm font-medium text-foreground">{a.description}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Papers: {a.papers_involved.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Neutral Findings */}
            {result.neutral_findings?.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Minus className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">Neutral Findings ({result.neutral_findings.length})</h3>
                </div>
                <div className="space-y-3">
                  {result.neutral_findings.map((n, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
                      <p className="text-sm text-foreground">{n.description}</p>
                      <p className="text-xs text-muted-foreground">Paper: {n.paper}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Key Claims Comparison */}
            {result.key_claims_comparison?.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Key Claims Comparison</h3>
                </div>
                <div className="space-y-3">
                  {result.key_claims_comparison.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={c.confidence === 'high' ? 'default' : c.confidence === 'medium' ? 'secondary' : 'outline'} className="text-xs">{c.confidence}</Badge>
                        <p className="text-sm font-medium text-foreground">{c.claim}</p>
                      </div>
                      {c.supporting_papers?.length > 0 && (
                        <p className="text-xs text-primary">✅ Supported by: {c.supporting_papers.join(', ')}</p>
                      )}
                      {c.opposing_papers?.length > 0 && (
                        <p className="text-xs text-destructive">⚠ Opposed by: {c.opposing_papers.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recommendation */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Recommendation</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.recommendation}</p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
