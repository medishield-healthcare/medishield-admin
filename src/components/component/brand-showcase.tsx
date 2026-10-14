"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PackageIcon } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import BrandCard from "./BrandCard";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SingleImageDropzone } from "./single-image-upload";
import { useEdgeStore } from "@/lib/edgestore";

type Brand = { _id: string; name: string; logo: string };

const formSchema = z.object({
  name: z.string().trim().min(1, "Enter a brand name."),
  logourl: z.string().trim().min(1, "Upload a brand logo."),
});

export function BrandShowcase() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const operationInProgress = useRef(false);
  const busy = uploading || saving || deleting;
  const { edgestore } = useEdgeStore();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", logourl: "" },
  });

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/brands", { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(result?.data)) {
        throw new Error("Unable to load brands. Please try again.");
      }
      setBrands(result.data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load brands.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBrands();
  }, [fetchBrands]);

  function openForm(brand: Brand | null) {
    if (operationInProgress.current) return;
    setEditingBrand(brand);
    setSaveError("");
    form.reset({ name: brand?.name ?? "", logourl: brand?.logo ?? "" });
    setOpen(true);
  }

  async function uploadLogo(file?: File) {
    if (operationInProgress.current) return;
    setSaveError("");
    if (!file) {
      form.setValue("logourl", "", { shouldValidate: true, shouldDirty: true });
      return;
    }
    operationInProgress.current = true;
    setUploading(true);
    try {
      const result = await edgestore.publicFiles.upload({ file });
      form.setValue("logourl", result.url, { shouldValidate: true, shouldDirty: true });
    } catch {
      setSaveError("Unable to upload the logo. Please try again.");
    } finally {
      operationInProgress.current = false;
      setUploading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (operationInProgress.current) return;
    operationInProgress.current = true;
    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch(
        editingBrand ? "/api/brands/" + encodeURIComponent(editingBrand._id) : "/api/brands",
        {
          method: editingBrand ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          // Create expects logourl, while update expects the model's logo field.
          body: JSON.stringify(editingBrand ? { name: values.name, logo: values.logourl } : values),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?._id) {
        throw new Error(result?.message || "Unable to save the brand. Please try again.");
      }
      setBrands((current) =>
        (editingBrand
          ? current.map((brand) => brand._id === editingBrand._id ? result : brand)
          : [...current, result]
        ).sort((a, b) => a.name.localeCompare(b.name)),
      );
      toast.success(editingBrand ? "Brand updated successfully." : "Brand created successfully.");
      setOpen(false);
      form.reset();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save the brand.");
    } finally {
      operationInProgress.current = false;
      setSaving(false);
    }
  }

  async function deleteBrand() {
    if (!deleteTarget || operationInProgress.current) return;
    operationInProgress.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch("/api/brands/" + encodeURIComponent(deleteTarget._id), {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?._id) {
        throw new Error(result?.message || "Unable to delete the brand. Please try again.");
      }
      setBrands((current) => current.filter((brand) => brand._id !== deleteTarget._id));
      toast.success("Brand deleted successfully.");
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete the brand.");
    } finally {
      operationInProgress.current = false;
      setDeleting(false);
    }
  }

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="page-content flex flex-col">
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <PackageIcon className="w-6 h-6" aria-hidden="true" />
          <h1 className="page-title">Brands</h1>
        </div>
        <Button className="ml-auto" onClick={() => openForm(null)} disabled={loading || busy}>
          Add Brand
        </Button>
      </header>

      <Dialog open={open} onOpenChange={(nextOpen) => {
        if (!operationInProgress.current) setOpen(nextOpen);
      }}>
        <DialogContent className="sm:max-w-[425px]" aria-busy={uploading || saving}>
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit Brand" : "Add Brand"}</DialogTitle>
            <DialogDescription>
              {editingBrand ? "Update the brand name or logo." : "Add a new brand to the showcase."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Brand Name" {...field} disabled={busy} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="logourl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <SingleImageDropzone
                      width={200}
                      height={200}
                      value={field.value || undefined}
                      disabled={busy}
                      onChange={uploadLogo}
                    />
                  </FormControl>
                  <FormDescription>Upload a logo, or click the current logo to replace it.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={busy} type="submit">
                  {uploading ? "Uploading..." : saving ? "Saving..." : editingBrand ? "Save Changes" : "Add Brand"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="surface flex items-center p-4 mb-6">
        <Input
          type="search"
          aria-label="Search brands"
          placeholder="Search for brands"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full max-w-lg"
        />
      </div>
      {loadError && (
        <div role="alert" className="surface flex flex-wrap items-center gap-3 p-4 mb-6">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" onClick={() => void fetchBrands()} disabled={loading || busy}>Retry</Button>
        </div>
      )}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 items-stretch" aria-busy={loading}>
        {loading ? <p role="status">Loading brands...</p> : filteredBrands.map((brand) => (
          <BrandCard
            key={brand._id}
            name={brand.name}
            thumbnail={brand.logo}
            disabled={busy}
            onEdit={() => openForm(brand)}
            onDelete={() => {
              setDeleteError("");
              setDeleteTarget(brand);
            }}
          />
        ))}
        {!loading && !loadError && filteredBrands.length === 0 && (
          <p role="status" className="col-span-full text-sm text-muted-foreground">
            {search.trim() ? "No brands match your search." : "No brands found. Add a brand to get started."}
          </p>
        )}
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(nextOpen) => {
        if (!nextOpen && !operationInProgress.current) setDeleteTarget(null);
      }}>
        <AlertDialogContent aria-busy={deleting}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void deleteBrand();
              }}
            >
              {deleting ? "Deleting..." : "Delete Brand"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
