"use client";
import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type Coupon = {
  _id: string;
  couponCode: string;
  type: string;
  discount: number;
  minimumCartValue: number;
  minimumMedishieldCoins: number;
  expiryDate: Date;
  status: string;
};

function handleDelete(arg0: any): void {
  alert("Delete");
}

export const columns: ColumnDef<Coupon>[] = [
  {
    accessorKey: "couponCode",
    header: () => <div className="">Coupon Code</div>,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("couponCode")}</div>
    ),
  },
  {
    accessorKey: "discount",
    header: () => <div className="">Discount</div>,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("discount")}</div>
    ),
  },
  {
    accessorKey: "type",
    header: () => <div className="">Type</div>,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("type")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="">Status</div>,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("status")}</div>
    ),
  },
  {
    accessorKey: "expiryDate",
    header: () => <div className="">Expiry</div>,
    cell: ({ row }) => (
      <div className=" font-medium">
        {new Date(row.getValue("expiryDate")).toLocaleDateString()}
      </div>
    ),
  },
  {
    accessorKey: "minimumCartValue",
    header: () => <div className="">Minimum Cart Value</div>,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("minimumCartValue")}</div>
    ),
  },
  {
    accessorKey: "minimumMedishieldCoins",
    header: () => <div className="">Required MSC</div>,
    cell: ({ row }) => (
      <div className=" font-medium">
        {row.getValue("minimumMedishieldCoins")}
      </div>
    ),
  },
  {
    accessorKey: "actions",
    header: () => <div className="">Actions</div>,
    cell: ({ row }) => (
      <div className="font-medium">
        {/* delete alert */}
        <AlertDialog>
          <AlertDialogTrigger>
            <Button size="icon" variant="destructive">
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <div>
              <h2 className="text-lg font-bold mb-4">Delete Coupon</h2>
              <p className="mb-4">
                Are you sure you want to delete the coupon{" "}
                <strong>{row.getValue("couponCode")}</strong>?
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(row.getValue("_id"))}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ),
  },
];
