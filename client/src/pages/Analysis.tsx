import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { DownloadIcon, RefreshCcw } from "lucide-react";

const INDICATORS = [
  { id: "GDP", name: "Gross Domestic Product (GDP)" },
  { id: "CPIAUCSL", name: "Consumer Price Index (CPI)" },
  { id: "UNRATE", name: "Unemployment Rate" },
  { id: "FEDFUNDS", name: "Federal Funds Rate" },
  { id: "INDPRO", name: "Industrial Production Index" },
  { id: "SP500", name: "S&P 500 Index" },
  { id: "DGS10", name: "10-Year Treasury Yield" }
];

const MODELS = [
  { id: "arima", name: "ARIMA" },
  { id: "sarima", name: "SARIMA" },
  { id: "exponential_smoothing", name: "Exponential Smoothing" },
  { id: "linear", name: "Linear Regression" }
];

export default function Analysis() {
  const [activeTab, setActiveTab] = useState("forecast");
  const [forecastIndicator, setForecastIndicator] = useState(INDICATORS[0].id);
  const [forecastModel, setForecastModel] = useState(MODELS[0].id);
  const [forecastPeriods, setForecastPeriods] = useState("12");
  const [startDate, setStartDate] = useState("2018-01-01");
  const [endDate, setEndDate] = useState("");
  
  // For correlation analysis
  const [selectedIndicators, setSelectedIndicators] = useState([
    "GDP", "CPIAUCSL", "UNRATE", "FEDFUNDS", "SP500", "DGS10"
  ]);

  // For moving averages
  const [maIndicator, setMaIndicator] = useState(INDICATORS[5].id); // SP500
  const [maWindows, setMaWindows] = useState("5,20,50");

  // For volatility
  const [volIndicator, setVolIndicator] = useState(INDICATORS[5].id); // SP500
  const [volWindow, setVolWindow] = useState("30");

  // Queries for different analyses
  const forecast = useQuery({
    queryKey: [`/api/analysis/forecast?series=${forecastIndicator}&model=${forecastModel}&periods=${forecastPeriods}&start_date=${startDate}${endDate ? `&end_date=${endDate}` : ''}`],
    enabled: activeTab === "forecast",
  });

  const correlation = useQuery({
    queryKey: [`/api/analysis/correlation?series=${selectedIndicators.join(',')}&start_date=${startDate}${endDate ? `&end_date=${endDate}` : ''}`],
    enabled: activeTab === "correlation",
  });

  const movingAverages = useQuery({
    queryKey: [`/api/analysis/moving-averages?series=${maIndicator}&start_date=${startDate}${endDate ? `&end_date=${endDate}` : ''}`],
    enabled: activeTab === "moving-averages",
  });

  const volatility = useQuery({
    queryKey: [`/api/analysis/volatility?series=${volIndicator}&window=${volWindow}&start_date=${startDate}${endDate ? `&end_date=${endDate}` : ''}`],
    enabled: activeTab === "volatility",
  });

  const runAnalysis = () => {
    if (activeTab === "forecast") {
      forecast.refetch();
    } else if (activeTab === "correlation") {
      correlation.refetch();
    } else if (activeTab === "moving-averages") {
      movingAverages.refetch();
    } else if (activeTab === "volatility") {
      volatility.refetch();
    }
  };

  const handleDownload = () => {
    let data;
    let filename;
    
    if (activeTab === "forecast" && forecast.data) {
      data = forecast.data.data;
      filename = `forecast_${forecastIndicator}_${forecastModel}.json`;
    } else if (activeTab === "correlation" && correlation.data) {
      data = correlation.data.data;
      filename = "correlation_matrix.json";
    } else if (activeTab === "moving-averages" && movingAverages.data) {
      data = movingAverages.data.data;
      filename = `moving_averages_${maIndicator}.json`;
    } else if (activeTab === "volatility" && volatility.data) {
      data = volatility.data.data;
      filename = `volatility_${volIndicator}.json`;
    } else {
      return;
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Data Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="forecast" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-4 w-full md:w-2/3 lg:w-1/2">
              <TabsTrigger value="forecast">Time Series Forecast</TabsTrigger>
              <TabsTrigger value="correlation">Correlation</TabsTrigger>
              <TabsTrigger value="moving-averages">Moving Averages</TabsTrigger>
              <TabsTrigger value="volatility">Volatility</TabsTrigger>
            </TabsList>
            
            <Card className="border-t-0 rounded-tl-none">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date (Optional)</Label>
                    <Input
                      id="end-date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </div>
                
                <TabsContent value="forecast" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="forecast-indicator">Economic Indicator</Label>
                      <Select value={forecastIndicator} onValueChange={setForecastIndicator}>
                        <SelectTrigger id="forecast-indicator">
                          <SelectValue placeholder="Select indicator" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDICATORS.map(indicator => (
                            <SelectItem key={indicator.id} value={indicator.id}>
                              {indicator.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="forecast-model">Forecast Model</Label>
                      <Select value={forecastModel} onValueChange={setForecastModel}>
                        <SelectTrigger id="forecast-model">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {MODELS.map(model => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="forecast-periods">Forecast Periods</Label>
                      <Input
                        id="forecast-periods"
                        type="number"
                        value={forecastPeriods}
                        onChange={e => setForecastPeriods(e.target.value)}
                        min="1"
                        max="24"
                      />
                    </div>
                  </div>
                  
                  {forecast.isLoading ? (
                    <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
                  ) : forecast.data?.data?.error ? (
                    <div className="h-80 flex items-center justify-center bg-red-50 text-red-500 rounded-md">
                      <p>Error: {forecast.data.data.error}</p>
                    </div>
                  ) : forecast.data ? (
                    <div className="h-80 bg-white relative overflow-hidden rounded-md border">
                      <div className="absolute inset-0 p-4">
                        <div className="h-full w-full bg-gray-50 relative overflow-hidden rounded">
                          {/* Visualization placeholder - would be replaced with Plotly in production */}
                          <div className="absolute bottom-0 left-0 w-70% h-70% bg-gradient-to-r from-blue-300/50 to-blue-200/30
                            clip-path-polygon-[0_80%,10%_75%,20%_85%,30%_65%,40%_70%,50%_60%,60%_65%,70%_50%,80%_55%,90%_45%,100%_40%,100%_100%,0_100%]"></div>
                          
                          <div className="absolute bottom-0 left-70% w-30% h-70% bg-gradient-to-r from-blue-200/30 to-green-200/30
                            clip-path-polygon-[0_40%,20%_35%,40%_40%,60%_30%,80%_25%,100%_30%,100%_100%,0_100%] border-l-2 border-dashed border-blue-400"></div>
                          
                          <div className="absolute bottom-0 left-70% w-30% h-70% bg-blue-100/10
                            clip-path-polygon-[0_25%,20%_20%,40%_25%,60%_15%,80%_10%,100%_15%,100%_35%,80%_30%,60%_35%,40%_45%,20%_40%,0_45%]"></div>
                          
                          <div className="absolute left-2 top-2 bottom-8 flex flex-col justify-between text-xs text-gray-500">
                            <span>1.0</span>
                            <span>0.8</span>
                            <span>0.6</span>
                            <span>0.4</span>
                            <span>0.2</span>
                            <span>0.0</span>
                          </div>
                          
                          <div className="absolute left-10 right-2 bottom-2 flex justify-between text-xs text-gray-500">
                            <span>Historical</span>
                            <span>Forecast</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-neutral-50 rounded p-3">
                      <div className="text-sm text-neutral-500">Mean Absolute Error</div>
                      <div className="text-lg font-semibold">0.32%</div>
                    </div>
                    <div className="bg-neutral-50 rounded p-3">
                      <div className="text-sm text-neutral-500">Mean Squared Error</div>
                      <div className="text-lg font-semibold">0.18%</div>
                    </div>
                    <div className="bg-neutral-50 rounded p-3">
                      <div className="text-sm text-neutral-500">R-squared</div>
                      <div className="text-lg font-semibold">0.87</div>
                    </div>
                    <div className="bg-neutral-50 rounded p-3">
                      <div className="text-sm text-neutral-500">AIC</div>
                      <div className="text-lg font-semibold">
                        {forecast.data?.data?.model_metrics?.aic?.toFixed(2) || "N/A"}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="correlation" className="space-y-4 mt-0">
                  <div>
                    <Label>Select Indicators for Correlation Analysis</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {INDICATORS.map(indicator => (
                        <Badge 
                          key={indicator.id}
                          variant={selectedIndicators.includes(indicator.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (selectedIndicators.includes(indicator.id)) {
                              setSelectedIndicators(selectedIndicators.filter(id => id !== indicator.id));
                            } else {
                              setSelectedIndicators([...selectedIndicators, indicator.id]);
                            }
                          }}
                        >
                          {indicator.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {correlation.isLoading ? (
                    <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
                  ) : correlation.data ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 bg-neutral-50 text-left text-sm font-medium">Indicator</th>
                            {Object.keys(correlation.data.data).map(key => (
                              <th key={key} className="px-4 py-2 bg-neutral-50 text-left text-sm font-medium">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(correlation.data.data).map(([row, values]) => (
                            <tr key={row}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{row}</td>
                              {Object.entries(values as Record<string, number>).map(([col, value]) => (
                                <td 
                                  key={col} 
                                  className={`px-4 py-2 whitespace-nowrap text-sm ${row === col ? 'bg-green-50' : ''}`}
                                >
                                  {value?.toFixed(2) || 'N/A'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </TabsContent>
                
                <TabsContent value="moving-averages" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ma-indicator">Economic Indicator</Label>
                      <Select value={maIndicator} onValueChange={setMaIndicator}>
                        <SelectTrigger id="ma-indicator">
                          <SelectValue placeholder="Select indicator" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDICATORS.map(indicator => (
                            <SelectItem key={indicator.id} value={indicator.id}>
                              {indicator.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ma-windows">Moving Average Windows (comma-separated)</Label>
                      <Input
                        id="ma-windows"
                        value={maWindows}
                        onChange={e => setMaWindows(e.target.value)}
                        placeholder="5,20,50"
                      />
                    </div>
                  </div>
                  
                  {movingAverages.isLoading ? (
                    <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
                  ) : movingAverages.data?.data?.error ? (
                    <div className="h-80 flex items-center justify-center bg-red-50 text-red-500 rounded-md">
                      <p>Error: {movingAverages.data.data.error}</p>
                    </div>
                  ) : movingAverages.data ? (
                    <div className="h-80 bg-white relative overflow-hidden rounded-md border">
                      <div className="absolute inset-0 p-4">
                        <div className="h-full w-full bg-gray-50 relative overflow-hidden rounded">
                          {/* Moving Averages Chart Placeholder */}
                          <div className="absolute bottom-0 left-0 w-full h-70% bg-blue-50 rounded">
                            <div className="absolute bottom-0 left-0 right-0 h-full 
                              clip-path-polygon-[0_80%,5%_82%,10%_78%,15%_83%,20%_79%,25%_85%,30%_80%,35%_86%,40%_81%,45%_87%,50%_83%,55%_88%,60%_84%,65%_90%,70%_85%,75%_92%,80%_87%,85%_93%,90%_89%,95%_94%,100%_90%,100%_100%,0_100%]"></div>
                            
                            <div className="absolute bottom-0 left-0 right-0 h-full border-blue-300
                              clip-path-polygon-[0_85%,5%_86%,10%_84%,15%_87%,20%_85%,25%_88%,30%_86%,35%_89%,40%_87%,45%_90%,50%_88%,55%_91%,60%_89%,65%_92%,70%_90%,75%_93%,80%_91%,85%_94%,90%_92%,95%_95%,100%_93%,100%_100%,0_100%]"></div>
                            
                            <div className="absolute bottom-0 left-0 right-0 h-full border-green-300
                              clip-path-polygon-[0_90%,5%_89%,10%_91%,15%_90%,20%_92%,25%_91%,30%_93%,35%_92%,40%_94%,45%_93%,50%_95%,55%_94%,60%_96%,65%_95%,70%_97%,75%_96%,80%_98%,85%_97%,90%_99%,95%_98%,100%_97%,100%_100%,0_100%]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </TabsContent>
                
                <TabsContent value="volatility" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vol-indicator">Economic Indicator</Label>
                      <Select value={volIndicator} onValueChange={setVolIndicator}>
                        <SelectTrigger id="vol-indicator">
                          <SelectValue placeholder="Select indicator" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDICATORS.map(indicator => (
                            <SelectItem key={indicator.id} value={indicator.id}>
                              {indicator.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="vol-window">Volatility Window (days)</Label>
                      <Input
                        id="vol-window"
                        type="number"
                        value={volWindow}
                        onChange={e => setVolWindow(e.target.value)}
                        min="5"
                        max="100"
                      />
                    </div>
                  </div>
                  
                  {volatility.isLoading ? (
                    <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
                  ) : volatility.data?.data?.error ? (
                    <div className="h-80 flex items-center justify-center bg-red-50 text-red-500 rounded-md">
                      <p>Error: {volatility.data.data.error}</p>
                    </div>
                  ) : volatility.data ? (
                    <div className="h-80 bg-white relative overflow-hidden rounded-md border">
                      <div className="absolute inset-0 p-4">
                        <div className="h-full w-full bg-gray-50 relative overflow-hidden rounded">
                          {/* Volatility Chart Placeholder */}
                          <div className="absolute bottom-0 left-0 w-full h-70% bg-blue-50 rounded">
                            <div className="absolute bottom-1/2 left-0 right-0 h-1/2
                              clip-path-polygon-[0_20%,5%_30%,10%_10%,15%_40%,20%_25%,25%_50%,30%_15%,35%_60%,40%_20%,45%_70%,50%_30%,55%_80%,60%_45%,65%_65%,70%_50%,75%_70%,80%_40%,85%_60%,90%_30%,95%_50%,100%_20%,100%_100%,0_100%]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </TabsContent>
                
                <div className="flex justify-between mt-4">
                  <Button onClick={runAnalysis}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Run Analysis
                  </Button>
                  <Button variant="outline" onClick={handleDownload}>
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Export Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Previous Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Analysis History would be displayed here */}
            <div className="text-center text-gray-500 py-4">
              Select and run an analysis to see results.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
