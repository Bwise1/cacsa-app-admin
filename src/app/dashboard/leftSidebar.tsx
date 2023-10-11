"use client";
import React, { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { BsChevronDown } from "react-icons/bs";

const LeftSideBar: React.FC = () => {
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  return (
    <div className="w-[248px] h-full bg-green rounded-[10px] px-12 flex-col flex justify-between py-16 gap-16">
      <div className="text-white  text-bold text-xl">CACSA APP</div>
      <div className="flex flex-col text-xl gap-4 h-full">
        <Link className="" href="/">
          Dashboard
        </Link>
        <div className="border-b border-black w-[150px] "></div>
        {/* <Link className="" href="/"> */}
        {/* </Link> */}
        <Link
          className="flex justify-between hover:bg-light-white rounded-md mt-2"
          href={""}
        >
          Audio
          {/* <BsChevronDown
            className={`${subMenuOpen && "rotate-180"}`}
            onClick={() => {
              setSubMenuOpen(!subMenuOpen);
            }}
          /> */}
        </Link>
        {/* {subMenuOpen && (
          <ul>
            <li className="px-5 mt-2">All Audio</li>
            <li className="px-5 mt-2">Add Audio</li>
          </ul>
        )} */}

        <Link className="" href="/location">
          Locations
        </Link>
      </div>
      <Link
        className="text-black  text-bold text-lg cursor-pointer hover:text-white"
        href={""}
        onClick={() => signOut()}
      >
        Logout
      </Link>
    </div>
  );
};

export default LeftSideBar;
