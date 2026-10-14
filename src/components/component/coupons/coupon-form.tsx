"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { Coupon } from "./coupon-data";

type Props = {
  coupon?: Coupon;
  onSaved?: () => void;
};

const formSchema = z
  .object({
    couponCode: z.string().trim().min(1, "Coupon code is required"),
    type: z.enum(["flat", "percentage"]),
    discount: z.coerce.number().finite().positive("Discount must be greater than 0"),
    minimumCartValue: z.coerce.number().finite().min(0, "Minimum cart value cannot be negative"),
    minimumMedishieldCoins: z.coerce.number().finite().int().min(0, "Minimum coins cannot be negative"),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date is required"),
    status: z.enum(["active", "expired"]),
  })
  .refine((value) => value.type !== "percentage" || value.discount <= 100, {
    message: "Percentage discount cannot exceed 100",
    path: ["discount"],
  });

type FormValues = z.infer<typeof formSchema>;

const valuesForCoupon = (coupon?: Coupon): FormValues => ({
  couponCode: coupon?.couponCode ?? "",
  type: coupon?.type === "percentage" ? "percentage" : "flat",
  discount: coupon?.discount ?? 0,
  minimumCartValue: coupon?.minimumCartValue ?? 0,
  minimumMedishieldCoins: coupon?.minimumMedishieldCoins ?? 1,
  expiryDate: coupon?.expiryDate
    ? new Date(coupon.expiryDate).toISOString().slice(0, 10)
    : "",
  status: coupon?.status === "expired" ? "expired" : "active",
});

const CouponForm = ({ coupon, onSaved }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const savingRef = useRef(false);
  const isEditing = Boolean(coupon);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: valuesForCoupon(coupon),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (savingRef.current) return;
    if (nextOpen) form.reset(valuesForCoupon(coupon));
    setSubmitError("");
    setOpen(nextOpen);
  };

  const saveCoupon = async (data: FormValues) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setLoading(true);
    setSubmitError("");

    try {
      const response = await fetch(
        coupon ? `/api/coupons/${encodeURIComponent(coupon.id)}` : "/api/coupons",
        {
          method: coupon ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            couponCode: data.couponCode.toUpperCase(),
            type: data.type,
            discount: data.discount,
            minimumCartValue: data.minimumCartValue,
            minimumMedishieldCoins: data.minimumMedishieldCoins,
            expiryDate: data.expiryDate,
            status: data.status,
          }),
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          typeof body?.message === "string"
            ? body.message
            : typeof body?.error === "string"
              ? body.error
              : `Could not ${isEditing ? "update" : "create"} coupon. Please try again.`;
        throw new Error(message);
      }

      toast.success(isEditing ? "Coupon updated successfully" : "Coupon created successfully");
      setOpen(false);
      if (onSaved) onSaved();
      else window.location.reload();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save coupon. Please try again.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      savingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={`Edit coupon ${coupon?.couponCode}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" className="px-4">Create Coupon</Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Coupon" : "Add New Coupon"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(saveCoupon)} className="space-y-4">
            <FormField
              control={form.control}
              name="couponCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coupon Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Coupon Code"
                      {...field}
                      onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-x-2">
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <select {...field} className="border border-input bg-card rounded-md px-3 py-2">
                      <option value="flat">Flat</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="any" placeholder="Discount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minimumCartValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Cart Value</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="any" placeholder="Minimum Cart Value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minimumMedishieldCoins"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Medishield Coins</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="1" placeholder="Minimum Medishield Coins" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex space-x-4 items-center">
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input className="w-50" type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-x-2">
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select {...field} className="border border-input bg-card rounded-md px-3 py-2">
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
            <DialogFooter className="mt-8">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
              </DialogClose>
              <Button disabled={loading} type="submit">
                {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CouponForm;
