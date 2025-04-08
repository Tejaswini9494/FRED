import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/Dashboard";
import DataPipeline from "./pages/DataPipeline";
import Analysis from "./pages/Analysis";
import Configuration from "./pages/Configuration";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import React from "react";


function AppRouter() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-neutral-100">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipeline" element={<DataPipeline />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/configuration" element={<Configuration />} />
            <Route path="/history" element={<NotFound />} />
            <Route path="/logs" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <AppRouter />
      </BrowserRouter>
      
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
