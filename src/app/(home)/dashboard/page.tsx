"use client";
import Dashboard from "@/components/component/dashboard";
import { DashboardCard } from "@/components/component/dashboard-card";
import {
  PopularProducts,
  popularcolumns,
} from "@/components/component/mostbought";
import { Orders, columns } from "@/components/component/orderdata";
import PopularProductTable from "@/components/component/popular-product-table";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useState } from "react";
import { Download } from "lucide-react";

const DashBoard = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [popularProducts, setPopularProducts] = useState([] as any);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState("orders");

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  const fetchPopularProducts = async () => {
    setLoading(true);
    const res = await fetch("/api/product/popular");
    const data = await res.json();
    setPopularProducts(data);
    setLoading(false);
  };

  const getCSV = async () => {
    setLoading(true);
    const res = await fetch("/api/orders/getCSV");
    if (res.status === 200) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pendingOrders.csv";
      a.click();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!session?.user) {
      router.replace("/");
    }
  }, [session, session?.user, router]);

  useEffect(() => {
    fetchOrders();
    fetchPopularProducts();
  }, [view]);

  // add pooling for orders and popular products
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
      fetchPopularProducts();
    }, 20000);
    return () => clearInterval(interval);
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
    .reverse()
    .slice(0, 10);

  const popularProductsData: PopularProducts[] = popularProducts.map(
    (product: any) => {
      return {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price.minimalPrice,
        stock: product.max_sale_qty,
        medishield_coins: product.medishield_coins ?? 0,
      };
    }
  );

  return (
    <div className="page-content dashboard-page">
      <header className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow text-primary mb-2">Workspace overview</p>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">A clear view of your orders, revenue, and popular products.</p>
        </div>
        <Button variant="outline" onClick={() => getCSV()}>
          <Download size={16} aria-hidden="true" /> Export pending orders
        </Button>
      </header>
      <div className="metric-grid">
        <DashboardCard
          title="Shipped Orders"
          heading="Shipped and delivered orders"
          value={orders
            .filter(
              (order: any) =>
                order.orderStatus === "Shipped" ||
                order.orderStatus === "Delivered"
            )
            .length.toString()}
        />
        <DashboardCard
          title="Pending Orders"
          heading="Orders awaiting fulfilment"
          value={orders
            .filter((order: any) => order.orderStatus === "Processing")
            .length.toString()}
        />
        <DashboardCard
          title="Revenue"
          heading="Total order revenue"
          value={`₹ ${orders
            .reduce(
              (acc: number, order: any) => acc + order.paymentIntent.amount,
              0
            )
            .toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      </div>
      <section className="surface dashboard-panel" aria-labelledby="dashboard-table-title">
        <div className="dashboard-panel-header">
          <div>
            <h2 id="dashboard-table-title" className="section-title">
              {view === "orders" ? "Recent orders" : "Popular products"}
            </h2>
            <p className="page-description">
              {view === "orders"
                ? "Your latest orders and their fulfilment status."
                : "A closer look at your most popular products."}
            </p>
          </div>
          <div className="view-switcher" role="group" aria-label="Dashboard view">
            <Button size="sm" aria-pressed={view === "orders"} onClick={() => setView("orders")}>
              Recent orders
            </Button>
            <Button size="sm" aria-pressed={view === "products"} onClick={() => setView("products")}>
              Popular products
            </Button>
          </div>
        </div>
        {view === "orders" ? (
          <Dashboard embedded loading={loading} data={data} columns={columns} />
        ) : (
          <PopularProductTable
            embedded
            loading={loading}
            data={popularProductsData}
            columns={popularcolumns}
          />
        )}
      </section>
    </div>
  );
};

export default DashBoard;
