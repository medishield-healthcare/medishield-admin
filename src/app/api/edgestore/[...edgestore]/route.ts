import { initEdgeStore } from "@edgestore/server";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { z } from "zod";
const es = initEdgeStore.create();
const videoInput = z.object({ uploadId: z.string().uuid() });

function isPublicFileUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      parsed.hostname === "files.edgestore.dev" &&
      parsed.href === url &&
      !parsed.port && !parsed.username && !parsed.password && !parsed.search && !parsed.hash &&
      /^\/[\w-]+\/publicFiles\/_public\/[\w.-]+$/.test(parsed.pathname);
  } catch {
    return false;
  }
}
/**
 * This is the main router for the Edge Store buckets.
 */
const edgeStoreRouter = es.router({
  publicFiles: es
    .fileBucket()
    .beforeUpload(({ fileInfo }) => {
      // The generic bucket must not bypass the video database lifecycle.
      return !fileInfo.replaceTargetUrl || isPublicFileUrl(fileInfo.replaceTargetUrl);
    })
    .beforeDelete(({ fileInfo }) => {
      return isPublicFileUrl(fileInfo.url);
    }),
  videos: es
    .fileBucket({ maxSize: 100 * 1024 * 1024, accept: ["video/*"] })
    .input(videoInput)
    .path(({ input }) => [{ uploadId: input.uploadId }])
    .beforeUpload(async ({ input, fileInfo }) => {
      // Check the current session on each upload, rather than cached EdgeStore context.
      const session = await getServerSession(authOptions);
      return Boolean(session?.user?.access_token) &&
        videoInput.safeParse(input).success &&
        fileInfo.temporary === true &&
        !fileInfo.replaceTargetUrl &&
        !fileInfo.fileName &&
        /^video\/[a-z0-9.+-]+$/i.test(fileInfo.type) &&
        Number.isSafeInteger(fileInfo.size) &&
        fileInfo.size > 0;
    }),
  // No client delete hook: the backend coordinates deletion with MongoDB.
});
const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

export { handler as GET, handler as POST };
/**
 * This type is used to create the type-safe client for the frontend.
 */
export type EdgeStoreRouter = typeof edgeStoreRouter;
