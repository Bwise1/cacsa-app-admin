"use client";
import { uploadAudio } from "@/lib/actions";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import type { ApiResponse } from "@/types";

function formatDurationLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Fallback if server did not return duration (browser metadata; may fail on CORS). */
function probeDurationFromUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const a = document.createElement("audio");
    a.preload = "metadata";
    a.crossOrigin = "anonymous";
    const cleanup = () => {
      a.removeAttribute("src");
      a.load();
    };
    const onMeta = () => {
      if (a.duration && Number.isFinite(a.duration) && a.duration > 0) {
        cleanup();
        resolve(formatDurationLabel(a.duration));
      } else {
        cleanup();
        reject(new Error("No duration"));
      }
    };
    const onErr = () => {
      cleanup();
      reject(new Error("Load failed"));
    };
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("error", onErr);
    a.src = url;
  });
}

interface AudioUploadProps {
  onUploadResult: (uploadResult: string) => void;
  onDurationDetected?: (durationLabel: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  initialUrl?: string | null;
}

/** Compact panel — avoids tall scroll in parent modals. */
const PANEL_MIN_H = "min-h-[156px]";

const AudioUpload: React.FC<AudioUploadProps> = ({
  onUploadResult,
  onDurationDetected,
  onUploadingChange,
  initialUrl = null,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  useEffect(() => {
    setAudioUrl(initialUrl ?? null);
    setUploadProgress(0);
  }, [initialUrl]);

  const runAfterUpload = (
    link: string,
    durationFromServer?: string | null
  ) => {
    setAudioUrl(link);
    onUploadResult(link);
    if (durationFromServer && String(durationFromServer).trim() !== "") {
      onDurationDetected?.(String(durationFromServer).trim());
      return;
    }
    probeDurationFromUrl(link)
      .then((label) => {
        onDurationDetected?.(label);
      })
      .catch(() => {});
  };

  const applyUploadResponse = (response: ApiResponse) => {
    if (response.link) {
      runAfterUpload(response.link, response.duration);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const audioFile = event.target.files?.[0];
    setUploadProgress(0);
    if (!audioFile) return;

    const formData = new FormData();
    formData.append("audiofile", audioFile);

    setUploading(true);
    try {
      const response = await uploadAudio(formData, (progress) => {
        setUploadProgress(progress);
      });
      applyUploadResponse(response);
    } catch (error) {
      console.error("Error uploading audio:", error);
    } finally {
      setUploading(false);
    }
    event.target.value = "";
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.currentTarget.classList.add("hover:bg-gray-200");
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove("hover:bg-gray-200");
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove("hover:bg-gray-200");

    setUploadProgress(0);
    const audioFile = event.dataTransfer.files[0];
    if (!audioFile) return;

    const formData = new FormData();
    formData.append("audiofile", audioFile);

    setUploading(true);
    uploadAudio(formData, (progress) => {
      setUploadProgress(progress);
    })
      .then((response) => {
        applyUploadResponse(response);
      })
      .catch((error) => {
        console.error("Error uploading audio:", error);
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const clearAudio = () => {
    setAudioUrl(null);
    setUploadProgress(0);
    onUploadResult("");
    onDurationDetected?.("");
  };

  const hasAudio = Boolean(audioUrl);

  return (
    <div className="w-full min-w-[240px] flex flex-col border border-white/20 rounded-lg bg-black/40 overflow-hidden">
      {/* Fixed-height main area — dropzone and player swap without resizing the card */}
      <div
        className={`${PANEL_MIN_H} flex flex-col justify-center p-2.5 box-border`}
      >
        {!hasAudio ? (
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-full min-h-[132px] border-2 border-dashed border-gray-400/50 rounded-lg bg-black/60 cursor-pointer hover:bg-black/80 transition-colors"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center py-2">
              <Image
                src="/download.svg"
                alt=""
                width={44}
                height={32}
                priority
              />
              <p className="mb-1 mt-2 px-2 text-xs text-gray-400 text-center">
                <span className="font-semibold text-gray-300">Click to upload</span>{" "}
                or drag and drop
              </p>
              <p className="text-[10px] text-gray-500">MP3, MP4, WAV</p>
            </div>
            <input
              id="dropzone-file"
              onChange={handleFileChange}
              accept="audio/*"
              type="file"
              className="hidden"
            />
          </label>
        ) : (
          <div
            className={`flex flex-col items-stretch justify-center w-full h-full ${PANEL_MIN_H} px-0.5`}
          >
            <audio controls src={audioUrl!} className="w-full mb-2">
              Your browser does not support the audio element.
            </audio>
            <button
              type="button"
              onClick={clearAudio}
              className="self-center bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-1.5 px-3 rounded"
            >
              Remove / replace audio
            </button>
          </div>
        )}
      </div>

      {/* Reserved strip so progress never pushes content */}
      <div className="h-[2.75rem] shrink-0 border-t border-white/10 bg-black/30 px-2.5 flex flex-col justify-center">
        {uploading ? (
          <>
            <div className="w-full bg-gray-600/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green h-2 rounded-full transition-[width] duration-150 ease-out"
                style={{ width: `${Math.min(100, uploadProgress)}%` }}
              />
            </div>
            <p className="text-[11px] text-center text-white/70 mt-1.5">
              Uploading… {Math.round(uploadProgress)}%
            </p>
          </>
        ) : (
          <div className="h-2" aria-hidden />
        )}
      </div>
    </div>
  );
};

export default AudioUpload;
