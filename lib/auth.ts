import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { z } from "node_modules/zod/lib";
import { redirect } from "next/navigation";

export async function handleLogout() {
  "use server";
  cookies().delete("admin_auth");
  cookies().delete("admin_auth_time");
  redirect("/");
}

// Check if authenticated
export async function checkAuth() {
  const cookieStore = cookies();
  const authCookie = cookieStore.get("admin_auth");

  if (!authCookie?.value || authCookie.value !== "true") {
    return false;
  }

  const cookieAge = cookieStore.get("admin_auth_time")?.value;
  if (!cookieAge || Date.now() - parseInt(cookieAge) > 3600000) {
    // 1 hour
    return false;
  }

  return true;
}

// Server Action for password verification
export async function verifyPassword(formData: FormData) {
  "use server";

  const password = formData.get("password");
  const parsed = passwordSchema.safeParse({ password });

  const ctx = await getCloudflareContext();
  const adminPassword = ctx.env.ADMIN_PASSWORD;
  if (!parsed.success || password !== adminPassword) {
    return { error: "Invalid password" };
  }

  cookies().set("admin_auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600, // 1 hour
  });

  cookies().set("admin_auth_time", Date.now().toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600,
  });

  // Redirect to the same page to show the dashboard
  redirect("/admin");
}

export const passwordSchema = z.object({
  password: z.string().min(1),
});
