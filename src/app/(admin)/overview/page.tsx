import Card from "@/app/_components/Card";
import React from "react";
import { FaUserPen } from "react-icons/fa6";

const Overview: React.FC = async () => {
  return (
    <div className="flex gap-4">
      <Card>
        <div className="p-11 flex flex-col">
          <FaUserPen className="h-10 w-10" />
          <span>900</span>
          <span>Registered</span>
          <span>Users</span>
        </div>
      </Card>
      <Card>
        <div className="p-11 flex flex-col">
          <FaUserPen className="h-10 w-10" />
          <span>900</span>
          <span>Subscribed</span>
          <span>Users</span>
        </div>
      </Card>
    </div>
  );
};

export default Overview;
