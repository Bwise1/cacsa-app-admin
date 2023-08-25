"use client";
import React, { useState } from "react";
import Input from "./Input";
import SelectCategory from "./SelectCategory";
import AudioUpload from "./AudioUpload";
import ThumbNailUpload from "./ThumbNailUpload";
import { AudioInfo } from "@/types";
import { saveAudioDetails } from "@/lib/actions";

const SaveAudio: React.FC = ({}) => {
  const initialAudioInfo: AudioInfo = {
    title: "",
    description: "",
    artist: "",
    date: "",
    category_id: -1,
    audio_url: "",
    thumbnail_url: "",
  };

  const [audioInfo, setAudioInfo] = useState<AudioInfo>(initialAudioInfo);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { id, value } = event.target;
    setAudioInfo((prevAudioInfo) => ({
      ...prevAudioInfo,
      [id]: value,
    }));
  };

  const handleCategoryChange = (selectedCategoryId: number): void => {
    setAudioInfo((prevAudioInfo) => ({
      ...prevAudioInfo,
      category_id: selectedCategoryId,
    }));
  };

  const handleAudioFileChange = (audioUrl: string): void => {
    setAudioInfo((prevAudioInfo) => ({
      ...prevAudioInfo,
      audio_url: audioUrl,
    }));
  };

  const handleThumbnailFileChange = (thumbnailUrl: string): void => {
    setAudioInfo((prevAudioInfo) => ({
      ...prevAudioInfo,
      thumbnail_url: thumbnailUrl,
    }));
  };

  const handleSave = async (): Promise<void> => {
    const response = await saveAudioDetails(audioInfo);
    if (response.status === "success") {
      console.log("Saved successful");
      setAudioInfo(initialAudioInfo);
    }
  };

  return (
    <form className="w-full flex flex-col gap-6 py-2">
      <Input
        className="w-full p-6 bg-white rounded-[10px] border border-white"
        id="title"
        placeholder="Title"
        value={audioInfo.title}
        onChange={handleInputChange}
      />
      <Input
        className="w-full p-6 bg-white rounded-[10px] border border-white"
        id="description"
        placeholder="Description"
        value={audioInfo.description}
        onChange={handleInputChange}
      />
      <div className="grid grid-cols-2 gap-7 w-full ">
        <Input
          className="w-full p-6 bg-white rounded-[10px] border border-white"
          id="artist"
          placeholder="Artist/Preacher"
          value={audioInfo.artist}
          onChange={handleInputChange}
        />
        <Input
          className="w-full p-6 bg-white rounded-[10px] border border-white"
          id="date"
          type="date"
          placeholder="Select date"
          value={audioInfo.date}
          onChange={handleInputChange}
        />
      </div>
      <SelectCategory
        selectedCategory={audioInfo.category_id}
        onCategoryChange={handleCategoryChange}
      />
      <AudioUpload onUploadResult={handleAudioFileChange} />
      <ThumbNailUpload onThumbnailFileChange={handleThumbnailFileChange} />

      {/* Submit Button */}
      <div>
        <button
          type="button"
          className="focus:outline-none text-white bg-green focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2"
          onClick={handleSave}
        >
          Save
        </button>
        <button
          type="button"
          className="focus:outline-none text-white bg-red focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2"
          onClick={handleSave}
        >
          Clear
        </button>
      </div>
    </form>
  );
};

export default SaveAudio;
