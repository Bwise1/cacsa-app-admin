"use client";
import { uploadAudio } from "@/lib/actions";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ApiResponse } from "@/types";

interface AudioUploadProps {
  onUploadResult: (uploadResult: string) => void;
}

const AudioUpload: React.FC<AudioUploadProps> = ({ onUploadResult }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const audioFile = event.target.files?.[0];
    setUploadProgress(0);
    if (audioFile) {
      const formData = new FormData();
      formData.append("audiofile", audioFile);

      setUploading(true);
      try {
        const response: ApiResponse = await uploadAudio(
          formData,
          (progress) => {
            setUploadProgress(progress); // Update progress state
          }
        );

        if (response.link) {
          setAudioUrl(response.link);
        }
        setUploadResult(response);
        onUploadResult(response.link);
        // console.log(response.link);
      } catch (error) {
        console.error("Error uploading audio:", error);
      } finally {
        setUploading(false);
      }
    }
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
    if (audioFile) {
      const formData = new FormData();
      formData.append("audiofile", audioFile);

      setUploading(true);
      uploadAudio(formData, (progress) => {
        setUploadProgress(progress); // Update progress state
      })
        .then((response) => {
          setUploadResult(response);
          if (response.link) {
            setAudioUrl(response.link);
            setUploadProgress(0);
          }
          // console.log(response);
        })
        .catch((error) => {
          console.error("Error uploading audio:", error);
        })
        .finally(() => {
          setUploading(false);
        });
    }
  };

  return (
    <div>
      {!audioUrl ? (
        <div className="flex items-center justify-center w-full ">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-black bg-opacity-80 hover:bg-gray-10"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Image
                src="/download.svg"
                alt="download"
                className=""
                width={70}
                height={51}
                priority
              />
              <p className="mb-2 p-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag
                and drop audio
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                MP3, MP4, WAV
              </p>
            </div>
            <input
              id="dropzone-file"
              onChange={handleFileChange}
              accept="audio/*"
              type="file"
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full border-2 border-gray-300 rounded-lg bg-black bg-opacity-80 p-4">
          <audio controls src={audioUrl} className="w-full mb-4">
            Your browser does not support the audio element.
          </audio>
          <button
            onClick={() => {
              setAudioUrl(null);
              setUploadProgress(0);
            }}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Remove Audio
          </button>
        </div>
      )}
      {/* Progress bar */}

      {uploading || uploadResult ? (
        <div className="w-full bg-gray-200 rounded-full h-2 my-4">
          <div
            className="bg-green h-2 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      ) : null}
    </div>
  );
};

export default AudioUpload;
