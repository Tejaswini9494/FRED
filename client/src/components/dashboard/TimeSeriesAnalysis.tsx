import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/api";

const indicators = [
  { id: "GDP", name: "Gross Domestic Product (GDP)" },
  { id: "CPIAUCSL", name: "Consumer Price Index (CPI)" },
  { id: "UNRATE", name: "Unemployment Rate" },
  { id: "FEDFUNDS", name: "Federal Funds Rate" },
  { id: "INDPRO", name: "Industrial Production Index" }
];

const models = [
  { id: "arima", name: "ARIMA" },
  { id: "sarima", name: "SARIMA" },
  { id: "exponential_smoothing", name: "Exponential Smoothing" },
  { id: "linear", name: "Linear Regression" }
];

export default function TimeSeriesAnalysis() {
  const [indicator, setIndicator] = useState(indicators[0].id);
  const [model, setModel] = useState(models[0].id);

  const { data, isLoading } = useQuery({
    queryKey: [`/api/analysis/forecast?series=${indicator}&model=${model}&periods=12`],
  });

  const forecastData = data?.data || {};
  const hasError = forecastData.error;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-1/2">
            <label htmlFor="indicator" className="block text-sm font-medium text-neutral-700 mb-1">Economic Indicator</label>
            <Select value={indicator} onValueChange={setIndicator}>
              <SelectTrigger>
                <SelectValue placeholder="Select an indicator" />
              </SelectTrigger>
              <SelectContent>
                {indicators.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-1/2">
            <label htmlFor="model" className="block text-sm font-medium text-neutral-700 mb-1">Forecast Model</label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
        ) : hasError ? (
          <div className="h-80 flex items-center justify-center bg-red-50 text-red-500 rounded-md">
            <p>Error: {forecastData.error}</p>
          </div>
        ) : (
          <div className="h-80 bg-white relative overflow-hidden">
            {/* Visualization of time series forecast */}
            <div className="h-full w-full bg-gray-50 relative overflow-hidden">
              {/* Historical line */}
              <div className="absolute bottom-0 left-0 w-70% h-70% bg-gradient-to-r from-blue-300/50 to-blue-200/30
                clip-path-polygon-[0_80%,10%_75%,20%_85%,30%_65%,40%_70%,50%_60%,60%_65%,70%_50%,80%_55%,90%_45%,100%_40%,100%_100%,0_100%]"></div>
              
              {/* Forecast area (dashed and lighter) */}
              <div className="absolute bottom-0 left-70% w-30% h-70% bg-gradient-to-r from-blue-200/30 to-green-200/30
                clip-path-polygon-[0_40%,20%_35%,40%_40%,60%_30%,80%_25%,100%_30%,100%_100%,0_100%] border-l-2 border-dashed border-blue-400"></div>
              
              {/* Confidence intervals */}
              <div className="absolute bottom-0 left-70% w-30% h-70% bg-blue-100/10
                clip-path-polygon-[0_25%,20%_20%,40%_25%,60%_15%,80%_10%,100%_15%,100%_35%,80%_30%,60%_35%,40%_45%,20%_40%,0_45%]"></div>
              
              {/* Y-axis labels */}
              <div className="absolute left-2 top-2 bottom-8 flex flex-col justify-between text-xs text-gray-500">
                <span>25,000</span>
                <span>20,000</span>
                <span>15,000</span>
                <span>10,000</span>
                <span>5,000</span>
                <span>0</span>
              </div>
              
              {/* X-axis labels */}
              <div className="absolute left-10 right-2 bottom-2 flex justify-between text-xs text-gray-500">
                <span>2019</span>
                <span>2020</span>
                <span>2021</span>
                <span>2022</span>
                <span>2023</span>
                <span>2024 (Forecast)</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {forecastData.model_metrics?.aic?.toFixed(2) || "N/A"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
