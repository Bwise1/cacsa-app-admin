import React from "react";
import Input from "./_components/Input";
import Select from "./_components/Select";
import Image from "next/image";
import LeftSideBar from "./leftSidebar";
import Middle from "./middle";
import RightSideBar from "./rightSidebar";

const DashboardPage: React.FC = () => {
  return (
    <div className="flex w-full h-[100dvh] min-h-[720px] bg-white px-12 py-8 gap-4 justify-between  ">
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
