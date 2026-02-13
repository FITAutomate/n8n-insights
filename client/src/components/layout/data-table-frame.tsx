import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DataTableFrameProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function DataTableFrame({ title, description, children }: DataTableFrameProps) {
  return (
    <Card className="fit-table-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base text-fit-navy">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}
