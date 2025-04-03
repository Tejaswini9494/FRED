import StatusPanel from "@/components/dashboard/StatusPanel";
import MarketOverview from "@/components/dashboard/MarketOverview";
import TimeSeriesAnalysis from "@/components/dashboard/TimeSeriesAnalysis";
import EtlPipelineStatus from "@/components/dashboard/EtlPipelineStatus";
import DataCorrelationMatrix from "@/components/dashboard/DataCorrelationMatrix";
import ApiEndpoints from "@/components/dashboard/ApiEndpoints";

export default function Dashboard() {
  return (
    <>
      <StatusPanel />
      
      <MarketOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="px-4 py-3 border-b border-neutral-200 bg-white rounded-t-lg">
            <h3 className="font-medium">Time Series Analysis</h3>
          </div>
          <TimeSeriesAnalysis />
        </div>
        
        <div>
          <div className="px-4 py-3 border-b border-neutral-200 bg-white rounded-t-lg">
            <h3 className="font-medium">ETL Pipeline Status</h3>
          </div>
          <EtlPipelineStatus />
        </div>
      </div>
      
      <DataCorrelationMatrix />
      
      <ApiEndpoints />
    </>
  );
}
