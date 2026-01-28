'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  CheckCircle,
  MessageSquare,
  Loader2,
  FileText,
  Lock,
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

  const openRefinement = (section: Section) => {
    setRefinementSection(section);
    setRefinementOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Section Navigation */}
      <div className="w-64 border-r bg-white overflow-y-auto">
        <div className="p-4">
          <h2 className="font-semibold text-lg text-gray-900 mb-1">{title}</h2>
          <Badge variant={isFinalized ? 'default' : 'secondary'}>
            {isFinalized ? 'Finalized' : 'Draft'}
          </Badge>
        </div>
        <Separator />
        <nav className="p-2">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-left transition-colors',
                activeSection === section.key
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{section.title}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {sections.map((section) => {
            if (section.key !== activeSection) return null;
            const sectionContent = content[section.key];

            return (
              <div key={section.key}>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-semibold text-gray-900">
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

                <Card>
                  <CardContent className="prose prose-gray max-w-none pt-6">
                    {sectionContent ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: sectionContent
                            .replace(/\n\n/g, '</p><p>')
                            .replace(/\n/g, '<br/>')
                            .replace(/^/, '<p>')
                            .replace(/$/, '</p>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/^#{3}\s(.*)$/gm, '<h3>$1</h3>')
                            .replace(/^#{2}\s(.*)$/gm, '<h2>$1</h2>')
                            .replace(/^#{1}\s(.*)$/gm, '<h1>$1</h1>')
                            .replace(/^-\s(.*)$/gm, '<li>$1</li>')
                            .replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>'),
                        }}
                      />
                    ) : (
                      <p className="text-gray-500 italic">
                        This section has not been generated yet.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation and Actions */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <div className="flex gap-2">
                    {sections.findIndex((s) => s.key === activeSection) > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const currentIndex = sections.findIndex(
                            (s) => s.key === activeSection
                          );
                          setActiveSection(sections[currentIndex - 1].key);
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
                        }}
                      >
                        Next
                      </Button>
                    )}
                  </div>

                  {!isFinalized && (
                    <Button onClick={handleFinalize} disabled={isFinalizing}>
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
              Tell us what you would like to change about this section.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="For example: 'Add more detail about competitive advantages' or 'Make the tone more professional'"
              rows={6}
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
