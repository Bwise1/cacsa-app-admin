"use client";
import { uploadAudio } from "@/lib/actions";
import React, { useEffect, useState } from "react";
import Image from "next/image";

interface AudioUploadProps {
  onUploadResult: (uploadResult: string) => void;
}

const AudioUpload: React.FC<AudioUploadProps> = ({ onUploadResult }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const audioFile = event.target.files?.[0];
    if (audioFile) {
      const formData = new FormData();
      formData.append("audiofile", audioFile);

      setUploading(true);
      try {
        const response = await uploadAudio(formData);
        setUploadResult(response);
        onUploadResult(response.link);
        console.log(response);
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

    const audioFile = event.dataTransfer.files[0];
    if (audioFile) {
      const formData = new FormData();
      formData.append("audiofile", audioFile);

      setUploading(true);
      uploadAudio(formData)
        .then((response) => {
          setUploadResult(response);
          console.log(response);
        })
        .catch((error) => {
          console.error("Error uploading audio:", error);
        })
        .finally(() => {
          setUploading(false);
        });
    }
  };

  useEffect(() => {
    // Listen for changes in uploadProgress and adjust the width of the progress bar
    if (uploading) {
      const interval = setInterval(() => {
        setUploadProgress((prevProgress) =>
          prevProgress < 100 ? prevProgress + 1 : 100
        );
      }, 100); // Adjust the interval as needed
      return () => clearInterval(interval);
    }
  }, [uploading]);
  return (
    <div>
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-10"
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
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              SVG, PNG, JPG or GIF (MAX. 800x400px)
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
      {/* Progress bar */}

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2 my-4">
          <div
            className="bg-green h-2 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default AudioUpload;
