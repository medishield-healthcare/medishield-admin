"use client";

import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { FileEditIcon, Loader2, PlusCircleIcon, Trash } from "lucide-react";
import { toast } from "sonner";
import { useEdgeStore } from "@/lib/edgestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

type Video = {
  _id: string;
  title: string;
  description: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  status?: "active" | "deleting";
  deletionPending?: boolean;
  cleanupPending?: boolean;
};

function fileError(file: File) {
  if (!file.type.startsWith("video/")) return "Choose a video file.";
  if (file.size === 0) return "The video file is empty. Choose another file.";
  if (file.size > MAX_VIDEO_SIZE) return "Choose a video smaller than 100 MB.";
  return "";
}

function VideoFormDialog({
  video,
  onSaved,
  children,
}: {
  video?: Video;
  onSaved: (video: Video) => void;
  children: ReactNode;
}) {
  const fieldId = useId();
  const { edgestore } = useEdgeStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState("");
  const [validationError, setValidationError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [stage, setStage] = useState<"idle" | "uploading" | "saving">("idle");
  const [progress, setProgress] = useState(0);
  const uploadUrl = useRef<string>();
  const submitting = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = stage !== "idle";

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
    setTitle(video?.title ?? "");
    setDescription(video?.description ?? "");
    setFile(undefined);
    uploadUrl.current = undefined;
    setValidationError("");
    setSaveError("");
    setProgress(0);
    setOpen(nextOpen);
  }

  function handleFileChange(nextFile?: File) {
    if (submitting.current) return;
    uploadUrl.current = undefined;
    setProgress(0);
    setSaveError("");
    const error = nextFile ? fileError(nextFile) : "";
    setValidationError(error);
    setFile(error ? undefined : nextFile);
    if (!nextFile || error) {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setSaveError("");
    if (!title.trim()) {
      setSaveError("Enter a video title.");
      return;
    }
    if (validationError) return;
    if (!video && !file) {
      setValidationError("Select a video to upload.");
      return;
    }
    if (file) {
      const error = fileError(file);
      if (error) {
        setValidationError(error);
        return;
      }
    }

    submitting.current = true;
    try {
      if (file && !uploadUrl.current) {
        setStage("uploading");
        setProgress(0);
        const upload = await edgestore.videos.upload({
          file,
          input: { uploadId: crypto.randomUUID() },
          options: { temporary: true },
          onProgressChange: setProgress,
        });
        // Keep this URL if saving fails, so retrying does not upload twice.
        uploadUrl.current = upload.url;
      }

      setStage("saving");
      const response = await fetch(
        video ? `/api/videos/${encodeURIComponent(video._id)}` : "/api/videos",
        {
          method: video ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            ...(file && {
              url: uploadUrl.current,
              fileName: file.name,
              mimeType: file.type,
              size: file.size,
            }),
          }),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?._id) {
        throw new Error(result?.message || "Unable to save the video. Please try again.");
      }

      onSaved(result);
      toast.success(video ? "Video updated successfully." : "Video uploaded successfully.");
      if (result.warning) toast.warning(result.warning);
      uploadUrl.current = undefined;
      setFile(undefined);
      setOpen(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save the video. Please try again.",
      );
    } finally {
      submitting.current = false;
      setStage("idle");
    }
  }

  const preview = previewUrl || video?.url;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{video ? "Edit Video" : "Add New Video"}</DialogTitle>
          <DialogDescription>
            {video
              ? "Update the details or select a replacement video."
              : "Choose a video and add its details, then save to upload."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-5" aria-busy={busy}>
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-title`}>Title</Label>
            <Input
              id={`${fieldId}-title`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Video title"
              maxLength={200}
              required
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-description`}>Description (optional)</Label>
            <Textarea
              id={`${fieldId}-description`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe this video"
              maxLength={5000}
              rows={3}
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-file`}>
              {video ? "Replacement video (optional)" : "Video file"}
            </Label>
            <Input
              ref={fileInput}
              id={`${fieldId}-file`}
              type="file"
              accept="video/*"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) handleFileChange(selected);
              }}
              disabled={busy}
              aria-invalid={Boolean(validationError)}
              aria-describedby={`${fieldId}-file-help${validationError ? ` ${fieldId}-file-error` : ""}`}
            />
            <p id={`${fieldId}-file-help`} className="text-sm text-muted-foreground">
              Video files up to 100 MB. Upload starts when you save.
            </p>
            {validationError && (
              <p id={`${fieldId}-file-error`} role="alert" className="text-sm text-destructive">
                {validationError}
              </p>
            )}
            {(file || validationError) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFileChange()}
                disabled={busy}
              >
                {video ? "Keep current video" : "Clear selection"}
              </Button>
            )}
            {preview && (
              <video
                key={preview}
                src={preview}
                controls
                preload="metadata"
                className="aspect-video w-full rounded-md bg-black"
                aria-label={`Preview of ${title || "selected video"}`}
              >
                Your browser does not support video playback.
              </video>
            )}
          </div>
          {stage === "uploading" && (
            <div className="space-y-2" role="status" aria-live="polite">
              <p className="text-sm text-muted-foreground">Uploading video: {Math.round(progress)}%</p>
              <progress className="h-2 w-full" max={100} value={progress} aria-label="Video upload progress" />
            </div>
          )}
          {saveError && (
            <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {saveError}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={busy}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {stage === "uploading" ? "Uploading..." : stage === "saving" ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VideoManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const deleteInProgress = useRef(false);
  const loadRequest = useRef(0);

  useEffect(() => {
    void fetchVideos();
  }, []);

  async function fetchVideos() {
    const request = ++loadRequest.current;
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/videos", { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(result?.data)) {
        throw new Error(result?.message || "Unable to load videos. Please try again.");
      }
      if (request === loadRequest.current) setVideos(result.data);
    } catch (error) {
      if (request === loadRequest.current) {
        setLoadError(error instanceof Error ? error.message : "Unable to load videos. Please try again.");
      }
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  }

  function handleSaved(savedVideo: Video) {
    setVideos((current) =>
      current.some((video) => video._id === savedVideo._id)
        ? current.map((video) => video._id === savedVideo._id ? savedVideo : video)
        : [savedVideo, ...current],
    );
  }

  async function handleDelete() {
    if (!deleteTarget || deleteInProgress.current) return;
    const id = deleteTarget._id;
    deleteInProgress.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/videos/${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        if (result?.deletionPending) {
          setVideos((current) => current.map((video) =>
            video._id === id ? { ...video, status: "deleting", deletionPending: true } : video,
          ));
          setDeleteTarget((current) => current && { ...current, status: "deleting", deletionPending: true });
        }
        throw new Error(result?.message || "Unable to delete the video. Please try again.");
      }
      setVideos((current) => current.filter((video) => video._id !== id));
      setDeleteTarget(null);
      toast.success("Video deleted successfully.");
      if (result?.warning) toast.warning(result.warning);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete the video. Please try again.");
    } finally {
      deleteInProgress.current = false;
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Storefront</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Videos</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Upload and manage your video library.</p>
        </div>
        <VideoFormDialog onSaved={handleSaved}>
          <Button disabled={loading}>
            <PlusCircleIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Video
          </Button>
        </VideoFormDialog>
      </div>
      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" onClick={() => void fetchVideos()} disabled={loading}>Retry</Button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy={loading}>
        {videos.map((video) => (
          <div key={video._id} className="overflow-hidden rounded-lg border bg-card shadow-sm transition-colors hover:border-primary/30">
            {video.status === "deleting" || video.deletionPending ? (
              <div className="flex aspect-video items-center justify-center border-b bg-muted p-5 text-center text-sm text-muted-foreground">
                Deletion pending. Retry deleting to finish removing this video.
              </div>
            ) : (
              <video
                src={video.url}
                controls
                preload="metadata"
                className="aspect-video w-full border-b bg-black"
                aria-label={video.title}
              >
                Your browser does not support video playback.
              </video>
            )}
            <div className="p-5">
              <h2 className="break-words text-lg font-semibold tracking-tight">{video.title}</h2>
              {video.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{video.description}</p>}
              <p className="mt-2 break-all text-xs leading-5 text-muted-foreground">
                {video.fileName} &middot; {(video.size / 1024 / 1024).toFixed(1)} MB
              </p>
              {video.cleanupPending && video.status !== "deleting" && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Previous file cleanup is pending. Open Edit and save to retry.
                </p>
              )}
              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <VideoFormDialog video={video} onSaved={handleSaved}>
                  <Button size="icon" variant="outline" aria-label={`Edit video: ${video.title}`} disabled={loading || deleting || video.status === "deleting" || video.deletionPending}>
                    <FileEditIcon className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </VideoFormDialog>
                <Button
                  size={video.status === "deleting" || video.deletionPending ? "sm" : "icon"}
                  variant="destructive"
                  aria-label={`${video.status === "deleting" || video.deletionPending ? "Retry deleting video" : "Delete video"}: ${video.title}`}
                  disabled={loading || deleting}
                  onClick={() => {
                    setDeleteError("");
                    setDeleteTarget(video);
                  }}
                >
                  <Trash className="h-4 w-4" aria-hidden="true" />
                  {(video.status === "deleting" || video.deletionPending) && <span className="ml-2">Retry delete</span>}
                </Button>
              </div>
            </div>
          </div>
        ))}
        {videos.length === 0 && !loadError && (
          <div role="status" className="col-span-full rounded-lg border border-dashed bg-card px-6 py-16 text-center text-sm text-muted-foreground">
            {loading ? "Loading videos..." : "No videos found. Add a video to get started."}
          </div>
        )}
      </div>
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !deleteInProgress.current) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent aria-busy={deleting}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteTarget?.title}&quot;? The video file and its saved details will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
