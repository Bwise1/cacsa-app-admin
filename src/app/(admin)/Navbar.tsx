"use client";
import React, { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Logout from "../../../public/logout.png";
import { ImSwitch } from "react-icons/im";
import { HiOutlineMusicNote } from "react-icons/hi";
import { BiLocationPlus } from "react-icons/bi";
const Navbar: React.FC = () => {
  return (
    <div className="w-[211px] bg-ca-black h-full justify-between flex-col flex p-10 gap-16 ">
      <div className="text-white  text-bold text-xl">CACSA APP</div>
      <div className="flex flex-col text-xl gap-4 h-full">
        <Link
          className="inline-flex items-center gap-4 hover:bg-green"
          href={"dashboard"}
        >
          <HiOutlineMusicNote className="" />
          <span>Audio</span>
        </Link>
        <Link
          className="inline-flex items-center gap-4 bg-green"
          href={"dashboard"}
        >
          <BiLocationPlus className="" />
          <span>Location</span>
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        <div className="border-b border-white "></div>
        <Link
          className="flex gap-2 text-bold text-lg items-center place-self-center cursor-pointer hover:text-green"
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
