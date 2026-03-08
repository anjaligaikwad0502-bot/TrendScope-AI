import { useState } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResearchAnalysis, YouTubeResult } from './types';

interface ReportDownloadProps {
  paperTitle: string;
  analysis: ResearchAnalysis;
  video: YouTubeResult | null;
}

export function ReportDownload({ paperTitle, analysis, video }: ReportDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
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

      // Title
      addText('ResearchMind Analysis Report', 18, true, [0, 80, 100]);
      addText(paperTitle, 12, false, [80, 80, 80]);
      addText(`Generated: ${new Date().toLocaleDateString()}`, 9, false, [120, 120, 120]);
      y += 6;

      // Summary
      addSection('Executive Summary');
      addText(analysis.reasoning_summary, 10);

      // Top Papers
      if (analysis.ranked_papers?.length > 0) {
        addSection('Top Ranked Papers');
        analysis.ranked_papers.slice(0, 5).forEach((p, i) => {
          addText(`${i + 1}. ${p.title}`, 10, true);
          addText(`   Author: ${p.author || 'N/A'} | Relevance: ${Math.round(p.relevance_score * 100)}%`, 9, false, [100, 100, 100]);
        });
      }

      // Claims
      if (analysis.claims?.length > 0) {
        addSection('Key Claims');
        analysis.claims.forEach((c, i) => {
          addText(`${i + 1}. [${c.strength.toUpperCase()}] ${c.text}`, 10);
          addText(`   Type: ${c.type}`, 9, false, [100, 100, 100]);
        });
      }

      // Contradictions
      if (analysis.contradictions?.length > 0) {
        addSection('Contradictions');
        analysis.contradictions.forEach((c, i) => {
          addText(`${i + 1}. [${c.severity}] ${c.description}`, 10);
        });
      }

      // Devil's Advocate
      if (analysis.devils_advocate?.length > 0) {
        addSection("Devil's Advocate Review");
        analysis.devils_advocate.forEach((d, i) => {
          addText(`${i + 1}. ${d.challenge}`, 10);
          addText(`   Re: "${d.target_claim}"`, 9, false, [100, 100, 100]);
        });
      }

      // Confidence
      addSection('Confidence Score Breakdown');
      addText(`Overall Confidence: ${Math.round(analysis.confidence_score * 100)}%`, 12, true);
      if (analysis.confidence_breakdown) {
        const bd = analysis.confidence_breakdown;
        addText(`Recency: ${Math.round(bd.recency * 100)}% | Relevance: ${Math.round(bd.relevance * 100)}% | Agreement: ${Math.round(bd.agreement * 100)}%`, 10);
      }
      addText(analysis.confidence_explanation, 10, false, [80, 80, 80]);

      // Confidence Signals
      if (analysis.confidence_signals) {
        y += 2;
        const signals = analysis.confidence_signals;
        if (signals.positive?.length) {
          addText('✅ Positive Signals:', 10, true, [0, 140, 80]);
          signals.positive.forEach(s => addText(`  • ${s}`, 9));
        }
        if (signals.negative?.length) {
          addText('⚠ Negative Signals:', 10, true, [200, 60, 60]);
          signals.negative.forEach(s => addText(`  • ${s}`, 9));
        }
        if (signals.neutral?.length) {
          addText('ℹ Neutral Observations:', 10, true, [100, 100, 100]);
          signals.neutral.forEach(s => addText(`  • ${s}`, 9));
        }
      }

      // YouTube
      if (video) {
        addSection('Video Explanation');
        addText(video.title, 10, true);
        addText(`Channel: ${video.channel}`, 9, false, [100, 100, 100]);
        addText(`https://www.youtube.com/watch?v=${video.videoId}`, 9, false, [0, 100, 180]);
      }

      // Save
      const filename = `ResearchMind_${paperTitle.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating}
      className="w-full gap-2"
      variant="outline"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating Report…
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <FileText className="w-4 h-4" />
          Download Full Research Report
        </>
      )}
    </Button>
  );
}
