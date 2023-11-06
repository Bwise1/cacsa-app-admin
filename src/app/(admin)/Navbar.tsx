"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Logout from "../../../public/logout.png";
import { ImSwitch } from "react-icons/im";
import { HiOutlineMusicNote } from "react-icons/hi";
import { BiLocationPlus } from "react-icons/bi";
const Navbar: React.FC = () => {
  const pathname = usePathname();
  return (
    <div className="w-[211px] bg-ca-black h-full justify-between flex-col p-2 flex  gap-16 ">
      <div className="text-white  text-bold text-xl pl-10 pt-10 flex">
        CACSA APP
      </div>
      <div className="flex flex-col text-xl  h-full">
        <Link
          className={`inline-flex px-10 py-2 items-center rounded-md gap-4 ${
            pathname.includes("/audio")
              ? "bg-green"
              : " hover:bg-green hover:opacity-60"
          }`}
          href="dashboard"
        >
          <HiOutlineMusicNote className="" />
          <span>Audio</span>
        </Link>
        <Link
          className={`inline-flex px-10 py-2 rounded-md items-center gap-4 ${
            pathname.includes("/location")
              ? "bg-green"
              : " hover:bg-green hover:opacity-60"
          }`}
          href={"location"}
        >
          <BiLocationPlus className="" />
          <span>Location</span>
        </Link>
        <Link
          className={`inline-flex px-10 py-2 rounded-md items-center gap-4 ${
            pathname.includes("/users")
              ? "bg-green"
              : " hover:bg-green hover:opacity-60"
          }`}
          href={"users"}
        >
          <BiLocationPlus className="" />
          <span>Users</span>
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        <div className="border-b border-white mx-10"></div>
        <div
          className="flex gap-2 pb-10 px-10 text-bold text-lg items-center place-self-center cursor-pointer hover:text-green"
          onClick={() => signOut()}
        >
          <ImSwitch /> <span>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
