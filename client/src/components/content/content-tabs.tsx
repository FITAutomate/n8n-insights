import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContentTabsProps {
  code: ReactNode;
  diagram: ReactNode;
  notes?: ReactNode;
}

export function ContentTabs({ code, diagram, notes }: ContentTabsProps) {
  return (
    <Tabs defaultValue="code" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="code" data-testid="tab-code">Code</TabsTrigger>
        <TabsTrigger value="diagram" data-testid="tab-diagram">Diagram</TabsTrigger>
        <TabsTrigger value="notes" data-testid="tab-notes">Notes</TabsTrigger>
      </TabsList>
      <TabsContent value="code">{code}</TabsContent>
      <TabsContent value="diagram">{diagram}</TabsContent>
      <TabsContent value="notes">{notes ?? <p className="text-sm text-muted-foreground">No notes yet.</p>}</TabsContent>
    </Tabs>
  );
}
