"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getColumns, type Coupon } from "./coupon-data";
import CouponTable from "./coupon-table";
import { toast } from "sonner";

type ApiCoupon = Omit<Coupon, "id"> & { _id: string };

const CouponTableMain = () => {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<ApiCoupon[]>([]);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/coupons", { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(result?.data)) {
        throw new Error("Unable to load coupons.");
      }
      setCoupons(result.data);
    } catch {
      toast.error("Unable to load coupons. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCoupons();
  }, [fetchCoupons]);

  const data: Coupon[] = coupons.map((coupon) => ({
      id: coupon._id,
      couponCode: coupon.couponCode,
      type: coupon.type,
      discount: coupon.discount,
      minimumCartValue: coupon.minimumCartValue,
      minimumMedishieldCoins: coupon.minimumMedishieldCoins,
      expiryDate: coupon.expiryDate,
      status: coupon.status,
  }));
  const columns = useMemo(() => getColumns(() => void fetchCoupons()), [fetchCoupons]);

  return (
    <div className="mt-8">
      <CouponTable data={data} loading={loading} columns={columns} />
    </div>
  );
};

export default CouponTableMain;
