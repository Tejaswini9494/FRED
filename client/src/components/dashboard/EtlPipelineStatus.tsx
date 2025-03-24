import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Status badge component with appropriate styling based on status
function StatusBadge({ status }: { status: string }) {
  const statusStyles = {
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    scheduled: "bg-gray-100 text-gray-700"
  };

  const style = statusStyles[status] || statusStyles.scheduled;

  return <Badge className={style + " rounded-full"}>{formatStatus(status)}</Badge>;
}

// Format status string for display
function formatStatus(status: string) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "scheduled":
      return "Scheduled";
    default:
      return status;
  }
}

// Format date for display
function formatDate(dateString: string) {
  if (!dateString) return "N/A";
  
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

// Calculate duration between start and end times
function calculateDuration(startTime: string, endTime: string) {
  if (!startTime || !endTime) return "Running...";
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end.getTime() - start.getTime();
  
  if (durationMs < 1000) return "Less than a second";
  
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) return `${seconds} seconds`;
  
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ${seconds % 60} sec`;
}

export default function EtlPipelineStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/etl/jobs'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-2">Recent Data Ingestion Tasks</h4>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-neutral-200 rounded-md p-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-1/4 mt-1" />
                <Skeleton className="h-3 w-1/5 mt-1" />
                <Skeleton className="h-3 w-1/3 mt-1" />
              </div>
            ))}
          </div>
          
          <h4 className="text-sm font-medium mb-2 mt-4">Next Scheduled Tasks</h4>
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border border-neutral-200 rounded-md p-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-1/4 mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const etlJobs = data?.data || [];
  
  // Split jobs into completed/in-progress and scheduled
  const completedAndActive = etlJobs.filter(
    job => job.status === "completed" || job.status === "in_progress" || job.status === "failed"
  ).slice(0, 3);
  
  const scheduled = etlJobs.filter(
    job => job.status === "scheduled"
  ).slice(0, 2);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Recent Data Ingestion Tasks</h4>
            <div className="space-y-2">
              {completedAndActive.length > 0 ? (
                completedAndActive.map(job => (
                  <div key={job.id} className="border border-neutral-200 rounded-md p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{job.task}</span>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      Duration: {calculateDuration(job.startTime, job.endTime)}
                    </div>
                    <div className="text-xs text-neutral-500">
                      Records: {job.recordsProcessed ? `${job.recordsProcessed} rows` : "Pending"}
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">
                      {formatDate(job.startTime)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-neutral-500">No recent tasks found</div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Next Scheduled Tasks</h4>
            <div className="space-y-2">
              {scheduled.length > 0 ? (
                scheduled.map(job => (
                  <div key={job.id} className="border border-neutral-200 rounded-md p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{job.task}</span>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">
                      {formatDate(job.startTime)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-neutral-500">No scheduled tasks</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
