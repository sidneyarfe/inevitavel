import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Extend ServiceWorkerRegistration to include pushManager
declare global {
  interface ServiceWorkerRegistration {
    pushManager: PushManager;
  }
  interface PushManager {
    subscribe(options?: PushSubscriptionOptionsInit): Promise<PushSubscription>;
    getSubscription(): Promise<PushSubscription | null>;
  }
}

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("get-vapid-key");
    if (error) throw error;
    return data?.publicKey ?? null;
  } catch {
    console.error("Failed to get VAPID key");
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [supported] = useState(() => "Notification" in window && "PushManager" in window);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (supported) {
      setPermission(Notification.permission);
      // Check if already subscribed
      navigator.serviceWorker?.ready?.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      });
    }
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) return "denied" as NotificationPermission;

    // Request notification permission
    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== "granted") return result;

    try {
      // Get VAPID public key from edge function
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) throw new Error("No VAPID key");

      // Subscribe to push
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
        });
      }

      // Save subscription to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const subJson = sub.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh: subJson.keys?.p256dh ?? "",
          auth: subJson.keys?.auth ?? "",
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) throw error;
      setSubscribed(true);
    } catch (err) {
      console.error("Push subscription failed:", err);
    }

    return result;
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();

        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id)
            .eq("endpoint", endpoint);
        }
      }
      setSubscribed(false);
    } catch (err) {
      console.error("Unsubscribe failed:", err);
    }
  }, []);

  // Keep backward-compatible local notification
  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!supported || permission !== "granted") return;
      try {
        new Notification(title, {
          icon: "/pwa-192.png",
          badge: "/pwa-192.png",
          ...options,
        });
      } catch {
        navigator.serviceWorker?.ready?.then((reg) => {
          reg.showNotification(title, {
            icon: "/pwa-192.png",
            badge: "/pwa-192.png",
            ...options,
          });
        });
      }
    },
    [supported, permission]
  );

  return { supported, permission, subscribed, subscribe, unsubscribe, sendNotification };
}
