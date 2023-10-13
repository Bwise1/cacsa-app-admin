"use client";
import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import React, { FormEvent, useEffect, useState } from "react";
import { PiChurch } from "react-icons/pi";
import { BiLocationPlus, BiSearch } from "react-icons/bi";

import Modal from "@/app/_components/Modal";
import { fetchAllBranches, saveLocations, deleteLocation } from "@/lib/actions";
import SelectState from "./selectState";
import { AddLocationPayload } from "@/types";
import toast, { Toaster } from "react-hot-toast";

const Location = () => {
  const [openModal, setOpenModal] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const handleClick = () => {
    setOpenModal(true);
  };
  const handleOnClose = () => {
    setOpenModal(false);
  };
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault(); // Prevent default form submission behavior

    // Start submitting
    console.log(locationInfo);
    if (
      locationInfo.address == "" ||
      locationInfo.name == "" ||
      locationInfo.isHQ == "" ||
      locationInfo.phone == "" ||
      locationInfo.type == "" ||
      locationInfo.stateId == null
    ) {
      toast.error("Please check that all fields are filled");
    } else {
      setIsSubmitting(true);
      try {
        const response = await saveLocations(locationInfo);
        if (response.status === "success") {
          console.log("Saved successfully");
          setLocationInfo(initialLocationInfo);
          // Show success toast
          setOpenModal(false);
          toast.success("Location details saved successfully");
        } else {
          // Show error toast
        }
      } catch (error) {
        // Handle error and show error toast
        toast.error("There is an error saving location");
      } finally {
        setIsSubmitting(false); // End submitting, whether success or error
      }
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedRow !== null) {
        const response = await deleteLocation(selectedRow);
        console.log(response);
        if (response == 204) {
          toast.success("deleted successfully");
          const updatedLocations = locations.filter(
            (location) => location.id !== selectedRow
          );
          setLocations(updatedLocations);
        }
      }
    } catch {}
  };
  interface Location {
    id: number;
    name: string;
    state_id: number;
    address: string;
    type: string;
    website: string;
    phone: string;
    is_HQ: number;
  }

  //fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetchAllBranches();
        console.log(response.branches);
        setLocations(response.branches);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchLocations();
  }, []);

  const initialLocationInfo: AddLocationPayload = {
    name: "",
    stateId: null,
    address: "",
    type: "",
    website: "",
    phone: "",
    isHQ: "false",
  };
  const [locationInfo, setLocationInfo] =
    useState<AddLocationPayload>(initialLocationInfo);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    console.log("target", event.target.value);
    const { id, value } = event.target;

    let updatedValue: string | number | boolean = value; // Default to the provided value

    // Check if id is 'state_id', convert value to a number
    if (id === "stateId") {
      updatedValue = parseFloat(value);
    }

    setLocationInfo((prevLocationInfo) => ({
      ...prevLocationInfo,
      [id]: updatedValue,
    }));
  };

  return (
    <div className="flex h-full  flex-col gap-8 w-full">
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
      <div className="w-full h-full">
        <Card>
          <div className="p-12 w-full   overflow-y-scroll no-scrollbar">
            <div className="flex gap-4 w-full">
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
              <Button
                label={"Upload Location"}
                onClick={handleClick}
                className="bg-green text-sm "
              />
              <Button
                label={"Edit"}
                onClick={() => {}}
                className="bg-ca-grey"
              />
              <Button
                label={"Delete"}
                disabled={selectedRow == null}
                className="bg-red"
                onClick={handleDelete}
              />
            </div>
            <div>
              <table className=" w-full ">
                <thead>
                  <tr className="text-left">
                    <th className=" p-2">Title</th>
                    <th className=" p-2">Address</th>
                    <th className=" p-2">State</th>
                    <th className=" p-2">Category</th>
                  </tr>
                </thead>
                <tbody>
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
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
      {/* End of Bottom Card */}

      {/* Start of Modal component(opens when you click upload)*/}
      <Modal isOpen={openModal} onClose={handleOnClose}>
        <form
          className="pt-10 w-full flex flex-col gap-6"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            id="name"
            placeholder="Name of Church"
            className="input-modal"
            onChange={handleInputChange}
            value={locationInfo.name}
          />
          {/* <input type="text" placeholder="State" className="input-modal" /> */}
          <SelectState
            value={locationInfo.stateId}
            id="stateId"
            onChange={handleInputChange}
          />
          <input
            type="text"
            id="address"
            placeholder="address"
            className="input-modal"
            onChange={handleInputChange}
            value={locationInfo.address}
          />
          <select
            id="type"
            className="input-modal"
            onChange={handleInputChange}
            value={locationInfo.type}
          >
            <option value="" disabled>
              ---Select branch type---
            </option>
            <option value="Higher Institution">Higher Institution</option>
            <option value="State Branch">State Branch</option>
          </select>

          <input
            type="text"
            id="website"
            placeholder="website"
            className="input-modal"
            value={locationInfo.website}
            onChange={handleInputChange}
          />

          <input
            type="text"
            id="phone"
            placeholder="phone"
            className="input-modal"
            value={locationInfo.phone}
            onChange={handleInputChange}
          />

          <select
            id="isHQ"
            className="input-modal"
            onChange={handleInputChange}
            value={locationInfo.isHQ}
          >
            <option value="" disabled>
              ---Select if it is HQ---
            </option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
          <Button
            label={"Save Location"}
            type="submit"
            icon={<BiLocationPlus className="w-4 h-4" />}
            className="bg-green text-sm w-44"
            isLoading={isSubmitting}
          />
        </form>
      </Modal>
      {/* End of Modal component(opens when you click upload)*/}
    </div>
  );
};

export default Location;
