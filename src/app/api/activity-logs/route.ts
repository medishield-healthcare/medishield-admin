import { authOptions } from "@/auth";
import axios from "axios";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const headers = { "Cache-Control": "no-store" };
  if (!session?.user?.access_token) {
    return Response.json({ message: "Please sign in to view activity logs." }, { status: 401, headers });
  }

  const query = new URL(request.url).searchParams;
  const params = new URLSearchParams();
  for (const key of ["page", "limit", "search", "resource", "action", "outcome", "actorRole", "from", "to"]) {
    const value = query.get(key);
    if (value) params.set(key, value);
  }
  try {
    const response = await axios.get(`${process.env.API_URL ?? "http://localhost:5000"}/api/activity-logs`, {
      params,
      headers: { Authorization: `Bearer ${session.user.access_token}` },
      timeout: 15000,
    });
    return Response.json(response.data, { headers });
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const message = status === 403 ? "Only administrators can view activity logs."
      : status === 401 ? "Your session has expired. Please sign in again."
      : status === 404 ? "Activity logging is not enabled on the backend yet."
      : status === 400 ? "Check the selected filters and date range."
      : "Unable to load activity logs. Please try again.";
    return Response.json({ message }, { status: status && [400, 401, 403, 404].includes(status) ? status : 502, headers });
  }
}
