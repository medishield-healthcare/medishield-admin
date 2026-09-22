"use client";
import { useState } from "react";
import Link from "next/link";
import NavItem from "./nav-item";
import { ShieldPlus, RefreshCw, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";

const Sidebar = () => {
  const Back_API_URL = "https://medishield-backend-ywgp.onrender.com";
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
 

  const { data: session } = useSession();

  const handleSyncZoho = async () => {
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch(
        `${Back_API_URL}/api/product/sync/zoho`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Zoho sync failed");
      }

      setStatus(
        `Synced successfully: added ${data.summary.addedCount}, updated ${data.summary.updatedCount}`
      );
    } catch (error: any) {
      setStatus(error.message || "Sync error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <Link className="brand" href="#">
          <span className="brand-mark"><ShieldPlus size={23} aria-hidden="true" /></span>
          <span>
            <span className="brand-name">MediShield</span>
            <span className="sidebar-brand-caption block">Admin workspace</span>
          </span>
        </Link>
      </div>
      <div className="sidebar-label">WORKSPACE</div>
      <NavItem />
      <div className="sidebar-sync">
        <div className="sidebar-sync-card">
        <h2>Zoho inventory</h2>
        <p>Keep your product catalogue up to date.</p>
        <button
          onClick={handleSyncZoho}
          disabled={loading}
          className="sidebar-sync-button"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          {loading ? "Syncing Zoho..." : "Import Zoho Products"}
        </button>

        {status && (
          <p role="status" className="sidebar-sync-status mt-3 text-sm break-words">
            {status}
          </p>
        )}
        </div>
      </div>
      <div className="sidebar-account">
        <span className="sidebar-account-avatar"><UserRound size={18} aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="sidebar-account-name" title={session?.user?.name || undefined}>
            {session?.user?.name || "MediShield admin"}
          </p>
          {session?.user?.email && (
            <p className="sidebar-account-email" title={session.user.email}>{session.user.email}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
