import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ApiEndpoints() {
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("/api/market/indicators/gdp");
  const [params, setParams] = useState([
    { name: "start_date", value: "2022-01-01" },
    { name: "end_date", value: "2023-01-01" },
    { name: "frequency", value: "quarterly" }
  ]);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const updateParam = (index: number, field: "name" | "value", value: string) => {
    const newParams = [...params];
    newParams[index][field] = value;
    setParams(newParams);
  };
  
  const handleSendRequest = async () => {
    setIsLoading(true);
    try {
      // Build URL with query parameters for GET requests
      let url = endpoint;
      if (method === "GET" && params.length > 0) {
        const queryString = params
          .filter(p => p.name && p.value)
          .map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`)
          .join("&");
        
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      // Make the request
      const response = await fetch(url, {
        method,
        headers: method !== "GET" ? { "Content-Type": "application/json" } : undefined,
        body: method !== "GET" ? JSON.stringify(
          params.reduce((obj, param) => ({ ...obj, [param.name]: param.value }), {})
        ) : undefined
      });
      
      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-200">
        <h3 className="font-medium">API Endpoints</h3>
      </div>
      <CardContent className="p-4">
        <div className="mb-4">
          <p className="text-sm text-neutral-600 mb-2">Test our API endpoints directly from the dashboard.</p>
          <div className="flex items-center">
            <div className="w-1/3 pr-2">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="HTTP Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-2/3">
              <Input 
                type="text" 
                value={endpoint} 
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/market/indicators/gdp" 
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Parameters</h4>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-neutral-50">
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {params.map((param, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input 
                          type="text" 
                          value={param.name} 
                          onChange={(e) => updateParam(index, "name", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        {param.name === "frequency" ? (
                          <Select 
                            value={param.value} 
                            onValueChange={(value) => updateParam(index, "value", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="quarterly">quarterly</SelectItem>
                              <SelectItem value="monthly">monthly</SelectItem>
                              <SelectItem value="annual">annual</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input 
                            type="text" 
                            value={param.value} 
                            onChange={(e) => updateParam(index, "value", e.target.value)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={handleSendRequest} disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Response</h4>
            <div className="border rounded-md bg-neutral-800 p-4 h-64 overflow-auto">
              <pre className="text-green-400 text-xs">{response}</pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
