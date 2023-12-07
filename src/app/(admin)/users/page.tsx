"use client";
import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import React, { FormEvent, useEffect, useState } from "react";
import { PiChurch } from "react-icons/pi";
import { BiLocationPlus, BiSearch } from "react-icons/bi";

import toast, { Toaster } from "react-hot-toast";

const Location = () => {
  const [openModal, setOpenModal] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  //get all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="flex h-full  flex-col gap-8 w-full overflow-hidden ">
      <Toaster />
      {/* Start of Top Small Cards */}
      <div className="flex gap-4   ">
        <Card>
          <div className="w-[190px] h-[137px]  flex flex-row text-3xl items-center justify-center gap-5">
            <span className=" text-yellow">
              <PiChurch className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>140</span>
              <span className="text-base font-medium">Churches</span>
            </span>
          </div>
        </Card>
        <Card>
          <div className="w-[190px] h-[137px]  flex flex-row text-3xl items-center justify-center gap-5">
            <span className=" text-yellow">
              <PiChurch className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>140</span>
              <span className="text-base font-medium">Churches</span>
            </span>
          </div>
        </Card>
        <Card>
          <div className="w-[190px] h-[137px]  flex flex-row text-3xl items-center justify-center gap-5">
            <span className=" text-yellow">
              <PiChurch className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>140</span>
              <span className="text-base font-medium">Churches</span>
            </span>
          </div>
        </Card>
      </div>
      {/* End of Top Small Cards */}

      {/* Start of Bottom Card */}
      <div className="w-full h-full py-2 ">
        <Card>
          <div className="p-12 w-full h-full overflow-hidden ">
            <div className="flex gap-4  w-full">
              <span className="relative top-icons w-2/5 flex">
                <span className="absolute inset-0 flex items-center left-6  w-min">
                  <BiSearch className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  placeholder="Search"
                  className="appearance-none bg-transparent"
                />
              </span>

              <span>All</span>
              <Button label={"Upload Location"} className="bg-green text-sm " />
              <Button
                label={"Edit"}
                onClick={() => {}}
                className="bg-ca-grey"
              />
              <Button
                label={"Delete"}
                disabled={selectedRow == null}
                className="bg-red"
              />
            </div>
            <div className="w-full h-full overflow-y-scroll mb-4  mt-7 grid">
              <table className="py-3 ">
                <thead>
                  <tr className="text-left">
                    <th className=" p-2">Title</th>
                    <th className=" p-2">Address</th>
                    <th className=" p-2">State</th>
                    <th className=" p-2">Category</th>
                  </tr>
                </thead>
                {/* <tbody>
                  {locations.map((location) => (
                    <tr
                      key={location.id}
                      className={`w-full ${
                        selectedRow === location.id ? "bg-green" : ""
                      }`}
                      onClick={() => setSelectedRow(location.id)}
                    >
                      <td className=" p-2">{location.name}</td>
                      <td className="truncate p-2 flex">{location.address}</td>
                      <td className=" p-2 ">{location.state_id}</td>
                      <td className=" p-2">{location.type}</td>
                    </tr>
                  ))}
                </tbody> */}
              </table>
            </div>
          </div>
        </Card>
      </div>
      {/* End of Bottom Card */}

      {/* End of Modal component(opens when you click upload)*/}
    </div>
  );
};

export default Location;
