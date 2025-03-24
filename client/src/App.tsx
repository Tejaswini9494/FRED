import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import DataPipeline from "@/pages/DataPipeline";
import Analysis from "@/pages/Analysis";
import Configuration from "@/pages/Configuration";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-neutral-100">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/pipeline" component={DataPipeline} />
            <Route path="/analysis" component={Analysis} />
            <Route path="/configuration" component={Configuration} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
