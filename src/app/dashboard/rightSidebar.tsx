import { getServerSession } from "next-auth";
import React from "react";
import { authOptions } from "../api/auth/[...nextauth]/route";

const RightSideBar: React.FC = async () => {
  const session = await getServerSession(authOptions);
  return (
    <div className="w-[247px] h-full bg-black rounded-[10px]">
      <p className="text-white">{session?.user.username}</p>
    </div>
  );
};

export default RightSideBar;
