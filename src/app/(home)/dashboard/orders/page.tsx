"use client";

import React, { useEffect, useState } from "react";
import Dashboard from "@/components/component/dashboard";
import { Orders, columns } from "@/components/component/orderdata";

export default function Page() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const data: Orders[] = orders
    .map((order: any) => {
      return {
        _id: order._id,
        email: order.orderby?.email,
        transactionId: order.paymentIntent.id,
        total: order.paymentIntent.amount,
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
      };
    })
    .reverse();

  return (
    <div className="page-content">
      <div className="page-heading"><div><h1 className="page-title">Orders</h1><p className="page-description">Track, filter, and manage every customer order.</p></div></div>
      <Dashboard loading={loading} data={data} columns={columns} />
    </div>
  );
}
