'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  Loader2,
  FileText,
  Lock,
  Download,
  Pencil,
  Save,
  X,
  Trash2,
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
  createdAt: string;
  finalizedAt: string | null;
}

export function PlanViewer({
  planId,
  planType,
  title,
  sections,
  content,
  status,
  isFinalized,
  createdAt,
  finalizedAt,
}: PlanViewerProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(sections[0]?.key);
  const [refinementOpen, setRefinementOpen] = useState(false);
  const [refinementSection, setRefinementSection] = useState<Section | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    // Convert markdown tables to HTML
    const convertTables = (md: string): string => {
      const lines = md.split('\n');
      const result: string[] = [];
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];

        // Check if this line starts a table (starts and ends with |)
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          const tableLines: string[] = [];

          // Collect all consecutive table lines
          while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
            tableLines.push(lines[i]);
            i++;
          }

          if (tableLines.length >= 2) {
            // Parse the table
            const headerRow = tableLines[0];
            const separatorRow = tableLines[1];
            const dataRows = tableLines.slice(2);

            // Check if second row is a separator (contains only -, |, :, and spaces)
            const isSeparator = /^[\s|:-]+$/.test(separatorRow);

            if (isSeparator) {
              // Parse header cells
              const headerCells = headerRow.split('|').slice(1, -1).map(c => c.trim());

              // Build HTML table
              let tableHtml = '<table><thead><tr>';
              headerCells.forEach(cell => {
                tableHtml += `<th>${cell}</th>`;
              });
              tableHtml += '</tr></thead><tbody>';

              // Parse data rows
              dataRows.forEach(row => {
                const cells = row.split('|').slice(1, -1).map(c => c.trim());
                tableHtml += '<tr>';
                cells.forEach(cell => {
                  tableHtml += `<td>${cell}</td>`;
                });
                tableHtml += '</tr>';
              });

              tableHtml += '</tbody></table>';
              result.push(tableHtml);
            } else {
              // Not a proper table, just add the lines back
              tableLines.forEach(l => result.push(l));
            }
          } else {
            tableLines.forEach(l => result.push(l));
          }
        } else {
          result.push(line);
          i++;
        }
      }

      return result.join('\n');
    };

    // Convert markdown to HTML for each section
    const convertMarkdown = (md: string) => {
      // First convert tables
      let html = convertTables(md);

      return html
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        // Bold and italic
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Blockquotes
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        // Unordered lists
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    };

    const printContent = sections
      .map((section) => {
        const sectionContent = content[section.key] || '';
        const htmlContent = convertMarkdown(sectionContent);
        return `<section class="plan-section">
          <h1>${section.title}</h1>
          <div class="section-content"><p>${htmlContent}</p></div>
        </section>`;
      })
      .join('\n');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title} - Business Plan</title>
          <style>
            @page {
              margin: 1in;
              size: letter;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.7;
              max-width: 100%;
              margin: 0;
              padding: 0;
              color: #2d3748;
              font-size: 11pt;
            }
            .cover-page {
              text-align: center;
              padding: 3in 1in 2in 1in;
              page-break-after: always;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .cover-page h1 {
              font-size: 32pt;
              font-weight: 700;
              color: #1a202c;
              margin: 0 0 16px 0;
              border: none;
            }
            .cover-page .subtitle {
              font-size: 14pt;
              color: #4a5568;
              margin: 8px 0;
            }
            .cover-page .date {
              font-size: 12pt;
              color: #718096;
              margin-top: 48px;
            }
            .plan-section {
              margin-bottom: 32px;
            }
            .plan-section h1 {
              font-size: 18pt;
              font-weight: 700;
              color: #1a202c;
              margin: 24px 0 16px 0;
              padding-bottom: 8px;
              border-bottom: 2px solid #3182ce;
            }
            .plan-section:first-of-type h1 {
              margin-top: 0;
            }
            .section-content h2 {
              font-size: 14pt;
              font-weight: 600;
              color: #2d3748;
              margin: 20px 0 12px 0;
            }
            .section-content h3 {
              font-size: 12pt;
              font-weight: 600;
              color: #4a5568;
              margin: 16px 0 8px 0;
            }
            .section-content p {
              margin: 0 0 12px 0;
            }
            .section-content ul, .section-content ol {
              margin: 12px 0;
              padding-left: 24px;
            }
            .section-content li {
              margin: 4px 0;
            }
            .section-content strong {
              font-weight: 600;
              color: #1a202c;
            }
            .section-content blockquote {
              border-left: 3px solid #3182ce;
              background: #ebf8ff;
              padding: 12px 16px;
              margin: 16px 0;
              font-style: normal;
              color: #2c5282;
            }
            .section-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              font-size: 10pt;
            }
            .section-content th, .section-content td {
              border: 1px solid #e2e8f0;
              padding: 8px 12px;
              text-align: left;
            }
            .section-content th {
              background: #f7fafc;
              font-weight: 600;
            }
            .section-content tr:nth-child(even) {
              background: #f7fafc;
            }
            .footer {
              text-align: center;
              margin-top: 48px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
              font-size: 9pt;
              color: #a0aec0;
            }
            @media print {
              body { padding: 0; }
              .cover-page { padding: 2in 0; }
              .plan-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="cover-page">
            <h1>${title}</h1>
            <p class="subtitle">Strategic Business Plan</p>
            <p class="subtitle">Prepared with Co-COO</p>
            <p class="date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          ${printContent}
          <div class="footer">
            Generated with Co-COO - Your AI Business Partner
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const openRefinement = (section: Section) => {
    setRefinementSection(section);
    setRefinementOpen(true);
  };

  const deletePlan = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/plans/${planId}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      toast.success('Plan deleted');
      router.push('/plans');
    } catch (error) {
      toast.error('Failed to delete plan');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const saveTitle = async () => {
    if (!editedTitle.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/plans/${planId}/update-title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editedTitle.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to save title');
      }

      toast.success('Title updated');
      setIsEditingTitle(false);
      router.refresh();
    } catch (error) {
      toast.error('Failed to save title');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (sectionKey: string) => {
    setEditContent(content[sectionKey] || '');
    setIsEditMode(true);
  };

  const cancelEditing = () => {
    setEditContent('');
    setIsEditMode(false);
  };

  const saveEdit = async () => {
    if (!activeSection) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/plans/${planId}/update-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: activeSection,
          content: editContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      toast.success('Changes saved');
      setIsEditMode(false);
      router.refresh();
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Section Navigation */}
      <div className="w-72 border-r bg-white overflow-y-auto">
        <div className="p-4">
          {isEditingTitle ? (
            <div className="space-y-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="font-semibold"
                placeholder="Plan name..."
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveTitle} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  setEditedTitle(title);
                  setIsEditingTitle(false);
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="group cursor-pointer"
              onClick={() => setIsEditingTitle(true)}
            >
              <h2 className="font-semibold text-lg text-gray-900 mb-2 flex items-center gap-2">
                {title}
                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              </h2>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={isFinalized ? 'default' : 'secondary'}>
              {isFinalized ? 'Finalized' : 'Draft'}
            </Badge>
            {isFinalized && (
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="w-3 h-3 mr-1" />
                PDF
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <p>Created: {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            {finalizedAt && (
              <p>Finalized: {new Date(finalizedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
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
                  {!isFinalized && !isEditMode && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(section.key)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRefinement(section)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Refine with AI
                      </Button>
                    </div>
                  )}
                  {isEditMode && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    {isEditMode ? (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                          Edit the content below using Markdown formatting. Use ## for headers, **bold**, *italic*, - for lists, etc.
                        </p>
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={20}
                          className="font-mono text-sm"
                          placeholder="Write your content here using Markdown..."
                        />
                      </div>
                    ) : sectionContent ? (
                      <div className="plan-content">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the plan
              and all associated milestones and check-ins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePlan}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
