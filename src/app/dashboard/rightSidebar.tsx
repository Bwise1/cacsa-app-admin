import { getServerSession } from "next-auth";
import React from "react";
import Image from "next/image";
import { authOptions } from "../api/auth/[...nextauth]/route";
import Thinktech from "../../../public/thinktech.png";

const RightSideBar: React.FC = async () => {
  const session = await getServerSession(authOptions);
  return (
    <div className="w-[247px] h-full bg-black relative rounded-[10px] flex items-center 2xl:gap-16  gap-12 flex-col 2xl:py-24 py-16 overflow-hidden">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="font-bold text-green 2xl:text-5xl text-4xl">294</div>
        <div className=" text-white text-xl">Uploads</div>
      </div>
      <div className="border-b border-white w-[150px] "></div>
      <div className="flex items-center 2xl:gap-12 gap-10 justify-center flex-col">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="font-bold text-green 2xl:text-5xl text-4xl">80</div>
          <div className=" text-white text-xl">Sermons</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="font-bold text-green 2xl:text-5xl text-4xl">90</div>
          <div className=" text-white text-xl">Podcasts</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="font-bold text-green 2xl:text-5xl text-4xl">100</div>
          <div className=" text-white text-xl">Music</div>
        </div>{" "}
      </div>

      <div className=" bottom-12 left-0 right-0 flex flex-col h-full items-center justify-end  absolute">
        <span className="text-sm text-white">POWERED BY</span>
        <Image width={100} alt="thinktech" src={Thinktech} />
      </div>
    </div>
  );
};

export default RightSideBar;
