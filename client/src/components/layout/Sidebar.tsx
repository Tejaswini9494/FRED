import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: "chart-line"
  },
  {
    name: "Data Pipeline",
    path: "/pipeline",
    icon: "database"
  },
  {
    name: "Analysis",
    path: "/analysis",
    icon: "magnifying-glass-chart"
  },
  {
    name: "Configuration",
    path: "/configuration",
    icon: "gear"
  },
  {
    name: "Job History",
    path: "/history",
    icon: "clock-rotate-left"
  },
  {
    name: "Logs",
    path: "/logs",
    icon: "file-lines"
  }
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-primary text-white">
        <div className="flex items-center justify-center h-16 border-b border-gray-100 border-opacity-20">
          <h1 className="text-xl font-heading font-semibold">FinData Pipeline</h1>
        </div>
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
              >
                <div className={cn(
                  "flex items-center px-4 py-3 rounded-md group transition-all duration-200",
                  location === item.path 
                    ? "bg-white bg-opacity-25 shadow-sm text-white font-medium" 
                    : "text-white hover:bg-white hover:bg-opacity-10"
                )}>
                  <i className={`fas fa-${item.icon} mr-3 w-5 text-center`}></i>
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}
          </nav>
          <div className="mt-auto p-4 border-t border-gray-100 border-opacity-20">
            <div className="flex items-center">
              <div className="ml-3">
                <div className="text-sm font-medium text-white">System Status</div>
                <div className="text-xs text-green-300">
                  <span className="flex items-center">
                    <span className="h-2 w-2 bg-green-300 rounded-full mr-1"></span>
                    All Systems Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
