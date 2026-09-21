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

export type PopularProducts = {
  _id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  medishield_coins: number;
};

const amountFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

export const popularcolumns: ColumnDef<PopularProducts>[] = [
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
    accessorKey: "name",
    header: () => <div className="">Name</div>,
    cell: ({ row }) => <div className="max-w-[24rem] truncate font-medium" title={row.getValue<string>("name")}>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "sku",
    header: () => <div>SKU</div>,
    cell: ({ row }) => {
      return (
        <div className="max-w-[12rem] truncate text-muted-foreground" title={row.getValue<string>("sku")}>{row.getValue("sku")}</div>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="ml-auto flex h-8 px-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="whitespace-nowrap text-right font-medium tabular-nums">{"\u20B9"} {amountFormatter.format(row.getValue<number>("price"))}</div>;
    },
  },
  {
    accessorKey: "stock",
    header: () => <div className="text-right">Stock</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium tabular-nums">
          <p>{row.getValue("stock")}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "medishield_coins",
    header: () => <div className="text-right">MediShield Coins</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium tabular-nums">
          {row.getValue("medishield_coins")}
        </div>
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
              onClick={() => navigator.clipboard.writeText(row.original.sku)}
            >
              Copy SKU
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/products/${row.original.sku}`)
              }
            >
              View Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
