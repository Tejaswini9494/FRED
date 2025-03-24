import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

export default function DataCorrelationMatrix() {
  // Default indicators for correlation matrix
  const defaultIndicators = "GDP,CPIAUCSL,UNRATE,FEDFUNDS,SP500,DGS10";
  
  const { data, isLoading } = useQuery({
    queryKey: [`/api/analysis/correlation?series=${defaultIndicators}`],
  });

  const correlationData = data?.data || {};
  const indicators = Object.keys(correlationData);

  const handleExport = () => {
    if (!correlationData || indicators.length === 0) return;
    
    // Create CSV content
    let csvContent = "Indicator," + indicators.join(",") + "\n";
    
    indicators.forEach(indicator => {
      let row = indicator;
      indicators.forEach(col => {
        row += "," + (correlationData[indicator][col] || "");
      });
      csvContent += row + "\n";
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "correlation_matrix.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="font-medium">Key Economic Indicators Correlation</h3>
        <Button variant="ghost" onClick={handleExport}>
          <Download className="mr-1 h-4 w-4" /> Export
        </Button>
      </div>
      <CardContent className="p-0">
        <div className="p-4 overflow-x-auto">
          {isLoading ? (
            <div className="h-64 w-full bg-gray-100 animate-pulse rounded-md"></div>
          ) : indicators.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No correlation data available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-neutral-50">Indicator</TableHead>
                  {indicators.map(indicator => (
                    <TableHead key={indicator} className="bg-neutral-50">
                      {indicator}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {indicators.map(rowIndicator => (
                  <TableRow key={rowIndicator}>
                    <TableCell className="font-medium">{rowIndicator}</TableCell>
                    {indicators.map(colIndicator => {
                      const value = correlationData[rowIndicator][colIndicator];
                      const isHighlight = rowIndicator === colIndicator;
                      
                      return (
                        <TableCell 
                          key={colIndicator} 
                          className={isHighlight ? "bg-green-50" : ""}
                        >
                          {value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
