import { useState } from 'react';

export function useFileShare() {
  const [isSharing, setIsSharing] = useState(false);

  const shareApk = async () => {
    setIsSharing(true);

    try {
      // 1. Check Browser Support
      if (!navigator.canShare) {
        alert("Your browser does not support the Web Share API.");
        return;
      }

      // 2. Try to Fetch the File
      console.log("🔍 Looking for /evosolve.apk...");
      const response = await fetch('/evosolve.apk');
      
      if (!response.ok) {
        throw new Error(`File Fetch Failed: ${response.status} ${response.statusText}. Is evosolve.apk in the public folder?`);
      }
      
      const blob = await response.blob();
      
      // 3. Prepare File
      const file = new File([blob], 'evosolve.apk', { type: 'application/vnd.android.package-archive' });
      const shareData = {
        files: [file],
        title: 'Install Evosolve',
        text: 'Install this app to learn offline!',
      };

      // 4. Check if Device Allows Sharing this File Type
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        console.log("✅ Share Successful!");
      } else {
        alert("⚠️ Your device does not allow sharing APK files directly.");
      }

    } catch (error) {
      console.error("❌ Share Error:", error);
      
      if (error.name === 'AbortError') {
        // User closed the share menu - do nothing
        console.log("User cancelled share.");
      } else {
        // Show the actual technical error
        alert(`Error: ${error.message}`);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return { shareApk, isSharing };
}