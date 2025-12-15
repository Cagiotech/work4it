import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Trash2, Download } from "lucide-react";

interface StudentDocumentsTabProps {
  studentId: string;
  canEdit: boolean;
}

export function StudentDocumentsTab({ studentId, canEdit }: StudentDocumentsTabProps) {
  // TODO: Implement file storage with Supabase Storage
  // For now, this is a placeholder UI
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Documentos
            </span>
            {canEdit && (
              <Button size="sm" disabled>
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">PDF e imagens até 5MB</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Sistema de documentos em desenvolvimento.</p>
            <p className="text-xs mt-1">Em breve poderá anexar documentos como atestado médico, contrato, etc.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
