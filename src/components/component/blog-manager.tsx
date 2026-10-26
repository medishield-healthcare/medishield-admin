"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FilePenLine, Loader2, PlusCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const editorModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};
const editorFormats = ["header", "bold", "italic", "underline", "blockquote", "list", "bullet", "link"];

type Blog = {
  _id: string;
  title: string;
  featuredImage: string;
  description: string;
  blogMetaTitle: string;
  blogMetaDescription: string;
  createdAt: string;
  updatedAt: string;
  cleanupPending?: boolean;
  deletionPending?: boolean;
  warning?: string;
};

function imageError(file: File): string {
  if (!IMAGE_TYPES.has(file.type)) return "Choose a JPEG, PNG, WebP, or GIF image.";
  if (!file.size) return "The selected image is empty.";
  if (file.size > MAX_IMAGE_SIZE) return "Choose an image no larger than 5 MB.";
  return "";
}

function descriptionHasText(value: string): boolean {
  return Boolean(new DOMParser().parseFromString(value, "text/html").body.textContent?.replace(/\u00a0/g, " ").trim());
}

function BlogFormDialog({ blog, onSaved, children }: {
  blog?: Blog;
  onSaved: (saved: Blog) => void;
  children: ReactNode;
}) {
  const fieldId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [blogMetaTitle, setBlogMetaTitle] = useState("");
  const [blogMetaDescription, setBlogMetaDescription] = useState("");
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleOpenChange(nextOpen: boolean) {
    if (submitting.current) return;
    if (nextOpen) {
      setTitle(blog?.title ?? "");
      setDescription(blog?.description ?? "");
      setBlogMetaTitle(blog?.blogMetaTitle ?? "");
      setBlogMetaDescription(blog?.blogMetaDescription ?? "");
      setFile(undefined);
      setFileError("");
      setSaveError("");
      if (fileInput.current) fileInput.current.value = "";
    }
    setOpen(nextOpen);
  }

  function selectFile(selected?: File) {
    const error = selected ? imageError(selected) : "";
    setFileError(error);
    setSaveError("");
    setFile(error ? undefined : selected);
    if ((!selected || error) && fileInput.current) fileInput.current.value = "";
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const nextTitle = title.trim();
    const nextMetaTitle = blogMetaTitle.trim();
    const nextMetaDescription = blogMetaDescription.trim();
    if (!nextTitle || nextTitle.length > 200) return setSaveError("Title must be 1–200 characters.");
    if (!descriptionHasText(description)) return setSaveError("Enter a description.");
    if (description.length > 200000 || new TextEncoder().encode(description).length > 200000) {
      return setSaveError("Description must be no larger than 200,000 bytes.");
    }
    if (nextMetaTitle.length > 200 || nextMetaDescription.length > 500) {
      return setSaveError("Check the SEO title and description lengths.");
    }
    if (!blog && !file) return setFileError("Select a featured image.");
    if (file) {
      const error = imageError(file);
      if (error) return setFileError(error);
    }
    if (blog && !blog.cleanupPending && !file && nextTitle === blog.title && description === blog.description &&
        nextMetaTitle === blog.blogMetaTitle && nextMetaDescription === blog.blogMetaDescription) {
      return setSaveError("Change a field or select a replacement image before saving.");
    }

    const body = new FormData();
    body.set("title", nextTitle);
    body.set("description", description);
    body.set("blogMetaTitle", nextMetaTitle);
    body.set("blogMetaDescription", nextMetaDescription);
    if (file) body.set("featuredImage", file);

    submitting.current = true;
    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch(blog ? `/api/blogs/${encodeURIComponent(blog._id)}` : "/api/blogs", {
        method: blog ? "PUT" : "POST",
        body,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?._id) {
        throw new Error(result?.message || `Could not ${blog ? "update" : "create"} the blog.`);
      }
      onSaved(result as Blog);
      toast.success(blog ? "Blog updated." : "Blog created.");
      if (result.warning) toast.warning(result.warning);
      setOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save the blog.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  const preview = previewUrl || blog?.featuredImage;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{blog ? "Edit blog" : "Add blog"}</DialogTitle>
          <DialogDescription>
            {blog ? "Update the article and optionally replace its featured image." : "Create an article with a featured image and SEO details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-5" aria-busy={saving}>
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-title`}>Title *</Label>
            <Input id={`${fieldId}-title`} value={title} onChange={(event) => setTitle(event.target.value)}
              maxLength={200} required disabled={saving} placeholder="Blog title" />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-image`}>{blog ? "Replace featured image" : "Featured image *"}</Label>
            <Input ref={fileInput} id={`${fieldId}-image`} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => selectFile(event.target.files?.[0])} disabled={saving}
              aria-invalid={Boolean(fileError)} aria-describedby={`${fieldId}-image-help${fileError ? ` ${fieldId}-image-error` : ""}`} />
            <p id={`${fieldId}-image-help`} className="text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF, up to 5 MB. The image uploads when you save.</p>
            {fileError && <p id={`${fieldId}-image-error`} role="alert" className="text-sm text-destructive">{fileError}</p>}
            {file && <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => selectFile()}>
              {blog ? "Keep current image" : "Clear selection"}
            </Button>}
            {preview && <img src={preview} alt={title ? `Featured image for ${title}` : "Featured image preview"}
              className="h-44 w-full rounded-md border bg-muted object-contain" />}
          </div>

          <div className="space-y-2">
            <Label id={`${fieldId}-description`}>Description *</Label>
            <div role="group" aria-labelledby={`${fieldId}-description`} className="blog-editor rounded-md border border-input bg-card">
              <ReactQuill theme="snow" value={description} onChange={setDescription}
                modules={editorModules} formats={editorFormats} readOnly={saving}
                placeholder="Write your article" />
            </div>
            <p className="text-xs text-muted-foreground">Formatted content: {description.length.toLocaleString()} / 200,000 characters</p>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div>
              <h3 className="text-sm font-semibold">Search appearance</h3>
              <p className="text-xs text-muted-foreground">Optional title and description for search results.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-meta-title`}>SEO title</Label>
              <Input id={`${fieldId}-meta-title`} value={blogMetaTitle} onChange={(event) => setBlogMetaTitle(event.target.value)}
                maxLength={200} disabled={saving} placeholder="Optional search result title" />
              <p className="text-xs text-muted-foreground">{blogMetaTitle.length} / 200</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-meta-description`}>SEO description</Label>
              <Textarea id={`${fieldId}-meta-description`} value={blogMetaDescription}
                onChange={(event) => setBlogMetaDescription(event.target.value)} maxLength={500} rows={3}
                disabled={saving} placeholder="A short summary for search results" />
              <p className="text-xs text-muted-foreground">{blogMetaDescription.length} / 500</p>
            </div>
          </div>

          {saveError && <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{saveError}</p>}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={saving}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {saving ? "Saving..." : blog ? "Save changes" : "Create blog"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function blogDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  });
}

