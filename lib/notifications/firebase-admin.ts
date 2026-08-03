import admin from "firebase-admin";

// Tolerant of how each hosting platform's env var UI mangles a pasted PEM key:
// strips wrapping quotes some UIs preserve literally, trims stray whitespace,
// and converts literal "\n" sequences to real newlines (a no-op if the value
// already has real newlines).
function normalizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  let normalized = key.trim();
  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    normalized = normalized.slice(1, -1);
  }
  return normalized.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
}

export const messaging = admin.messaging();

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    await messaging.send({
      token,
      notification: { title, body },
      data,
      webpush: {
        notification: {
          title,
          body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
          requireInteraction: true,
        },
        fcmOptions: { link: process.env.NEXTAUTH_URL },
      },
    });
    return true;
  } catch (error) {
    console.error("Push notification failed:", error);
    return false;
  }
}

export async function sendMulticastPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!tokens.length) return;

  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 500) {
    chunks.push(tokens.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    await messaging.sendEachForMulticast({
      tokens: chunk,
      notification: { title, body },
      data,
    });
  }
}
