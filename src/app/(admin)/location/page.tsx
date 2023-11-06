"use client";
import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import React, { FormEvent, useEffect, useState } from "react";
import { PiChurch } from "react-icons/pi";
import { BiLocationPlus, BiSearch } from "react-icons/bi";

import Modal from "@/app/_components/Modal";
import {
  fetchAllBranches,
  saveLocations,
  deleteLocation,
  fetchAllStates,
  editLocation,
} from "@/lib/actions";
import SelectState from "./selectState";
import { AddLocationPayload } from "@/types";
import toast, { Toaster } from "react-hot-toast";

const Location = () => {
  const [openModal, setOpenModal] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMode, seteditingMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [stateMapping, setStateMapping] = useState<StateMapping>({});

  const handleClick = () => {
    setOpenModal(true);
  };

  const handleEditClick = () => {
    if (selectedRow !== null) {
      const selectedLocation = locations.find(
        (location) => location.id === selectedRow
      );
      console.log(selectedLocation);
      seteditingMode(true);
      setLocationInfo({
        name: selectedLocation?.name || "",
        stateId: selectedLocation?.state_id || null,
        address: selectedLocation?.address || "",
        type: selectedLocation?.type || "",
        website: selectedLocation?.website || "",
        longitude: selectedLocation?.location.x || 0,
        latitude: selectedLocation?.location.y || 0,
        phone: selectedLocation?.phone || "",
        isHQ: (selectedLocation?.is_HQ ? "true" : "false") || "false",
      });
      setOpenModal(true);
    }
  };
  const handleOnClose = () => {
    setOpenModal(false);
    seteditingMode(false);
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
        if (editingMode) {
          console.info("hello", locationInfo);
          const response = await editLocation(selectedRow!, locationInfo);
          console.log(response);
          if (response) {
            console.log("edited successfully");
            setLocationInfo(initialLocationInfo);
            // Show success toast
            setOpenModal(false);
            toast.success("Location details Edited successfully");
          } else {
            // Show error toast
          }
        } else {
          const response = await saveLocations(locationInfo);
          console.log(response);
          if (response) {
            console.log("Saved successfully");
            setLocationInfo(initialLocationInfo);
            // Show success toast
            // setOpenModal(false);
            toast.success("Location details saved successfully");
          } else {
            // Show error toast
          }
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
        console.log("my rensponse is: ", response);
        if (response == null) {
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
    location: {
      x: number;
      y: number;
    };
  }

  interface StateMapping {
    [key: number]: string;
  }

  //fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetchAllBranches();
        setLocations(response.branches);
        console.log(locations);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const fetchStates = async () => {
      try {
        const stateData = await fetchAllStates(); // Replace with your API call
        const mapping = stateData.states.reduce(
          (
            map: { [x: string]: any },
            state: { id: string | number; state_name: any }
          ) => {
            map[state.id] = state.state_name;
            return map;
          },
          {}
        );
        setStateMapping(mapping);
      } catch (error) {
        console.error("Error fetching state mapping data:", error);
      }
    };

    fetchStates();
    fetchLocations();
  }, []);

  const initialLocationInfo: AddLocationPayload = {
    name: "",
    stateId: null,
    address: "",
    type: "",
    website: "",
    longitude: null,
    latitude: null,
    phone: "",
    isHQ: "false",
  };
  const [locationInfo, setLocationInfo] =
    useState<AddLocationPayload>(initialLocationInfo);
  const [submitting, setSubmitting] = useState(false);

  //input change
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    console.log("target", event.target.value);
    const { id, value } = event.target;

    let updatedValue: string | number | null = null; // Default to null for invalid input

    // Check if id is 'stateId', 'longitude', or 'latitude', convert value to a number
    if (id === "stateId" || id === "longitude" || id === "latitude") {
      const floatValue = parseFloat(value);
      if (!isNaN(floatValue)) {
        updatedValue = floatValue;
      }
    } else {
      updatedValue = value; // For other fields, keep the provided value
    }

    setLocationInfo((prevLocationInfo) => ({
      ...prevLocationInfo,
      [id]: updatedValue,
    }));
  };

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
              <Button
                label={"Upload Location"}
                onClick={handleClick}
                className="bg-green text-sm "
              />
              <Button
                label={"Edit"}
                onClick={handleEditClick}
                className="bg-ca-grey"
              />
              <Button
                label={"Delete"}
                disabled={selectedRow == null}
                className="bg-red"
                onClick={handleDelete}
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
                      <td className=" p-2 ">
                        {stateMapping[location.state_id] || "Unknown State"}
                      </td>
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
          <div className="flex gap-2">
            <input
              type="number"
              id="longitude"
              placeholder="Longitude"
              className="input-modal"
              step="any"
              value={
                locationInfo.longitude === null ? "" : locationInfo.longitude
              }
              onChange={handleInputChange}
            />

            <input
              type="number"
              id="latitude"
              placeholder="Latitude"
              className="input-modal"
              step="any"
              value={
                locationInfo.latitude === null ? "" : locationInfo.latitude
              }
              onChange={handleInputChange}
            />
          </div>
          <div className="flex gap-2">
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
          </div>

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
            label={editingMode ? "Update Location" : "Save Location"}
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
