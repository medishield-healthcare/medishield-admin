"use client";

import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export type Orders = {
  _id: string;
  email?: string;
  transactionId: string;
  total: number;
  createdAt: string;
  orderStatus: string;
};

const amountFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

export const columns: ColumnDef<Orders>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "_id",
    header: () => <div>Order ID</div>,
    cell: ({ row }) => {
      const id = row.getValue<string>("_id");
      return (
        <>
          <div
            className="max-w-[12rem] truncate font-medium text-primary"
            title={id}
          >
            {id.length > 10 ? `${id.slice(0, 10)}...` : id}
          </div>
        </>
      );
    },
  },
  {
    accessorKey: "email",
    header: () => <div className="">Email</div>,
    cell: ({ row }) => (
      <div
        className="max-w-[15rem] truncate lowercase"
        title={row.getValue<string>("email")}
      >
        {row.getValue("email")}
      </div>
    ),
  },
  {
    accessorKey: "transactionId",
    header: () => <div>Transaction ID</div>,
    cell: ({ row }) => {
      return (
        <div
          className="max-w-[12rem] truncate text-muted-foreground"
          title={row.getValue<string>("transactionId")}
        >
          {row.getValue("transactionId")}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-3 h-8 px-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt")).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      );
      return (
        <div className="whitespace-nowrap text-muted-foreground">{date}</div>
      );
    },
  },
  {
    accessorKey: "total",
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
      return (
        <div className="whitespace-nowrap text-right font-medium tabular-nums">
          {"\u20B9"} {amountFormatter.format(row.getValue<number>("total"))}
        </div>
      );
    },
  },
  {
    accessorKey: "orderStatus",
    header: () => <div>Status</div>,
    cell: ({ row }) => {
      return (
        <span
          className="order-status"
          data-status={row.getValue<string>("orderStatus")}
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
          />
          {row.getValue("orderStatus")}
        </span>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    accessorKey: "",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const router = useRouter();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(row.original.transactionId)
              }
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/orders/${row.original._id}`)
              }
            >
              View Order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
