import Link from "next/link";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Heart, User, Settings, LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";

export default function DashboardNavbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">PetMeds</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-6 ml-8">
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/pets"
              className="text-sm font-medium hover:text-primary"
            >
              Pets
            </Link>
            <Link
              href="/dashboard/medications"
              className="text-sm font-medium hover:text-primary"
            >
              Medications
            </Link>
            <Link
              href="/dashboard/history"
              className="text-sm font-medium hover:text-primary"
            >
              History
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-sm font-medium hover:text-primary"
            >
              Settings
            </Link>
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOutAction}>
                  <button type="submit" className="flex w-full items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
