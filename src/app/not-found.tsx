import Link from "next/link";
import { ShieldAlert, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
          <ShieldAlert className="h-10 w-10 text-indigo-600" />
        </div>
        <h1 className="font-sans text-4xl font-bold text-[#1E1B4B]">404</h1>
        <p className="mt-2 font-sans text-lg text-slate-600">
          This page could not be found in the constitutional infrastructure.
        </p>
        <p className="mt-1 max-w-md font-sans text-sm text-slate-400">
          The page you are looking for may have been moved, removed, or never existed.
          Return to the workspace to continue.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-6 py-3 font-sans text-sm font-semibold text-white shadow-lg shadow-indigo-200/50 transition-all hover:bg-[#3730A3] hover:shadow-indigo-300/50"
        >
          <Home className="h-4 w-4" />
          Return Home
        </Link>
      </div>
    </div>
  );
}
