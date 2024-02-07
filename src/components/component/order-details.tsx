/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/ISFJFfXIotO
 */
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@/components/ui/card";
import Link from "next/link";
import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export function OrderDetails() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
          <CardDescription>
            Order #3102 placed by
            <Link className="text-blue-600 underline" href="#">
              Sophia Anderson
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="grid grid-cols-2 gap-1 text-sm">
            <div className="font-medium">Order number</div>
            <div>#3102</div>
            <div className="font-medium">Date</div>
            <div>June 23, 2022</div>
            <div className="font-medium">Status</div>
            <div>Processing</div>
            <div className="font-medium">Total</div>
            <div>$150.00</div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <div className="font-medium">Customer</div>
            <div>Sophia Anderson</div>
            <div className="font-medium">Email</div>
            <div>sophia@example.com</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="max-w-[150px]">Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Glimmer Lamps</TableCell>
                <TableCell>2</TableCell>
                <TableCell>$60.00</TableCell>
                <TableCell>$120.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Aqua Filters</TableCell>
                <TableCell>3</TableCell>
                <TableCell>$16.33</TableCell>
                <TableCell>$49.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Shipping information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <div className="font-medium">Method</div>
            <div>Standard shipping</div>
            <div className="font-medium">Tracking number</div>
            <div>1Z9999999999999999</div>
            <div className="font-medium">Expected delivery</div>
            <div>June 30, 2022</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Customer details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1 text-sm">
            <Link className="text-blue-600 underline" href="#">
              Sophia Anderson
            </Link>
            <div>sophia@example.com</div>
            <div>+1 888 8888 8888</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Shipping address</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            Sophia Anderson
            <br />
            1234 Main St.
            <br />
            Anytown, CA 12345
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-x-2">
          <Button>Mark as shipped</Button>
          <Button variant="outline">Cancel order</Button>
        </CardContent>
      </Card>
    </>
  );
}
