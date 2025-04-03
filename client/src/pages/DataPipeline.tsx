import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function DataPipeline() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [seriesId, setSeriesId] = useState("GDP");
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState("2023-01-01");

  // Fetch ETL jobs
  const { data: jobsData, isLoading: isLoadingJobs, refetch: refetchJobs } = useQuery({
    queryKey: ['/api/etl/jobs'],
  });

  // Create a new ETL job
  const runEtlMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/etl/run', {
        series_id: seriesId,
        start_date: startDate,
        end_date: endDate
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/etl/jobs'] });
    }
  });

  // Available FRED series
  const indicators = [
    { id: "GDP", name: "Gross Domestic Product" },
    { id: "CPIAUCSL", name: "Consumer Price Index" },
    { id: "UNRATE", name: "Unemployment Rate" },
    { id: "FEDFUNDS", name: "Federal Funds Rate" },
    { id: "SP500", name: "S&P 500 Index" },
    { id: "DGS10", name: "10-Year Treasury Yield" }
  ];

  // Format job status for display
  const formatStatus = (status: string) => {
    const statusColors = {
      "completed": "bg-green-100 text-green-800",
      "failed": "bg-red-100 text-red-800",
      "in_progress": "bg-blue-100 text-blue-800",
      "scheduled": "bg-gray-100 text-gray-800"
    };
    
    const color = statusColors[status] || "bg-gray-100 text-gray-800";
    const label = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return <Badge className={color}>{label}</Badge>;
  };

  const handleRunEtl = async () => {
    try {
      await runEtlMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to run ETL job:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Ingestion Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="series">FRED Data Series</Label>
                  <Select value={seriesId} onValueChange={setSeriesId}>
                    <SelectTrigger id="series">
                      <SelectValue placeholder="Select data series" />
                    </SelectTrigger>
                    <SelectContent>
                      {indicators.map(indicator => (
                        <SelectItem key={indicator.id} value={indicator.id}>
                          {indicator.name} ({indicator.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input 
                      id="start-date" 
                      type="text" 
                      placeholder="YYYY-MM-DD" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input 
                      id="end-date" 
                      type="text" 
                      placeholder="YYYY-MM-DD" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleRunEtl} 
                  disabled={runEtlMutation.isPending}
                  className="w-full"
                >
                  {runEtlMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    "Run ETL Pipeline"
                  )}
                </Button>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium mb-2">Schedule ETL Jobs</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="schedule-task">Task Name</Label>
                    <Input 
                      id="schedule-task" 
                      placeholder="Daily GDP Update" 
                    />
                  </div>
                  <div>
                    <Label>Scheduled Date/Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button className="w-full">Schedule Job</Button>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Recent ETL Jobs</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchJobs()}
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Refresh
                </Button>
              </div>
              
              {isLoadingJobs ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-3">
                        <div className="h-16 animate-pulse bg-gray-100 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {jobsData?.data?.map(job => (
                    <Card key={job.id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{job.task}</h4>
                          {formatStatus(job.status)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Started: {new Date(job.startTime).toLocaleString()}
                        </div>
                        {job.endTime && (
                          <div className="text-sm text-gray-500">
                            Completed: {new Date(job.endTime).toLocaleString()}
                          </div>
                        )}
                        {job.recordsProcessed && (
                          <div className="text-sm text-gray-500">
                            Records: {job.recordsProcessed}
                          </div>
                        )}
                        {job.error && (
                          <div className="text-sm text-red-500 mt-1">
                            Error: {job.error}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
