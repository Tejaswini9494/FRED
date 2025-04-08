
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchSystemStatus } from "@/lib/api";

interface StatusCardProps {
  title: string;
  status: string;
  subtext: string;
  isActive?: boolean;
}

function StatusCard({ title, status, subtext, isActive = true }: StatusCardProps) {
  return (
    <div className="w-full sm:w-1/2 md:w-1/4 px-3 mb-6">
      <Card className="transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md h-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
            <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-semibold">{status}</p>
            <p className="text-sm text-neutral-500 mt-1">{subtext}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StatusPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: fetchSystemStatus,
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex flex-wrap -mx-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full sm:w-1/2 md:w-1/4 px-3 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="h-24 animate-pulse bg-gray-200 rounded-md"></div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-500">Error loading system status: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusData = data?.data;
  
  const formatRelativeTime = (timestamp: string) => {
    if (!timestamp) return "N/A";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap -mx-3">
        <StatusCard 
          title="Pipeline Status" 
          status={statusData?.pipeline?.status === "active" ? "Active" : "Idle"} 
          subtext={`Last run: ${statusData?.pipeline?.lastRun ? formatRelativeTime(statusData.pipeline.lastRun) : "Never"}`}
        />
        
        <StatusCard 
          title="FRED API" 
          status={statusData?.api?.status === "connected" ? "Connected" : "Disconnected"} 
          subtext={`API Calls: ${statusData?.api?.callCount || 0}/${statusData?.api?.limit || 500}`}
        />
        
        <StatusCard 
          title="Database" 
          status="Healthy" 
          subtext={`Storage: ${statusData?.database?.storageUsed || 0}% used`}
        />
        
        <StatusCard 
          title="Redis Cache" 
          status="Operational" 
          subtext={`Hit rate: ${statusData?.cache?.hitRate || 0}%`}
        />
      </div>
    </div>
  );
}
