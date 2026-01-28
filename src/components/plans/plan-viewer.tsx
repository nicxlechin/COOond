'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  Loader2,
  FileText,
  Lock,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { PlanType, PlanStatus } from '@/types/database';

interface Section {
  key: string;
  title: string;
  icon: string;
}

interface PlanViewerProps {
  planId: string;
  planType: PlanType;
  title: string;
  sections: readonly Section[];
  content: Record<string, string>;
  status: PlanStatus;
  isFinalized: boolean;
}

export function PlanViewer({
  planId,
  planType,
  title,
  sections,
  content,
  status,
  isFinalized,
}: PlanViewerProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(sections[0]?.key);
  const [refinementOpen, setRefinementOpen] = useState(false);
  const [refinementSection, setRefinementSection] = useState<Section | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const handleRefine = async () => {
    if (!refinementSection || !feedback.trim()) return;

    setIsRefining(true);
    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          sectionKey: refinementSection.key,
          sectionTitle: refinementSection.title,
          currentContent: content[refinementSection.key],
          feedback: feedback.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine section');
      }

      toast.success('Section refined successfully');
      setRefinementOpen(false);
      setFeedback('');
      router.refresh();
    } catch (error) {
      toast.error('Failed to refine section');
    } finally {
      setIsRefining(false);
    }
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      const response = await fetch(`/api/plans/${planId}/finalize`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to finalize plan');
      }

      toast.success('Plan finalized! Milestones have been extracted.');
      router.refresh();
    } catch (error) {
      toast.error('Failed to finalize plan');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleExportPDF = () => {
    // Create a printable version
    const printContent = sections
      .map((section) => {
        const sectionContent = content[section.key] || '';
        return `<h1 style="page-break-before: always; margin-top: 0;">${section.title}</h1>\n${sectionContent}`;
      })
      .join('\n\n');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title} - Business Plan</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              line-height: 1.8;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              color: #1a1a1a;
            }
            h1 {
              font-size: 28px;
              border-bottom: 2px solid #1a1a1a;
              padding-bottom: 10px;
              margin-top: 40px;
            }
            h2 { font-size: 22px; margin-top: 30px; color: #333; }
            h3 { font-size: 18px; margin-top: 24px; color: #444; }
            p { margin: 16px 0; }
            ul, ol { margin: 16px 0; padding-left: 24px; }
            li { margin: 8px 0; }
            strong { color: #000; }
            blockquote {
              border-left: 4px solid #1a1a1a;
              padding-left: 20px;
              margin: 20px 0;
              font-style: italic;
              background: #f9f9f9;
              padding: 16px 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th { background: #f5f5f5; font-weight: bold; }
            .cover-page {
              text-align: center;
              padding: 100px 0;
              page-break-after: always;
            }
            .cover-page h1 {
              font-size: 42px;
              border: none;
              margin-bottom: 20px;
            }
            .cover-page .subtitle {
              font-size: 18px;
              color: #666;
            }
            @media print {
              body { padding: 0; }
              h1 { page-break-before: always; }
              h1:first-of-type { page-break-before: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="cover-page">
            <h1>${title}</h1>
            <p class="subtitle">Strategic Business Plan</p>
            <p class="subtitle">Prepared by COO on Demand</p>
            <p class="subtitle">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          ${printContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const openRefinement = (section: Section) => {
    setRefinementSection(section);
    setRefinementOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Section Navigation */}
      <div className="w-72 border-r bg-white overflow-y-auto">
        <div className="p-4">
          <h2 className="font-semibold text-lg text-gray-900 mb-2">{title}</h2>
          <div className="flex items-center gap-2">
            <Badge variant={isFinalized ? 'default' : 'secondary'}>
              {isFinalized ? 'Finalized' : 'Draft'}
            </Badge>
            {isFinalized && (
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="w-3 h-3 mr-1" />
                PDF
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <nav className="p-2">
          {sections.map((section, index) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-left transition-colors',
                activeSection === section.key
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium">
                {index + 1}
              </span>
              <span className="truncate">{section.title}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto p-8">
          {sections.map((section) => {
            if (section.key !== activeSection) return null;
            const sectionContent = content[section.key];

            return (
              <div key={section.key}>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {section.title}
                  </h1>
                  {!isFinalized && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRefinement(section)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Refine
                    </Button>
                  )}
                </div>

                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    {sectionContent ? (
                      <div className="prose prose-lg prose-gray max-w-none
                        prose-headings:font-semibold
                        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                        prose-p:text-gray-700 prose-p:leading-relaxed
                        prose-li:text-gray-700
                        prose-strong:text-gray-900
                        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic
                        prose-table:border prose-table:border-gray-200
                        prose-th:bg-gray-50 prose-th:p-3 prose-th:text-left prose-th:font-semibold
                        prose-td:p-3 prose-td:border-t
                      ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {sectionContent}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        This section has not been generated yet.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation and Actions */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <div className="flex gap-2">
                    {sections.findIndex((s) => s.key === activeSection) > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const currentIndex = sections.findIndex(
                            (s) => s.key === activeSection
                          );
                          setActiveSection(sections[currentIndex - 1].key);
                          window.scrollTo(0, 0);
                        }}
                      >
                        Previous
                      </Button>
                    )}
                    {sections.findIndex((s) => s.key === activeSection) <
                      sections.length - 1 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const currentIndex = sections.findIndex(
                            (s) => s.key === activeSection
                          );
                          setActiveSection(sections[currentIndex + 1].key);
                          window.scrollTo(0, 0);
                        }}
                      >
                        Next Section
                      </Button>
                    )}
                  </div>

                  {!isFinalized && (
                    <Button onClick={handleFinalize} disabled={isFinalizing} size="lg">
                      {isFinalizing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Finalizing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Finalize Plan
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Refinement Sheet */}
      <Sheet open={refinementOpen} onOpenChange={setRefinementOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Refine: {refinementSection?.title}</SheetTitle>
            <SheetDescription>
              Tell us what you would like to change about this section. Be specific for best results.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Examples:
• Add more specific metrics and KPIs
• Make the competitive analysis more detailed
• Include a comparison table
• Adjust the tone to be more professional
• Add more industry-specific insights"
              rows={8}
            />
            <Button
              onClick={handleRefine}
              disabled={!feedback.trim() || isRefining}
              className="w-full"
            >
              {isRefining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refining...
                </>
              ) : (
                'Request Changes'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
