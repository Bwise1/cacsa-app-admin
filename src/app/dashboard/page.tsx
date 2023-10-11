import React from "react";
import LeftSideBar from "./leftSidebar";
import Middle from "./middle";
import RightSideBar from "./rightSidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

const DashboardPage: React.FC = async () => {
  const session = await getServerSession(authOptions);
  return (
    <div className="flex w-full h-[100dvh] min-h-[720px] bg-white p-3 gap-4 justify-between  ">
      <div className="w-fit">
        <LeftSideBar />
      </div>
      <div className="w-full  overflow-scroll">
        <Middle />
      </div>
      <div className="w-fit">
        <RightSideBar />
      </div>
    </div>
  );
};

export default DashboardPage;
