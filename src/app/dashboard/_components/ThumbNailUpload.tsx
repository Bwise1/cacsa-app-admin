"use client";
import React, { useState } from "react";
import { uploadThumbNail } from "@/lib/actions";

interface ThumbNailUploadProps {
  onThumbnailFileChange: (thumbLink: string) => void;
}
const ThumbnailUpload: React.FC<ThumbNailUploadProps> = ({
  onThumbnailFileChange,
}) => {
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const thumbFile = event.target.files?.[0];
    if (thumbFile) {
      setThumbnail(thumbFile);

      // Preview the selected thumbnail
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(thumbFile);
    }
  };

  const handleUpload = async () => {
    if (thumbnail) {
      const formData = new FormData();
      formData.append("thumbfile", thumbnail);

      setUploading(true);
      try {
        const response = await uploadThumbNail(formData);
        setUploadResult(response);
        onThumbnailFileChange(response.thumbLink);
        console.log(response);
      } catch (error) {
        console.error("Error uploading thumbnail:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="form-group bg-white rounded-[10px] flex">
      <label className="flex justify-between text-black px-4 max-h-16 py-4 w-full items-center cursor-pointer relative">
        <div className="thumbnail-preview">
          {thumbnailPreview ? (
            <img
              src={thumbnailPreview}
              alt="Thumbnail Preview"
              className="max-h-14 mr-2"
            />
          ) : (
            "Insert Thumbnail"
          )}
          {uploading && (
            <div className="overlay">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>
        <input type="file" className="hidden" onChange={handleFileChange} />
        <button
          className="bg-green text-white px-4 py-2 rounded"
          onClick={handleUpload}
          disabled={
            uploading || (uploadResult && uploadResult.status === "success")
          }
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </label>
    </div>
  );
};

export default ThumbnailUpload;
