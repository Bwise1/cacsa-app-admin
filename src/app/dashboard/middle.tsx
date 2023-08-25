import React from "react";
import Input from "./_components/Input";
import AudioUpload from "./_components/AudioUpload";
import ThumbNailUpload from "./_components/ThumbNailUpload";
import SelectCategory from "./_components/SelectCategory";
import SaveAudio from "./_components/SaveAudio";

const Middle: React.FC = () => {
  return (
    <div className="bg-black w-full p-9">
      <SaveAudio />
    </div>
  );
};

export default Middle;
