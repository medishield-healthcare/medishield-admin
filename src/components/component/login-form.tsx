"use client";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { useEffect } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function LoginForm() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    try {
      const res = await authenticateUser(values);
      console.log(res);
    } catch (error) {
      toast.error("Invalid Credentials");
    }

    form.reset();
  }

  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user]);

  return (
    <Card className="login-card">
      <CardHeader className="login-card-header">
        <span className="eyebrow text-primary">Welcome to your workspace</span>
        <CardTitle>Good to see you again.</CardTitle>
        <CardDescription>
          Sign in to keep your business moving forward.
        </CardDescription>
      </CardHeader>
      <CardContent className="login-card-content">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input autoComplete="username" inputMode="email" placeholder="you@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" placeholder="Enter your password" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="login-submit">Sign in to workspace <ArrowRight size={17} aria-hidden="true" /></Button>
          </form>
        </Form>
        <p className="login-note"><LockKeyhole size={13} aria-hidden="true" /> For authorized MediShield team members.</p>
      </CardContent>
    </Card>
  );
}
async function authenticateUser(values: { email: string; password: string }) {
  try {
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    return res;
  } catch (error) {
    toast.error("Invalid Credentials");
  }
}
