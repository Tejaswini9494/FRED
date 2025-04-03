import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { AlertCircle, Save, TestTube } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

export default function Configuration() {
  const [activeTab, setActiveTab] = useState("api");
  const [apiKey, setApiKey] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  
  // Database settings
  const [dbType, setDbType] = useState("memory");
  const [dbHost, setDbHost] = useState("");
  const [dbPort, setDbPort] = useState("3306");
  const [dbUser, setDbUser] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [dbName, setDbName] = useState("financial_data");
  
  // Cache settings
  const [useCache, setUseCache] = useState(true);
  const [cacheTimeout, setCacheTimeout] = useState("3600");
  const [redisHost, setRedisHost] = useState("");
  const [redisPort, setRedisPort] = useState("6379");
  
  // ETL settings
  const [scheduledUpdates, setScheduledUpdates] = useState(true);
  const [updateInterval, setUpdateInterval] = useState("daily");
  const [updateTime, setUpdateTime] = useState("00:00");
  const [parallelJobs, setParallelJobs] = useState("2");
  
  const handleTestConnection = () => {
    if (!apiKey) {
      setTestStatus("error");
      return;
    }
    
    setTestStatus("testing");
    
    // Simulate API connection test
    setTimeout(() => {
      setTestStatus("success");
    }, 1500);
  };
  
  const handleSaveConfig = () => {
    // Would save configuration in a real implementation
    alert("Configuration saved successfully");
  };
  
  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="api" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 w-full md:w-2/3">
          <TabsTrigger value="api">API Settings</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="cache">Caching</TabsTrigger>
          <TabsTrigger value="etl">ETL Schedule</TabsTrigger>
        </TabsList>
        
        <Card>
          <CardContent className="p-6">
            <TabsContent value="api" className="mt-0 space-y-6">
              <div>
                <CardTitle className="text-xl mb-4">FRED API Configuration</CardTitle>
                <CardDescription className="mb-4">
                  Configure your Federal Reserve Economic Data (FRED) API connection settings.
                </CardDescription>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="api-key">FRED API Key</Label>
                  <Input 
                    id="api-key" 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your FRED API key"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    You can get your API key from <a href="https://fred.stlouisfed.org/docs/api/api_key.html" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">FRED API Key</a>
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="enable-throttling" defaultChecked />
                  <Label htmlFor="enable-throttling">Enable API rate limiting</Label>
                </div>
                
                <div>
                  <Label htmlFor="max-requests">Maximum requests per minute</Label>
                  <Input 
                    id="max-requests" 
                    type="number" 
                    defaultValue="120"
                    min="1"
                    max="1000"
                  />
                </div>
                
                {testStatus === "error" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to connect to FRED API. Please check your API key.
                    </AlertDescription>
                  </Alert>
                )}
                
                {testStatus === "success" && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                      Successfully connected to FRED API.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={handleTestConnection}
                    disabled={testStatus === "testing"}
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    {testStatus === "testing" ? "Testing..." : "Test Connection"}
                  </Button>
                  
                  <Button onClick={handleSaveConfig}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="database" className="mt-0 space-y-6">
              <div>
                <CardTitle className="text-xl mb-4">Database Configuration</CardTitle>
                <CardDescription className="mb-4">
                  Configure database connection for storing financial data.
                </CardDescription>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="db-type">Database Type</Label>
                  <Select value={dbType} onValueChange={setDbType}>
                    <SelectTrigger id="db-type">
                      <SelectValue placeholder="Select database type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="memory">In-Memory (Development)</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="postgres">PostgreSQL</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {dbType !== "memory" && dbType !== "sqlite" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="db-host">Host</Label>
                        <Input 
                          id="db-host" 
                          value={dbHost}
                          onChange={(e) => setDbHost(e.target.value)}
                          placeholder="localhost"
                        />
                      </div>
                      <div>
                        <Label htmlFor="db-port">Port</Label>
                        <Input 
                          id="db-port" 
                          value={dbPort}
                          onChange={(e) => setDbPort(e.target.value)}
                          placeholder="3306"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="db-user">Username</Label>
                        <Input 
                          id="db-user" 
                          value={dbUser}
                          onChange={(e) => setDbUser(e.target.value)}
                          placeholder="root"
                        />
                      </div>
                      <div>
                        <Label htmlFor="db-password">Password</Label>
                        <Input 
                          id="db-password" 
                          type="password"
                          value={dbPassword}
                          onChange={(e) => setDbPassword(e.target.value)}
                          placeholder="Password"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div>
                  <Label htmlFor="db-name">Database Name</Label>
                  <Input 
                    id="db-name" 
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    placeholder="financial_data"
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center space-x-2">
                  <Switch id="ssl-connection" defaultChecked />
                  <Label htmlFor="ssl-connection">Use SSL for database connection</Label>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveConfig}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="cache" className="mt-0 space-y-6">
              <div>
                <CardTitle className="text-xl mb-4">Cache Configuration</CardTitle>
                <CardDescription className="mb-4">
                  Configure caching settings to improve application performance.
                </CardDescription>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="enable-cache" 
                    checked={useCache}
                    onCheckedChange={setUseCache}
                  />
                  <Label htmlFor="enable-cache">Enable data caching</Label>
                </div>
                
                {useCache && (
                  <>
                    <div>
                      <Label htmlFor="cache-type">Cache Type</Label>
                      <Select defaultValue="memory">
                        <SelectTrigger id="cache-type">
                          <SelectValue placeholder="Select cache type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="memory">In-Memory</SelectItem>
                          <SelectItem value="redis">Redis</SelectItem>
                          <SelectItem value="file">File System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="cache-timeout">Cache Timeout (seconds)</Label>
                      <Input 
                        id="cache-timeout" 
                        type="number"
                        value={cacheTimeout}
                        onChange={(e) => setCacheTimeout(e.target.value)}
                        min="1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="redis-host">Redis Host</Label>
                        <Input 
                          id="redis-host" 
                          value={redisHost}
                          onChange={(e) => setRedisHost(e.target.value)}
                          placeholder="localhost"
                        />
                      </div>
                      <div>
                        <Label htmlFor="redis-port">Redis Port</Label>
                        <Input 
                          id="redis-port" 
                          value={redisPort}
                          onChange={(e) => setRedisPort(e.target.value)}
                          placeholder="6379"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveConfig}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="etl" className="mt-0 space-y-6">
              <div>
                <CardTitle className="text-xl mb-4">ETL Process Configuration</CardTitle>
                <CardDescription className="mb-4">
                  Configure the ETL (Extract, Transform, Load) processes and schedules.
                </CardDescription>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="scheduled-updates" 
                    checked={scheduledUpdates}
                    onCheckedChange={setScheduledUpdates}
                  />
                  <Label htmlFor="scheduled-updates">Enable scheduled updates</Label>
                </div>
                
                {scheduledUpdates && (
                  <>
                    <div>
                      <Label htmlFor="update-interval">Update Interval</Label>
                      <Select value={updateInterval} onValueChange={setUpdateInterval}>
                        <SelectTrigger id="update-interval">
                          <SelectValue placeholder="Select update interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="update-time">Update Time</Label>
                      <Input 
                        id="update-time" 
                        type="time"
                        value={updateTime}
                        onChange={(e) => setUpdateTime(e.target.value)}
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <Label htmlFor="parallel-jobs">Maximum Parallel Jobs</Label>
                  <Input 
                    id="parallel-jobs" 
                    type="number"
                    value={parallelJobs}
                    onChange={(e) => setParallelJobs(e.target.value)}
                    min="1"
                    max="10"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="retry-failed" defaultChecked />
                  <Label htmlFor="retry-failed">Auto-retry failed jobs</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="email-notifications" />
                  <Label htmlFor="email-notifications">Email notifications for failed jobs</Label>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveConfig}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>
            Configure which financial data series to include in the ETL pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <Switch id="gdp" defaultChecked />
                <Label htmlFor="gdp" className="ml-2">GDP (Gross Domestic Product)</Label>
              </div>
              <Select defaultValue="quarterly">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <Switch id="cpi" defaultChecked />
                <Label htmlFor="cpi" className="ml-2">CPI (Consumer Price Index)</Label>
              </div>
              <Select defaultValue="monthly">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <Switch id="unemployment" defaultChecked />
                <Label htmlFor="unemployment" className="ml-2">Unemployment Rate</Label>
              </div>
              <Select defaultValue="monthly">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <Switch id="treasury" defaultChecked />
                <Label htmlFor="treasury" className="ml-2">10-Year Treasury Yield</Label>
              </div>
              <Select defaultValue="daily">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <Switch id="sp500" defaultChecked />
                <Label htmlFor="sp500" className="ml-2">S&P 500 Index</Label>
              </div>
              <Select defaultValue="daily">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveConfig}>
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
