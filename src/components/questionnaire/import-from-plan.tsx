'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Import, X, Check } from 'lucide-react';

interface ImportFromPlanProps {
  businessPlanTitle: string;
  importableFields: { gtmField: string; label: string; value: string }[];
  onImport: () => void;
  onDismiss: () => void;
}

export function ImportFromPlan({
  businessPlanTitle,
  importableFields,
  onImport,
  onDismiss,
}: ImportFromPlanProps) {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    await onImport();
    setIsImporting(false);
  };

  return (
    <Card className="mb-8 border-primary/30 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Import from Business Plan?
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                We found your finalized business plan <strong>{businessPlanTitle}</strong>.
                Would you like to import relevant information?
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {importableFields.map((field) => (
                  <Badge key={field.gtmField} variant="secondary" className="text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    {field.label}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <Button onClick={handleImport} disabled={isImporting} size="sm">
                  <Import className="w-4 h-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import Data'}
                </Button>
                <Button variant="ghost" onClick={onDismiss} size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Start Fresh
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
