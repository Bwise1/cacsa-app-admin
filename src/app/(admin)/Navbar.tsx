"use client";
import React, { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Logout from "../../../public/logout.png";
import { ImSwitch } from "react-icons/im";
const Navbar: React.FC = () => {
  return (
    <div className="w-[211px] bg-ca-black h-full flex-col  flex justify-between p-10 gap-16 ">
      <div className="text-white  text-bold text-xl">CACSA APP</div>
      <ul className="mt-2">
        <li className="inline-flex gap-2">
          <ImSwitch /> <span>Overview</span>
        </li>
        <li className="inline-flex gap-2">
          <ImSwitch /> <span>Overview</span>
        </li>
        <li className="inline-flex gap-2">
          <ImSwitch /> <span>Overview</span>
        </li>
        <li className="inline-flex gap-2">
          <ImSwitch /> <span>Overview</span>
        </li>
      </ul>
      <div className="flex flex-col gap-2">
        <div className="border-b border-white "></div>
        <Link
          className="flex gap-2 text-bold text-lg cursor-pointer hover:text-white"
          href={""}
          onClick={() => signOut()}
        >
          <ImSwitch /> <span>Logout</span>
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
