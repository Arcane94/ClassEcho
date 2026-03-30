import { useState, useEffect } from "react";
import offlineIconSvg from "../../assets/images/offline_icon.svg"; // replace with your icon path

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-0 left-0 m-4 flex items-center gap-2 bg-[var(--grey-accent)] text-black-100 px-3 py-1 rounded-lg shadow-lg z-50">
      <img src={offlineIconSvg} alt="Offline" className="w-5 h-5" />
      <span>Offline</span>
    </div>
  );
}