export function BlogManager() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const requestVersion = useRef(0);
  const deleteInProgress = useRef(false);

  const loadBlogs = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/blogs", { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(result?.data)) {
        throw new Error(result?.message || "Could not load blogs.");
      }
      if (version === requestVersion.current) setBlogs(result.data as Blog[]);
    } catch (error) {
      if (version === requestVersion.current) {
        setLoadError(error instanceof Error ? error.message : "Could not load blogs.");
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadBlogs(); }, [loadBlogs]);

  function handleSaved(saved: Blog) {
    requestVersion.current += 1;
    setLoading(false);
    setLoadError("");
    setBlogs((current) => current.some((blog) => blog._id === saved._id)
      ? current.map((blog) => blog._id === saved._id ? saved : blog)
      : [saved, ...current]);
  }

  async function handleDelete() {
    if (!deleteTarget || deleteInProgress.current) return;
    const id = deleteTarget._id;
    deleteInProgress.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/blogs/${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        if (result?.deletionPending) {
          setBlogs((current) => current.map((blog) => blog._id === id ? { ...blog, deletionPending: true } : blog));
          setDeleteTarget((current) => current ? { ...current, deletionPending: true } : null);
        }
        throw new Error(result?.message || "Could not delete the blog.");
      }
      requestVersion.current += 1;
      setLoading(false);
      setLoadError("");
      setBlogs((current) => current.filter((blog) => blog._id !== id));
      setDeleteTarget(null);
      toast.success("Blog deleted.");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete the blog.");
    } finally {
      deleteInProgress.current = false;
      setDeleting(false);
    }
  }

  const query = search.trim().toLowerCase();
  const visibleBlogs = blogs.filter((blog) =>
    [blog.title, blog.blogMetaTitle, blog.blogMetaDescription]
      .some((value) => value?.toLowerCase().includes(query)));

  return (
    <div className="page-content space-y-6">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Blogs</h1>
          <p className="page-description">Create and manage blog articles.</p>
        </div>
        <BlogFormDialog onSaved={handleSaved}>
          <Button><PlusCircle className="h-4 w-4" aria-hidden="true" />Add blog</Button>
        </BlogFormDialog>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search blogs" type="search" value={search}
            onChange={(event) => setSearch(event.target.value)} placeholder="Search blogs" className="pl-9" />
        </div>
        <p className="text-sm text-muted-foreground">{visibleBlogs.length} {visibleBlogs.length === 1 ? "blog" : "blogs"}</p>
      </div>

      {loadError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        <span>{loadError}</span>
        <Button type="button" size="sm" variant="outline" onClick={() => void loadBlogs()} disabled={loading}>Retry</Button>
      </div>}

      {loading && !blogs.length ? (
        <div className="empty-state">Loading blogs...</div>
      ) : !visibleBlogs.length ? (
        <div className="empty-state">
          {loadError ? "Blogs could not be loaded." : query ? "No blogs match your search." : "No blogs found. Add a blog to get started."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy={loading}>
          {visibleBlogs.map((blog) => (
            <article key={blog._id} className="overflow-hidden rounded-lg border bg-card shadow-sm">
              {blog.deletionPending ? (
                <div className="flex aspect-[16/9] items-center justify-center border-b bg-muted p-5 text-center text-sm text-muted-foreground">
                  Deletion pending. Retry deleting to finish removing this blog.
                </div>
              ) : (
                <img src={blog.featuredImage} alt={blog.title} loading="lazy" className="aspect-[16/9] w-full border-b bg-muted object-cover" />
              )}
              <div className="space-y-3 p-5">
                <div>
                  <p className="text-xs text-muted-foreground">{blogDate(blog.createdAt)}</p>
                  <h2 className="mt-1 break-words text-lg font-semibold">{blog.title}</h2>
                </div>
                {blog.blogMetaDescription && <p className="line-clamp-3 break-words text-sm text-muted-foreground">{blog.blogMetaDescription}</p>}
                {blog.cleanupPending && !blog.deletionPending && (
                  <p className="text-sm text-muted-foreground">Cleanup of a previous image is pending. Saving an edit will retry it.</p>
                )}
                <div className="flex justify-end gap-2 border-t pt-4">
                  <BlogFormDialog blog={blog} onSaved={handleSaved}>
                    <Button type="button" size="sm" variant="outline" disabled={blog.deletionPending || deleting}
                      aria-label={`Edit blog: ${blog.title}`}><FilePenLine className="h-4 w-4" aria-hidden="true" />Edit</Button>
                  </BlogFormDialog>
                  <Button type="button" size="sm" variant="destructive" disabled={deleting}
                    aria-label={`${blog.deletionPending ? "Retry deleting blog" : "Delete blog"}: ${blog.title}`}
                    onClick={() => { setDeleteError(""); setDeleteTarget(blog); }}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />{blog.deletionPending ? "Retry delete" : "Delete"}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(nextOpen) => { if (!nextOpen && !deleteInProgress.current) setDeleteTarget(null); }}>
        <AlertDialogContent aria-busy={deleting}>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.deletionPending ? "Retry deleting blog" : "Delete blog"}</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteTarget?.title}&quot;? Its featured image and saved details will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => { event.preventDefault(); void handleDelete(); }}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {deleting ? "Deleting..." : deleteTarget?.deletionPending ? "Retry delete" : "Delete blog"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
