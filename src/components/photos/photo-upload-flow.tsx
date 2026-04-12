"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FullPageModal } from "@/components/ui/full-page-modal";
import { Button } from "@/components/ui/button";

// ─── Upload config ─────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 50;
const MAX_DIMENSION = 2560;
const OUTPUT_QUALITY = 0.9;

function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  );
}

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const name = file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        OUTPUT_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      if (isHeic(file)) {
        reject(new Error(
          "HEIC photos can only be uploaded from Safari. Please open this page in Safari, or convert the photo to JPEG first.",
        ));
      } else {
        resolve(file);
      }
    };

    img.src = objectUrl;
  });
}

// ─── Flow state ────────────────────────────────────────────────────────────────

type FlowState =
  | { kind: "idle" }
  | { kind: "uploading"; file: File; previewUrl: string; caption: string }
  | { kind: "done"; previewUrl: string; approved: boolean }
  | { kind: "error"; message: string; file: File; previewUrl: string; caption: string };

// ─── Props ─────────────────────────────────────────────────────────────────────

interface PhotoUploadFlowProps {
  venueId: string;
  venueName: string;
  onUpdateSubmission: (
    submissionId: string,
    proposedData: {
      venue_id: string;
      caption: string;
      storage_path: string;
      filename: string;
    },
  ) => Promise<{ approved: boolean }>;
}

// ─── Heading ───────────────────────────────────────────────────────────────────

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="text-3xl font-normal leading-tight tracking-tight sm:text-4xl"
      style={{ fontFamily: 'var(--font-instrument-serif), Georgia, "Times New Roman", serif' }}
    >
      {children}
    </h1>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function PhotoUploadFlow({ venueId, venueName, onUpdateSubmission }: PhotoUploadFlowProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentPreviewUrl = useRef<string | null>(null);
  const [state, setState] = useState<FlowState>({ kind: "idle" });

  // Escape closes the modal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (currentPreviewUrl.current) URL.revokeObjectURL(currentPreviewUrl.current);
    };
  }, []);

  function selectFile(file: File) {
    if (currentPreviewUrl.current) {
      URL.revokeObjectURL(currentPreviewUrl.current);
    }
    const previewUrl = URL.createObjectURL(file);
    currentPreviewUrl.current = previewUrl;
    if (fileInputRef.current) fileInputRef.current.value = "";
    upload(file, previewUrl);
  }

  function reset() {
    if (currentPreviewUrl.current) {
      URL.revokeObjectURL(currentPreviewUrl.current);
      currentPreviewUrl.current = null;
    }
    setState({ kind: "idle" });
  }

  async function upload(file: File, previewUrl: string) {
    setState({ kind: "uploading", file, previewUrl, caption: "" });

    try {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`Photo must be under ${MAX_FILE_SIZE_MB} MB`);
      }

      const compressed = await compressImage(file);

      // Step 1: create submission record
      const createRes = await fetch("/api/submissions/photo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ venue_id: venueId, caption: "", filename: compressed.name }),
      });
      const created = (await createRes.json()) as
        | { submission_id: string; upload_path: string }
        | { error: string };
      if (!createRes.ok || "error" in created) {
        throw new Error("error" in created ? created.error : "Upload failed");
      }

      // Step 2: upload the file
      const uploadForm = new FormData();
      uploadForm.append("file", compressed);
      uploadForm.append("submission_id", created.submission_id);
      uploadForm.append("upload_path", created.upload_path);
      const uploadRes = await fetch("/api/upload/photo", { method: "POST", body: uploadForm });
      const uploaded: { success?: boolean; error?: string } = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || uploaded.error) throw new Error(uploaded.error ?? "Upload failed");

      // Step 3: record storage path on submission
      const result = await onUpdateSubmission(created.submission_id, {
        venue_id: venueId,
        caption: "",
        storage_path: created.upload_path,
        filename: compressed.name,
      });

      setState({ kind: "done", previewUrl, approved: result.approved });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Upload failed",
        file,
        previewUrl,
        caption: "",
      });
    }
  }

  // Derive the preview URL from state (for uploading/error/done)
  const previewUrl = state.kind !== "idle" ? state.previewUrl : null;

  return (
    <FullPageModal onClose={() => router.back()}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) selectFile(f);
        }}
      />

      <div className="w-full">
        {/* Venue label — visible in all states */}
        <p className="label-mono mb-3 text-[var(--muted-foreground)]">{venueName}</p>

        {/* ── Idle ────────────────────────────────────────────────────────── */}
        {state.kind === "idle" && (
          <div>
            <Heading>Add a photo</Heading>
            <div className="mt-6">
              <Button className="w-full sm:w-auto" onClick={() => fileInputRef.current?.click()}>
                Choose photo
              </Button>
              <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                JPEG, PNG, HEIC up to 50 MB
              </p>
            </div>
          </div>
        )}

        {/* ── Uploading / Error ────────────────────────────────────────────── */}
        {(state.kind === "uploading" || state.kind === "error") && (
          <div>
            <Heading>
              {state.kind === "uploading" ? "Uploading…" : "Something went wrong"}
            </Heading>

            {/* Preview */}
            {previewUrl && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Photo preview"
                  className="max-h-72 w-full object-contain"
                />
              </div>
            )}

            {/* Error message + retry */}
            {state.kind === "error" && (
              <>
                <p className="mt-3 text-sm text-[var(--red)]">{state.message}</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => upload(state.file, state.previewUrl)}
                  >
                    Try again
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={reset}
                  >
                    Choose a different photo
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Done ─────────────────────────────────────────────────────────── */}
        {state.kind === "done" && (
          <div>
            <Heading>Photo submitted</Heading>

            {/* Keep the preview visible so the user can see what they uploaded */}
            {previewUrl && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Uploaded photo"
                  className="max-h-72 w-full object-contain"
                />
              </div>
            )}

            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              {state.approved
                ? "Your photo is now live."
                : "Your photo is pending moderation and will appear publicly once approved."}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button className="w-full sm:w-auto" onClick={() => router.back()}>
                Done
              </Button>
              <Button variant="secondary" className="w-full sm:w-auto" onClick={reset}>
                Add another photo
              </Button>
            </div>
          </div>
        )}
      </div>
    </FullPageModal>
  );
}
