"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { ImSwitch } from "react-icons/im";
import { HiOutlineMusicNote } from "react-icons/hi";
import { BiLocationPlus } from "react-icons/bi";
import { MdOutlineAdminPanelSettings, MdOutlineEmail, MdOutlineShare } from "react-icons/md";
import { HiOutlineBell, HiOutlineMegaphone, HiOutlineUsers } from "react-icons/hi2";
import { TbLayoutDashboard } from "react-icons/tb";
import { PiCreditCard } from "react-icons/pi";

const iconClass = "h-[18px] w-[18px] shrink-0";

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const perms = session?.user?.permissions ?? [];
  const has = (p: string) => perms.includes(p);

  const navActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const linkClass = (href: string) =>
    `inline-flex w-full min-w-0 px-3 py-2 rounded-md items-center gap-3 text-sm leading-snug whitespace-nowrap ${
      navActive(href) ? "bg-green" : "hover:bg-green/50"
    }`;

  return (
    <div className="w-[220px] shrink-0 bg-ca-black h-full flex flex-col min-h-0 p-3">
      <div className="shrink-0 text-white text-base font-semibold tracking-tight px-1 pt-2 pb-2 mb-6">
        CACSA APP
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-1">
        {has("admin:analytics") && (
          <Link className={linkClass("/overview")} href="/overview">
            <TbLayoutDashboard className={iconClass} aria-hidden />
            <span>Overview</span>
          </Link>
        )}
        {has("audio:write") && (
          <Link className={linkClass("/audio")} href="/audio">
            <HiOutlineMusicNote className={iconClass} aria-hidden />
            <span>Audio</span>
          </Link>
        )}
        {has("branch:write") && (
          <Link className={linkClass("/location")} href="/location">
            <BiLocationPlus className={iconClass} aria-hidden />
            <span>Location</span>
          </Link>
        )}
        {has("user:read") && (
          <Link className={linkClass("/users")} href="/users">
            <HiOutlineUsers className={iconClass} aria-hidden />
            <span>App users</span>
          </Link>
        )}
        {has("ads:read") && (
          <Link className={linkClass("/ads")} href="/ads">
            <HiOutlineMegaphone className={iconClass} aria-hidden />
            <span>Adverts</span>
          </Link>
        )}
        {has("admin:analytics") && (
          <Link className={linkClass("/referrals")} href="/referrals">
            <MdOutlineShare className={iconClass} aria-hidden />
            <span>Referrals</span>
          </Link>
        )}
        {has("notifications:send") && (
          <Link className={linkClass("/notifications")} href="/notifications">
            <HiOutlineBell className={iconClass} aria-hidden />
            <span>Notifications</span>
          </Link>
        )}
        {has("admin:manage_plans") && (
          <Link className={linkClass("/plans")} href="/plans">
            <PiCreditCard className={iconClass} aria-hidden />
            <span>Plans</span>
          </Link>
        )}
        {has("admin:manage_roles") && (
          <Link className={linkClass("/roles")} href="/roles">
            <MdOutlineAdminPanelSettings className={iconClass} aria-hidden />
            <span>Roles</span>
          </Link>
        )}
        {has("admin:invite") && (
          <Link className={linkClass("/invites")} href="/invites">
            <MdOutlineEmail className={iconClass} aria-hidden />
            <span>Admin invites</span>
          </Link>
        )}
      </nav>

      <div className="shrink-0 border-t border-white/15 pt-3 mt-4">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-white cursor-pointer hover:text-green rounded-md hover:bg-white/5"
          onClick={() => void signOut({ callbackUrl: "/", redirect: true })}
        >
          <ImSwitch className="h-[18px] w-[18px] shrink-0" aria-hidden />
          <span className="whitespace-nowrap">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
