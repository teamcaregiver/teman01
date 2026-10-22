// One-time setup for Google Drive storage (docs/GOOGLE-DRIVE-STORAGE.md).
//
// Signs in as the app-owned Google account, then:
//   1. prints the OAuth refresh token the drive-files Edge Function uses, and
//   2. creates the app's root Drive folder and prints its id.
// The folder must be created by this OAuth client: with the drive.file scope
// the app can only see files and folders it created itself.
//
// Usage (OAuth client of type "Desktop app"):
//   GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... node scripts/google-drive-setup.mjs
//
// Nothing is written to disk. Put the printed values in Supabase secrets, not in .env.

import http from "node:http";
import crypto from "node:crypto";

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const folderName = process.env.GOOGLE_DRIVE_FOLDER_NAME || "teman01-uploads";
if (!clientId || !clientSecret) {
  console.error(
    "Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET first.",
  );
  process.exit(1);
}

const SCOPE = "https://www.googleapis.com/auth/drive.file";
const state = crypto.randomBytes(16).toString("hex");
const verifier = crypto.randomBytes(32).toString("base64url");
const challenge = crypto
  .createHash("sha256")
  .update(verifier)
  .digest("base64url");

const server = http.createServer();
server.listen(0, "127.0.0.1", () => {
  const redirectUri = `http://127.0.0.1:${server.address().port}`;
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent", // always return a refresh token
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  console.log(
    "\nOpen this link and sign in with the APP-OWNED Google account:\n",
  );
  console.log(auth.toString(), "\n");

  server.on("request", async (req, res) => {
    const url = new URL(req.url, redirectUri);
    if (url.searchParams.get("state") !== state) {
      res.writeHead(400).end("State mismatch.");
      return;
    }
    const code = url.searchParams.get("code");
    if (!code) {
      res
        .writeHead(400)
        .end(`Sign-in failed: ${url.searchParams.get("error")}`);
      return;
    }
    res
      .writeHead(200, { "content-type": "text/plain" })
      .end("Done. You can close this tab.");
    server.close();

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          code_verifier: verifier,
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok || !tokens.refresh_token) {
        throw new Error(`Token exchange failed: ${JSON.stringify(tokens)}`);
      }

      const folderRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?fields=id",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
          }),
        },
      );
      const folder = await folderRes.json();
      if (!folderRes.ok)
        throw new Error(`Folder creation failed: ${JSON.stringify(folder)}`);

      console.log(
        "Set these as Supabase Edge Function secrets (see the docs):\n",
      );
      console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log(`GOOGLE_DRIVE_ROOT_FOLDER_ID=${folder.id}`);
      console.log(
        `DRIVE_URL_SIGNING_SECRET=${crypto.randomBytes(32).toString("base64url")}\n`,
      );
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      process.exitCode = 1;
    }
  });
});
