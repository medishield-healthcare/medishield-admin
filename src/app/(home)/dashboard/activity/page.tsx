import { ActivityLog } from "@/components/component/activity-log";
import { authOptions } from "@/auth";
import axios from "axios";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ActivityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.access_token) redirect("/");

  return <ActivityLog />;
}
