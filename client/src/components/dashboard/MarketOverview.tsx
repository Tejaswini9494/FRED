import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, RefreshCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { apiRequest, fetchIndicator } from "@/lib/api";

interface MarketIndicatorProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  children: React.ReactNode;
}

function MarketIndicator({ title, value, change, isPositive, children }: MarketIndicatorProps) {
  const changeColor = isPositive ? "text-green-500" : "text-red-500";
  const changeIcon = isPositive ? "fa-caret-up" : "fa-caret-down";

  return (
    <div className="card bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="font-medium">{title}</h3>
        <div className="flex items-center">
          <span className="text-lg font-semibold">{value}</span>
          <span className={`ml-2 ${changeColor} text-sm`}>
            <i className={`fas ${changeIcon}`}></i> {change}
          </span>
        </div>
      </div>
      <div className="p-2 h-60 bg-white">
        {children}
      </div>
    </div>
  );
}

export default function MarketOverview() {
  const [dateRange, setDateRange] = useState("30");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [sp500Data, setSp500Data] = useState<any[]>([]);
  const [dgs10Data, setDgs10Data] = useState<any[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/market/overview'],
  });

  useEffect(() => {
    // Fetch historical data for the charts once the overview data is loaded
    if (data?.data) {
      fetchHistoricalData();
    }
  }, [data]);

  const fetchHistoricalData = async () => {
    try {
      // Fetch S&P 500 data
      const sp500Response = await fetchIndicator('SP500');
      if (sp500Response.success && sp500Response.data.values) {
        const values = sp500Response.data.values.slice(0, 30);
        setSp500Data(values);
      }
      
      // Fetch 10-Year Treasury Yield data
      const dgs10Response = await fetchIndicator('DGS10');
      if (dgs10Response.success && dgs10Response.data.values) {
        const values = dgs10Response.data.values.slice(0, 30);
        setDgs10Data(values);
      }
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  };

  const handleRefresh = async () => {
    await refetch();
    await fetchHistoricalData();
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-semibold">Market Overview</h2>
          <div className="flex items-center space-x-2">
            <Button disabled>
              <RefreshCcw className="mr-1 h-4 w-4" /> Refresh Data
            </Button>
            <Select disabled>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Last 30 Days" />
              </SelectTrigger>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-neutral-200">
                  <div className="h-6 animate-pulse bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="p-2 h-60 animate-pulse bg-gray-100"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const overview = data?.data || {};

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-semibold">Market Overview</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh}>
            <RefreshCcw className="mr-1 h-4 w-4" /> Refresh Data
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-36 justify-start">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* S&P 500 Chart */}
        <MarketIndicator 
          title="S&P 500 Index" 
          value={overview.SP500?.value || "N/A"} 
          change={`${overview.SP500?.percentChange || 0}%`}
          isPositive={(overview.SP500?.percentChange || 0) > 0}
        >
          <div className="h-full w-full bg-gradient-to-r from-blue-50 to-green-50 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-70% bg-gradient-to-r from-blue-300/50 to-blue-200/30 clip-path-stocks"></div>
          </div>
        </MarketIndicator>
        
        {/* 10-Year Treasury Yield */}
        <MarketIndicator 
          title="10-Year Treasury Yield" 
          value={`${overview.DGS10?.value || "N/A"}%`} 
          change={`${overview.DGS10?.percentChange || 0}%`}
          isPositive={(overview.DGS10?.percentChange || 0) < 0}
        >
          <div className="h-full w-full bg-gradient-to-r from-red-50 to-orange-50 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-70% bg-gradient-to-r from-red-300/50 to-red-200/30 clip-path-treasury"></div>
          </div>
        </MarketIndicator>
        
        {/* Unemployment Rate */}
        <MarketIndicator 
          title="Unemployment Rate" 
          value={`${overview.UNRATE?.value || "N/A"}%`} 
          change={`${overview.UNRATE?.percentChange || 0}%`}
          isPositive={(overview.UNRATE?.percentChange || 0) < 0}
        >
          <div className="h-full w-full bg-gradient-to-r from-blue-50 to-cyan-50 relative overflow-hidden">
            <div className="flex items-end justify-between h-full px-4 pt-4">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-4 bg-blue-400 mx-1" 
                  style={{ height: `${Math.max(20, 80 - i * 3)}%` }}
                ></div>
              ))}
            </div>
          </div>
        </MarketIndicator>
      </div>
    </div>
  );
}
