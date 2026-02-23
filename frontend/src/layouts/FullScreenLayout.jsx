import { Outlet } from "react-router-dom";

/**
 * FullScreenLayout - Layout without sidebar for full-screen pages
 * Used for unified employee dashboard
 */
export default function FullScreenLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
}
