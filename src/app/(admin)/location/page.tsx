"use client";

import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import Modal from "@/app/_components/Modal";
import PaginationBar from "@/app/_components/PaginationBar";
import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PiChurch, PiMapPin, PiTrash } from "react-icons/pi";
import { BiLocationPlus, BiSearch } from "react-icons/bi";
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

const PAGE_SIZE = 10;

const CATEGORY_OPTIONS = ["All", "Higher Institution", "State Branch"] as const;

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

interface StateRow {
  id: number;
  state_name: string;
}

type StateMapping = Record<number, string>;

const LocationPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statesList, setStatesList] = useState<StateRow[]>([]);
  const [stateMapping, setStateMapping] = useState<StateMapping>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingMode, seteditingMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof CATEGORY_OPTIONS)[number]>("All");
  const [selectedStateId, setSelectedStateId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    try {
      const [branchRes, stateRes] = await Promise.all([
        fetchAllBranches(),
        fetchAllStates(),
      ]);
      const branches = (branchRes as { branches?: Location[] }).branches ?? [];
      setLocations(branches);
      const states = (stateRes as { states?: StateRow[] }).states ?? [];
      setStatesList(states);
      const mapping: StateMapping = {};
      for (const s of states) {
        mapping[Number(s.id)] = s.state_name;
      }
      setStateMapping(mapping);
    } catch (e) {
      console.error("Error loading locations/states:", e);
      toast.error("Could not load locations");
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [listRefreshKey, loadData]);

  const filteredByCategoryAndState = useMemo(() => {
    let list = locations;
    if (selectedCategory !== "All") {
      list = list.filter((l) => l.type === selectedCategory);
    }
    if (selectedStateId !== "all") {
      const sid = Number(selectedStateId);
      if (Number.isFinite(sid)) {
        list = list.filter((l) => l.state_id === sid);
      }
    }
    return list;
  }, [locations, selectedCategory, selectedStateId]);

  const searchFilteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredByCategoryAndState;
    return filteredByCategoryAndState.filter((loc) => {
      const stateName = stateMapping[loc.state_id] ?? "";
      const parts = [
        loc.name,
        loc.address,
        loc.type,
        stateName,
        loc.phone,
        loc.website ?? "",
      ];
      return parts.some((s) => String(s).toLowerCase().includes(q));
    });
  }, [filteredByCategoryAndState, searchQuery, stateMapping]);

  const paginatedLocations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return searchFilteredLocations.slice(start, start + PAGE_SIZE);
  }, [searchFilteredLocations, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStateId, listRefreshKey]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(searchFilteredLocations.length / PAGE_SIZE) || 1
    );
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [searchFilteredLocations.length]);

  useEffect(() => {
    if (selectedRow === null) return;
    if (!searchFilteredLocations.some((l) => l.id === selectedRow)) {
      setSelectedRow(null);
    }
  }, [searchFilteredLocations, selectedRow]);

  const stats = useMemo(() => {
    const total = locations.length;
    const higher = locations.filter((l) => l.type === "Higher Institution").length;
    const stateBranch = locations.filter((l) => l.type === "State Branch").length;
    return { total, higher, stateBranch };
  }, [locations]);

  const handleClick = () => {
    seteditingMode(false);
    setLocationInfo(initialLocationInfo);
    setOpenModal(true);
  };

  const handleEditClick = () => {
    if (selectedRow === null) return;
    const selectedLocation = locations.find((loc) => loc.id === selectedRow);
    if (!selectedLocation) return;
    seteditingMode(true);
    setLocationInfo({
      name: selectedLocation.name || "",
      stateId: selectedLocation.state_id ?? null,
      address: selectedLocation.address || "",
      type: selectedLocation.type || "",
      website: selectedLocation.website || "",
      longitude: selectedLocation.location?.x ?? null,
      latitude: selectedLocation.location?.y ?? null,
      phone: selectedLocation.phone || "",
      isHQ: selectedLocation.is_HQ ? "true" : "false",
    });
    setOpenModal(true);
  };

  const handleOnClose = () => {
    setOpenModal(false);
    seteditingMode(false);
  };

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

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (
      locationInfo.address === "" ||
      locationInfo.name === "" ||
      locationInfo.isHQ === "" ||
      locationInfo.phone === "" ||
      locationInfo.type === "" ||
      locationInfo.stateId == null
    ) {
      toast.error("Please check that all fields are filled");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingMode && selectedRow != null) {
        await editLocation(selectedRow, locationInfo);
        toast.success("Location details updated successfully");
        setOpenModal(false);
        setLocationInfo(initialLocationInfo);
        setListRefreshKey((k) => k + 1);
      } else {
        await saveLocations(locationInfo);
        toast.success("Location details saved successfully");
        setLocationInfo(initialLocationInfo);
        setOpenModal(false);
        setListRefreshKey((k) => k + 1);
      }
    } catch {
      toast.error("There is an error saving location");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (selectedRow === null) return;
    if (!confirm("Delete this location?")) return;
    setIsDeleting(true);
    try {
      await deleteLocation(selectedRow);
      toast.success("Deleted successfully");
      setSelectedRow(null);
      setListRefreshKey((k) => k + 1);
    } catch {
      toast.error("Could not delete location");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { id, value } = event.target;
    let updatedValue: string | number | null = null;
    if (id === "stateId" || id === "longitude" || id === "latitude") {
      const floatValue = parseFloat(value);
      updatedValue = !Number.isNaN(floatValue) ? floatValue : null;
    } else {
      updatedValue = value;
    }
    setLocationInfo((prev) => ({
      ...prev,
      [id]: updatedValue,
    }));
  };

  return (
    <div className="flex h-full flex-col gap-8 w-full overflow-hidden text-white">
      <Toaster />
      <div className="flex flex-wrap gap-4">
        <Card>
          <div className="w-[190px] h-[137px] flex flex-row text-3xl items-center justify-center gap-5">
            <span className="text-yellow">
              <PiChurch className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>{stats.total}</span>
              <span className="text-base font-medium">Locations</span>
            </span>
          </div>
        </Card>
        <Card>
          <div className="w-[190px] h-[137px] flex flex-row text-3xl items-center justify-center gap-5">
            <span className="text-yellow">
              <PiChurch className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>{stats.higher}</span>
              <span className="text-base font-medium">Higher ed.</span>
            </span>
          </div>
        </Card>
        <Card>
          <div className="w-[190px] h-[137px] flex flex-row text-3xl items-center justify-center gap-5">
            <span className="text-yellow">
              <PiChurch className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>{stats.stateBranch}</span>
              <span className="text-base font-medium">State branches</span>
            </span>
          </div>
        </Card>
      </div>

      <div className="w-full h-full min-h-0 flex-1 py-2">
        <Card>
          <div className="p-6 sm:p-12 w-full h-full overflow-hidden flex flex-col min-h-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center w-full gap-y-3">
              <span className="relative top-icons flex min-w-0 flex-1 lg:min-w-[min(100%,280px)]">
                <span className="absolute inset-0 flex items-center left-6 w-min pointer-events-none">
                  <BiSearch className="h-5 w-5" />
                </span>
                <input
                  className="appearance-none bg-transparent w-full min-h-[2.75rem] pl-10 pr-3 py-2.5 rounded-md border border-white/20 focus:border-green focus:outline-none cursor-text"
                  type="search"
                  placeholder="Search name, address, city/state, category…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </span>

              <label className="flex items-center gap-2 text-sm text-white/80 shrink-0">
                <span className="text-white/50 whitespace-nowrap">Type</span>
                <select
                  className="bg-ca-grey text-sm rounded-md px-3 py-2 text-white border border-white/10 min-w-[10rem] min-h-[2.5rem] cursor-pointer"
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(
                      e.target.value as (typeof CATEGORY_OPTIONS)[number]
                    )
                  }
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c === "All" ? "All types" : c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-white/80 shrink-0">
                <span className="text-white/50 whitespace-nowrap">State</span>
                <select
                  className="bg-ca-grey text-sm rounded-md px-3 py-2 text-white border border-white/10 min-w-[10rem] min-h-[2.5rem] cursor-pointer"
                  value={selectedStateId}
                  onChange={(e) => setSelectedStateId(e.target.value)}
                >
                  <option value="all">All states</option>
                  {statesList.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.state_name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={handleClick}
                className="bg-green text-sm flex items-center p-2 rounded-md cursor-pointer shrink-0 text-white"
              >
                <BiLocationPlus className="h-5 w-10" />
                Add location
              </button>
              <button
                type="button"
                onClick={handleEditClick}
                disabled={selectedRow === null}
                title={
                  selectedRow === null
                    ? "Select a row in the table"
                    : "Edit selected location"
                }
                className={`text-sm flex items-center p-2 w-24 rounded-md shrink-0 ${
                  selectedRow === null
                    ? "bg-ca-grey opacity-40 cursor-not-allowed"
                    : "bg-ca-grey hover:bg-green cursor-pointer"
                }`}
              >
                <PiMapPin className="h-5 w-10" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={selectedRow === null || isDeleting}
                title={
                  selectedRow === null
                    ? "Select a row in the table"
                    : "Delete selected location"
                }
                className={`text-sm flex items-center gap-1.5 px-2 py-2 rounded-md shrink-0 ${
                  selectedRow === null
                    ? "bg-ca-grey opacity-40 cursor-not-allowed"
                    : "bg-ca-grey hover:bg-red cursor-pointer"
                }`}
              >
                <PiTrash className="h-5 w-5 shrink-0" />
                <span>Delete</span>
              </button>
            </div>

            <div className="w-full max-h-full overflow-x-auto mt-7">
              <table className="py-3 mb-4 table-auto w-full min-w-[640px]">
                <thead className="bg-green">
                  <tr className="text-left">
                    <th className="p-2">Name</th>
                    <th className="p-2">Address</th>
                    <th className="p-2">State</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLocations.map((location) => (
                    <tr
                      key={location.id}
                      className={`w-full cursor-pointer select-none transition-colors duration-150 ease-out ${
                        selectedRow === location.id
                          ? "bg-green/15 border-l-4 border-green shadow-[inset_0_0_0_1px_rgba(0,165,81,0.35)]"
                          : "border-l-4 border-transparent hover:bg-white/[0.06]"
                      }`}
                      onClick={() => setSelectedRow(location.id)}
                    >
                      <td className="p-2 max-w-[200px] truncate">{location.name}</td>
                      <td className="p-2 max-w-[280px] truncate">{location.address}</td>
                      <td className="p-2">
                        {stateMapping[location.state_id] || "—"}
                      </td>
                      <td className="p-2">{location.type ?? "—"}</td>
                      <td className="p-2 max-w-[140px] truncate">{location.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationBar
              page={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={searchFilteredLocations.length}
              onPageChange={setCurrentPage}
              className="mt-4 pt-4 border-t border-white/10"
            />
          </div>
        </Card>
      </div>

      <Modal
        isOpen={openModal}
        onClose={handleOnClose}
        shellClassName="relative w-[702px] max-w-[min(702px,calc(100vw-2rem))] h-auto"
        bodyClassName="modal-content relative bg-black px-14 py-6 sm:px-16 md:px-20 rounded-lg max-h-[calc(100vh-4rem)] overflow-y-auto shadow-lg"
        cardClassName="h-auto min-h-0"
      >
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
    </div>
  );
};

export default LocationPage;
