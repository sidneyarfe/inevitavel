import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Web Push crypto utilities
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

async function importVapidKeys(publicKey: string, privateKey: string) {
  const publicKeyBytes = urlBase64ToUint8Array(publicKey);
  const privateKeyBytes = urlBase64ToUint8Array(privateKey);

  const pubKey = await crypto.subtle.importKey(
    "raw",
    publicKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    []
  );

  const privKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );

  return { pubKey, privKey };
}

function base64UrlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function createJWT(
  subject: string,
  audience: string,
  privateKey: CryptoKey
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  const encodedHeader = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const encodedPayload = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  // Convert from DER to raw r||s format
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;

  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32);
  } else {
    // DER format
    const rLength = sigBytes[3];
    const rStart = 4;
    const rBytes = sigBytes.slice(rStart, rStart + rLength);
    const sLength = sigBytes[rStart + rLength + 1];
    const sStart = rStart + rLength + 2;
    const sBytes = sigBytes.slice(sStart, sStart + sLength);

    r = new Uint8Array(32);
    s = new Uint8Array(32);
    r.set(rBytes.length > 32 ? rBytes.slice(rBytes.length - 32) : rBytes, 32 - Math.min(rBytes.length, 32));
    s.set(sBytes.length > 32 ? sBytes.slice(sBytes.length - 32) : sBytes, 32 - Math.min(sBytes.length, 32));
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  return `${signingInput}.${base64UrlEncode(rawSig)}`;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const { privKey } = await importVapidKeys(vapidPublicKey, vapidPrivateKey);
    const jwt = await createJWT(vapidSubject, audience, privKey);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        TTL: "86400",
        Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
        Urgency: "normal",
      },
      body: new TextEncoder().encode(payload),
    });

    if (response.status === 410 || response.status === 404) {
      // Subscription expired, should be removed
      return false;
    }

    return response.ok;
  } catch (error) {
    console.error("Push send error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT")!;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      throw new Error("VAPID keys not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();

    const notifications: { userId: string; title: string; body: string; tag: string }[] = [];

    // Get all users with push subscriptions
    const { data: allUsers } = await supabase
      .from("push_subscriptions")
      .select("user_id")
      .limit(1000);

    const uniqueUserIds = [...new Set((allUsers || []).map((s: { user_id: string }) => s.user_id))];

    for (const userId of uniqueUserIds) {
      // Load user preferences
      const { data: profile } = await supabase
        .from("profiles")
        .select("notify_briefing, notify_habits, briefing_hour, notify_advance_minutes, timezone")
        .eq("user_id", userId)
        .maybeSingle();

      const notifyBriefing = profile?.notify_briefing ?? true;
      const notifyHabits = profile?.notify_habits ?? true;
      const briefingHour = profile?.briefing_hour ?? 21;
      const advanceMinutes = profile?.notify_advance_minutes ?? 15;
      const userTimezone = profile?.timezone ?? "America/Sao_Paulo";

      // Get current time in user's timezone
      const userNow = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
      const userHour = userNow.getHours();
      const userMinute = userNow.getMinutes();
      const userDay = userNow.getDay();
      const userToday = `${userNow.getFullYear()}-${String(userNow.getMonth() + 1).padStart(2, "0")}-${String(userNow.getDate()).padStart(2, "0")}`;
      // --- Briefing reminder (using user's local time) ---
      if (notifyBriefing) {
        if (userHour === briefingHour && userMinute < 15) {
          const { data: briefing } = await supabase
            .from("evening_briefings")
            .select("id")
            .eq("user_id", userId)
            .eq("briefing_date", userToday)
            .maybeSingle();

          if (!briefing) {
            notifications.push({
              userId,
              title: "🌙 Briefing Noturno",
              body: "Hora de armar o campo para amanhã. Prepare seu ambiente!",
              tag: "briefing-reminder",
            });
          }
        }
      }

      // --- Habit reminders (using user's local time) ---
      if (notifyHabits) {
        const { data: habits } = await supabase
          .from("habits")
          .select("id, name, preferred_time, micro_action")
          .eq("user_id", userId)
          .eq("is_active", true)
          .contains("days_of_week", [userDay]);

        if (habits) {
          for (const habit of habits) {
            if (!habit.preferred_time) continue;

            const [habitH, habitM] = habit.preferred_time.split(":").map(Number);
            const habitTotalMin = habitH * 60 + habitM - advanceMinutes;
            const reminderH = ((Math.floor(habitTotalMin / 60) % 24) + 24) % 24;
            const reminderM = ((habitTotalMin % 60) + 60) % 60;

            if (
              reminderH === userHour &&
              Math.abs(reminderM - userMinute) <= 7
            ) {
              const { data: execution } = await supabase
                .from("daily_executions")
                .select("id")
                .eq("user_id", userId)
                .eq("habit_id", habit.id)
                .eq("execution_date", userToday)
                .eq("status", "executed")
                .maybeSingle();

              if (!execution) {
                notifications.push({
                  userId,
                  title: `⚡ ${habit.name}`,
                  body: `Micro-ação: ${habit.micro_action}. Apenas 2 minutos!`,
                  tag: `habit-${habit.id}`,
                });
              }
            }
          }
        }
      }
    }

    // Send all notifications
    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    for (const notif of notifications) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", notif.userId);

      if (!subs) continue;

      for (const sub of subs) {
        const payload = JSON.stringify({
          title: notif.title,
          body: notif.body,
          tag: notif.tag,
          icon: "/pwa-192.png",
          badge: "/pwa-192.png",
        });

        const success = await sendWebPush(
          sub,
          payload,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY,
          VAPID_SUBJECT
        );

        if (success) {
          sent++;
        } else {
          failed++;
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
    }

    return new Response(
      JSON.stringify({
        processed: notifications.length,
        sent,
        failed,
        cleaned: expiredEndpoints.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
