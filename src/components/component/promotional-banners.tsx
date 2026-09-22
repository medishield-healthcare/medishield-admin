"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { FileEditIcon, Loader2, PlusCircleIcon, Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useEdgeStore } from "@/lib/edgestore";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { SingleImageDropzone } from "./single-image-upload";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

const formSchema = z.object({
  title: z.string().trim().min(1, "Enter a banner name."),
  mobile_image: z.string().trim().min(1, "Select a banner image."),
  id: z.string().trim().min(1, "Enter a product ID."),
});

type BannerValues = z.infer<typeof formSchema>;
type Banner = BannerValues & { _id: string };

function BannerFormDialog({
  banner,
  onSaved,
  children,
}: {
  banner?: Banner;
  onSaved: () => Promise<void>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | string>();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const temporaryImageUrl = useRef<string>();
  const { edgestore } = useEdgeStore();
  const form = useForm<BannerValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", mobile_image: "", id: "" },
  });
  const saving = form.formState.isSubmitting;
  const busy = uploading || saving;

  function handleOpenChange(nextOpen: boolean) {
    if (busy) return;

    if (nextOpen) {
      form.reset({
        title: banner?.title ?? "",
        mobile_image: banner?.mobile_image ?? "",
        id: banner?.id ?? "",
      });
      setFile(banner?.mobile_image || undefined);
      temporaryImageUrl.current = undefined;
      setUploadError("");
      setSaveError("");
    }
    setOpen(nextOpen);
  }

  async function handleImageChange(nextFile?: File) {
    if (busy) return;

    setUploadError("");
    if (!nextFile) {
      setFile(undefined);
      temporaryImageUrl.current = undefined;
      form.setValue("mobile_image", "", { shouldDirty: true, shouldValidate: true });
      return;
    }

    const previousImageUrl = form.getValues("mobile_image");
    setFile(nextFile);
    setUploading(true);
    try {
      const result = await edgestore.publicFiles.upload({
        options: { temporary: true },
        file: nextFile,
      });
      temporaryImageUrl.current = result.url;
      form.setValue("mobile_image", result.url, { shouldDirty: true, shouldValidate: true });
    } catch {
      setFile(previousImageUrl || undefined);
      setUploadError(previousImageUrl
        ? "Image upload failed. Your previous image has been kept. Please try again."
        : "Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(values: BannerValues) {
    if (uploading) return;

    setSaveError("");
    try {
      // Existing banner images are already permanent. Confirm only a new upload.
      if (temporaryImageUrl.current === values.mobile_image) {
        await edgestore.publicFiles.confirmUpload({ url: values.mobile_image });
        temporaryImageUrl.current = undefined;
      }

      const response = await fetch("/api/banners", {
        method: banner ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(banner ? { ...values, _id: banner._id } : values),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?._id) {
        throw new Error(result?.message || (banner
          ? "Failed to update banner. Please try again."
          : "Failed to add banner. Please try again."));
      }

      toast.success(banner ? "Banner updated successfully." : "Banner added successfully.");
      setOpen(false);
      await onSaved();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save banner. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{banner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
          <DialogDescription>
            {banner ? "Update the banner details or choose a replacement image." : "Add a new promotional banner to the app."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-5" aria-busy={busy}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="Banner title" {...field} readOnly={saving} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile_image"
              render={() => (
                <FormItem>
                  <FormLabel>Banner Image</FormLabel>
                  <FormControl>
                    <SingleImageDropzone width={200} height={200} value={file} onChange={handleImageChange} disabled={busy} />
                  </FormControl>
                  {uploading && <p role="status" className="text-sm text-muted-foreground">Uploading image…</p>}
                  {uploadError && <p role="alert" className="text-sm text-destructive">{uploadError}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product ID</FormLabel>
                  <FormControl><Input placeholder="Product ID" {...field} readOnly={saving} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {saveError && <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{saveError}</p>}
            <DialogFooter className="mt-8">
              <DialogClose asChild><Button type="button" variant="outline" disabled={busy}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {uploading ? "Uploading…" : saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function PromotionalBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    try {
      setLoading(true);
      const response = await fetch("/api/banners");
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.data)) throw new Error("Failed to load banners.");
      setBanners(result.data);
    } catch {
      toast.error("Failed to load banners. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch("/api/banners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id }),
      });
      if (!response.ok) throw new Error("Failed to delete banner.");
      toast.success("Banner deleted successfully.");
      await fetchBanners();
    } catch {
      toast.error("Failed to delete banner.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div><p className="mb-2 text-sm font-medium text-primary">Storefront</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Promotion Banners</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Keep your featured products and promotions up to date.</p></div>
        <BannerFormDialog onSaved={fetchBanners}>
          <Button><PlusCircleIcon className="h-4 w-4" /><span className="ml-2">Add Banner</span></Button>
        </BannerFormDialog>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {!loading && banners.length !== 0 ? banners.map((banner) => (
          <div key={banner._id} className="overflow-hidden rounded-lg border bg-card shadow-sm transition-colors hover:border-primary/30">
            <img alt={banner.title} className="aspect-[2/1] w-full border-b bg-muted object-cover" height={150} src={banner.mobile_image} width={300} />
            <div className="p-5">
              <h3 className="break-words text-lg font-semibold tracking-tight">{banner.title}</h3>
              <p className="mt-1 break-all text-sm leading-6 text-muted-foreground">Product: {banner.id}</p>
              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <BannerFormDialog banner={banner} onSaved={fetchBanners}>
                  <Button size="icon" variant="outline" aria-label={`Edit banner: ${banner.title}`}><FileEditIcon className="h-4 w-4" /></Button>
                </BannerFormDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive"><Trash className="h-4 w-4" /><span className="sr-only">Delete</span></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Banner</AlertDialogTitle>
                      <AlertDialogDescription>Are you sure you want to delete this banner?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(banner._id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full rounded-lg border border-dashed bg-card px-6 py-16 text-center text-sm text-muted-foreground">
            {loading ? "Loading banners..." : "No banners found. Add a banner to feature a promotion."}
          </div>
        )}
      </div>
    </div>
  );
}
