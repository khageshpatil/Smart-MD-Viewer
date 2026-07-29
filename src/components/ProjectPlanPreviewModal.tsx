/**
 * ProjectPlanPreviewModal Component
 * Shows preview of AI-generated project plan before creation
 */

import { GeneratedTask } from "@/lib/aiActions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TaskTypeBadge } from "./TaskTypeBadge";
import { Check, X, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ProjectPlanPreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tasks: GeneratedTask[];
  phases: Array<{ name: string; taskCount: number }>;
  summary?: string;
  loading?: boolean;
}

export const ProjectPlanPreviewModal = ({
  open,
  onClose,
  onConfirm,
  tasks,
  phases,
  summary,
  loading = false,
}: ProjectPlanPreviewModalProps) => {
  // Group tasks by phase
  const tasksByPhase = phases.map((phase) => ({
    phase,
    tasks: tasks.filter((t) => t.phaseName === phase.name),
  }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generated Project Plan
          </DialogTitle>
          <DialogDescription>
            Review the generated tasks before creating them. You can edit tasks after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Summary */}
          {summary && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Tasks: </span>
              <span className="font-medium">{tasks.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Phases: </span>
              <span className="font-medium">{phases.length}</span>
            </div>
          </div>

          <Separator />

          {/* Tasks by Phase */}
          <ScrollArea className="flex-1">
            <div className="space-y-6 pr-4">
              {tasksByPhase.map(({ phase, tasks: phaseTasks }, idx) => (
                <Card key={phase.name}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Phase {idx + 1}: {phase.name}
                      </CardTitle>
                      <Badge variant="outline">{phaseTasks.length} tasks</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {phaseTasks.map((task, taskIdx) => (
                        <div
                          key={taskIdx}
                          className="p-3 border rounded-md bg-muted/30"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-medium text-sm flex-1">
                              {task.title}
                            </h4>
                            <TaskTypeBadge type={task.type} />
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            <Check className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : `Create ${tasks.length} Tasks`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};



