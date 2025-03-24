import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    
    // Toggle the sidebar visibility on mobile
    const sidebar = document.querySelector('.md\\:flex-shrink-0');
    if (sidebar) {
      sidebar.classList.toggle('hidden');
      sidebar.classList.toggle('flex');
    }
  };
  
  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <button 
            className="text-neutral-600 md:hidden" 
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="ml-4 md:ml-0 text-lg font-heading font-semibold">Financial Market Dashboard</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>New data available</DropdownMenuItem>
                <DropdownMenuItem>ETL job completed</DropdownMenuItem>
                <DropdownMenuItem>System update available</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="ml-3 relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center">
                  <span className="mr-1">Admin User</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
