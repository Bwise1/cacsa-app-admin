"use client";
import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import React, { FormEvent, useEffect, useState } from "react";
import {
  PiChurch,
  PiMusicNote,
  PiMusicNotes,
  PiMusicNotesSimpleBold,
  PiPlayLight,
  PiSlidersHorizontal,
} from "react-icons/pi";
import { CiMicrophoneOn } from "react-icons/ci";
import { BiLocationPlus, BiSearch } from "react-icons/bi";

import Modal from "@/app/_components/Modal";
import {
  fetchAllAudio,
  fetchAllCategories,
  fetchAudioStats,
  saveAudioDetails,
} from "@/lib/actions";
// import SelectState from "./selectState";
import { AddAudioPayload } from "@/types";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

import AudioUpload from "@/app/dashboard/_components/AudioUpload";

const Audio = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openSortModal, setOpenSortModal] = useState(false);
  const [audios, setAudio] = useState<AudioInfo[]>([]);
  const [filteredAudios, setFilteredAudios] = useState<AudioInfo[]>(audios);
  const [category, setAudioCategory] = useState<Category[]>([]);
  const [audioStats, setAudioStats] = useState<AudioStats>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editingMode, seteditingMode] = useState(false);

  const handleClick = () => {
    setOpenModal(true);
  };

  const handleSortClick = () => {
    setOpenSortModal(true);
  };

  const handleOnClose = () => {
    setOpenModal(false);
  };

  //   const handleDelete = async () => {
  //     try {
  //       if (selectedRow !== null) {
  //         const response = await deleteLocation(selectedRow);
  //         console.log(response);
  //         if (response == 204) {
  //           toast.success("deleted successfully");
  //           const updatedAudios = audios.filter(
  //             (audio) => audio.title !== selectedRow
  //           );
  //           setAudio(updatedAudios);
  //         }
  //       }
  //     } catch {}
  //   };
  interface AudioInfo {
    id: number;
    title: string;
    description: string;
    artist: string;
    date: string;
    category_id: number;
    audio_url: string;
    thumbnail_url: string;
    duration: string;
    category: string;
  }
  interface Category {
    id: number;
    name: string;
    thumbnail: string;
  }

  interface AudioStats {
    total: number;
    sermon: number;
    podcast: number;
    music: number;
  }

  interface ApiResponse<T> {
    status: string;
    [key: string]: any;
  }

  useEffect(() => {
    const fetchAudios = async () => {
      try {
        // const response = await fetchAllAudio();
        // const catresponse = await fetchAllCategories();
        // const stats = await fetchAudioStats();
        const [response, catresponse, stats] = await Promise.all([
          fetchAllAudio(),
          fetchAllCategories(),
          fetchAudioStats(),
        ]);

        setAudio(response.audios);
        setFilteredAudios(response.audios);
        setAudioCategory(catresponse.categories);

        const audioStats: AudioStats = {
          total: stats.data.total,
          sermon: stats.data.stats[0].count,
          podcast: stats.data.stats[1].count,
          music: stats.data.stats[2].count,
        };
        setAudioStats(audioStats);

        console.log("Audio Stats:", audioStats);

        const getAudioCatId = audios.map((audio) => audio.category_id);
        const getCat = category.map((cat) => cat.id);

        // if (getCat) {
        //   for (let index = 0; index < getAudioCatId.length; index++) {
        //     if (getCat.includes(getAudioCatId[index])) {
        //       const audioElement = audios[index];
        //       const categoryElement = category.find((cat) => cat.id === getAudioCatId[index]);

        //       // Update the audioElement.category_id with categoryElement.name
        //       audioElement.category = categoryElement ? categoryElement.name : 'Unknown Category';
        //     }
        //   }
        // }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchAudios();
  }, []);

  const initialAudioInfo: AddAudioPayload = {
    title: "",
    description: "A brief audio discription",
    artist: "",
    date: Date.now().toLocaleString(),
    category_id: null,
    audio_url: "",
    thumbnail_url: "",
    duration: "",
  };

  const [AudioInfo, setAudioInfo] = useState<AddAudioPayload>(initialAudioInfo);

  // const initialAudioInfo:

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    };
    const formattedDate = new Date(dateString)
      .toLocaleDateString(undefined, options)
      .replace(/\//g, "-");
    return formattedDate;
  };

  const handleAudioFileChange = (audioUrl: string): void => {
    setAudioInfo((prevAudioInfo) => ({
      ...prevAudioInfo,
      audio_url: audioUrl,
    }));
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { id, value } = event.target;

    let updatedValue: string | number | null = null; // Default to null for invalid input

    // Check if id is 'stateId', 'longitude', or 'latitude', convert value to a number
    if (id === "category_id") {
      const floatValue = parseFloat(value);
      if (!isNaN(floatValue)) {
        updatedValue = floatValue;

        const selectedCategory = category.find(
          (item) => item.id === updatedValue
        );
        if (selectedCategory) {
          setAudioInfo((prevInfo) => ({
            ...prevInfo,
            thumbnail_url: selectedCategory.thumbnail,
          }));
        }
      }
    } else {
      updatedValue = value; // For other fields, keep the provided value
    }

    setAudioInfo((prevAudioInfo) => ({
      ...prevAudioInfo,
      [id]: updatedValue,
    }));
  };

  // const handleSave = async (e: React.FormEvent): Promise<void> => {
  //   e.preventDefault(); // Prevent form submission if this is called from a form
  //   setIsSubmitting(true);
  //   console.log("Saving AudioInfo:", AudioInfo);

  //   // Validation check for empty fields
  //   const emptyFields = Object.entries(AudioInfo).filter(
  //     ([key, value]) => value === ""
  //   );
  //   if (emptyFields.length > 0) {
  //     toast.error(
  //       `Please fill in the following fields: ${emptyFields
  //         .map(([key]) => key)
  //         .join(", ")}`
  //     );
  //     setIsSubmitting(false);
  //     return;
  //   }

  //   try {
  //     const response = await saveAudioDetails(AudioInfo);
  //     console.log("Save response:", response);

  //     if (response.status === "success") {
  //       console.log("Saved successfully");
  //       setAudioInfo(initialAudioInfo);
  //       toast.success("Audio details saved successfully");
  //       setTimeout(handleOnClose, 1500);
  //     } else {
  //       console.error("Error response:", response);
  //       toast.error(
  //         `Failed to save audio details: ${response.message || "Unknown error"}`
  //       );
  //     }
  //   } catch (error: any) {
  //     console.error("Error saving audio details:", error);
  //     toast.error(
  //       `Error saving audio details: ${error.message || "Unknown error"}`
  //     );
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault(); // Prevent form submission if this is called from a form
    setIsSubmitting(true);
    console.log("Saving AudioInfo:", AudioInfo);

    // Validation check for empty fields
    const emptyFields = Object.entries(AudioInfo).filter(
      ([key, value]) => value === ""
    );
    if (emptyFields.length > 0) {
      toast.error(
        `Please fill in the following fields: ${emptyFields
          .map(([key]) => key)
          .join(", ")}`
      );
      setIsSubmitting(false);
      return;
    }

    try {
      let response;

      if (editingMode) {
        // If editingMode is true, perform an update operation
        // response = await updateAudioDetails(AudioInfo);
        // console.log("Edit response:", response);
      } else {
        // Otherwise, perform a save operation
        response = await saveAudioDetails(AudioInfo);
        console.log("Save response:", response);
      }

      if (response.status === "success") {
        console.log(editingMode ? "Edited successfully" : "Saved successfully");
        setAudioInfo(initialAudioInfo);
        toast.success(
          editingMode
            ? "Audio details updated successfully"
            : "Audio details saved successfully"
        );
        setTimeout(handleOnClose, 1500);
      } else {
        console.error("Error response:", response);
        toast.error(
          `Failed to ${editingMode ? "update" : "save"} audio details: ${
            response.message || "Unknown error"
          }`
        );
      }
    } catch (error: any) {
      console.error(
        editingMode
          ? "Error updating audio details:"
          : "Error saving audio details:",
        error
      );
      toast.error(
        `Error ${editingMode ? "updating" : "saving"} audio details: ${
          error.message || "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setOpenSortModal(false);
    console.log(audios);
    console.log(category);
    if (categoryName === "All") {
      setFilteredAudios(audios);
    } else {
      const selectedCategoryId = category.find(
        (cat) => cat.name === categoryName
      )?.id;
      const filteredAudios = audios.filter(
        (audio) => audio.category_id === selectedCategoryId
      );
      setFilteredAudios(filteredAudios);
    }
  };

  const handleEditClick = () => {
    if (selectedRow !== null) {
      const selectedAudio = audios.find((audio) => audio.id === selectedRow);
      console.log(selectedAudio);

      seteditingMode(true);

      setAudioInfo({
        title: selectedAudio?.title || "",
        description: selectedAudio?.description || "",
        artist: selectedAudio?.artist || "",
        date: selectedAudio?.date || "",
        category_id: selectedAudio?.category_id || null,
        audio_url: selectedAudio?.audio_url || "",
        thumbnail_url: selectedAudio?.thumbnail_url || "",
        duration: selectedAudio?.duration || "",
      });
      setOpenModal(true);
    }
  };

  return (
    <div className="flex h-full  flex-col gap-8 w-full overflow-hidden ">
      <Toaster />
      {/* Start of Top Small Cards */}
      <div className="flex gap-4   ">
        <Card>
          <div className="w-[190px] h-[137px]  flex flex-row text-3xl items-center justify-center gap-5">
            <span className=" text-yellow">
              <PiMusicNote className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>{audioStats?.total} </span>
              <span className="text-base font-medium">Audios</span>
            </span>
          </div>
        </Card>
        <Card>
          <div className="w-[190px] h-[137px]  flex flex-row text-3xl items-center justify-center gap-5">
            <span className=" text-yellow">
              <PiMusicNotes className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>{audioStats?.sermon} </span>
              <span className="text-base font-medium">Sermons</span>
            </span>
          </div>
        </Card>
        <Card>
          <div className="w-[190px] h-[137px]  flex flex-row text-3xl items-center justify-center gap-5">
            <span className=" text-yellow">
              <CiMicrophoneOn className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>{audioStats?.podcast} </span>
              <span className="text-base font-medium">Podcasts</span>
            </span>
          </div>
        </Card>
        <Card>
          <div className="w-[190px] h-[137px]  flex flex-row text-3xl items-center justify-center gap-5">
            <span className=" text-yellow">
              <PiMusicNotesSimpleBold className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>{audioStats?.music} </span>
              <span className="text-base font-medium">Music</span>
            </span>
          </div>
        </Card>
        <Card>
          <div className="w-[190px] h-[137px]  flex flex-row text-3xl items-center justify-center gap-5">
            <span className=" text-yellow">
              <PiPlayLight className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>5000</span>
              <span className="text-base font-medium">Streams</span>
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

              {/* <span>All</span> */}
              {/* <Button
                label={"All"}
                onClick={handleClick}
                className="bg-green text-sm "
              /> */}
              {/* <Button
                label={"Upload Location"}
                onClick={handleClick}
                className="bg-green text-sm "
              /> */}
              <span
                className="bg-ca-grey text-sm flex items-center relative p-2 rounded-md w-24"
                onClick={() => setOpenSortModal(!openSortModal)}
              >
                <PiSlidersHorizontal className="h-5 w-10" />
                <Link href="" className="" onClick={handleSortClick}>
                  {selectedCategory}
                </Link>
                {openSortModal && (
                  <div className="absolute mt-2 w-48 bg-ca-grey rounded-md shadow-lg z-10 top-10">
                    <ul className="py-1">
                      {/* Use categories for dynamic approach, staticCategories for static approach */}

                      <li
                        className="block px-4 py-2 text-sm text-white hover:bg-green"
                        onClick={() => {
                          handleCategorySelect("All");
                        }}
                      >
                        All
                      </li>
                      {category.map((aCategory) => (
                        <li key={aCategory.id}>
                          <Link
                            href="#"
                            onClick={() => handleCategorySelect(aCategory.name)}
                            className="block px-4 py-2 text-sm text-white hover:bg-green"
                          >
                            {aCategory.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </span>
              <span className="bg-green text-sm flex items-center p-2 rounded-md">
                <PiMusicNotes className="h-5 w-10" />
                <Link href="" onClick={handleClick}>
                  Upload Audio
                </Link>
              </span>
              <button
                onClick={handleEditClick}
                className="bg-ca-grey text-sm flex items-center p-2 w-24 rounded-md hover:bg-green"
              >
                <PiMusicNote className="h-5 w-10" />
                Edit
              </button>

              {/* <Button
                label={"Edit"}
                onClick={() => {}}
                className="bg-ca-grey"
              /> */}
              {/* <Button
                label={"Delete"}
                disabled={selectedRow == null}
                className="bg-red"
                onClick={handleDelete}
                />
                <span>All</span> */}
            </div>

            <div className="w-full max-h-full overflow-y-scroll  mt-7 grid">
              <table className="py-3 mb-6 table-auto max-h-full">
                <thead className="bg-green">
                  <tr className="text-left">
                    <th className=" p-2">Title</th>
                    <th className=" p-2">Artist</th>
                    <th className=" p-2">Category</th>
                    <th className=" p-2">Date Uploaded</th>
                    <th className=" p-2">Streams Count</th>
                    <th className=" p-2">Duration</th>
                  </tr>
                </thead>
                <tbody className="">
                  {filteredAudios.map((audio) => (
                    <tr
                      key={audio.title}
                      className={`w-full ${
                        selectedRow === audio.id ? "bg-green" : ""
                      }`}
                      onClick={() => setSelectedRow(audio.id)}
                    >
                      <td className=" p-2">{audio.title}</td>
                      <td className="truncate p-2 flex">{audio.artist}</td>
                      <td className=" p-2">
                        {category.find((cat) => cat.id === audio.category_id)
                          ?.name || "Unknown Category"}
                      </td>
                      <td className=" p-2">{formatDate(audio.date)}</td>
                      <td className=" p-2">{audio.id}</td>
                      <td className=" p-2">{audio.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* <!-- component --> */}
          </div>
        </Card>
      </div>
      {/* End of Bottom Card */}

      {/* Start of Modal component(opens when you click upload)*/}
      <Modal isOpen={openModal} onClose={handleOnClose}>
        <form

        // onSubmit={handleSubmit}
        >
          <div className="pt-16 w-full flex items-center gap-3">
            <div>
              <input
                type="text"
                id="title"
                placeholder="Title"
                className="input-modal my-4 h-8"
                onChange={handleInputChange}
                value={AudioInfo.title}
              />

              <input
                type="text"
                id="artist"
                placeholder="Artist/Preacher"
                className="input-modal my-4 h-8"
                onChange={handleInputChange}
                value={AudioInfo.artist}
              />
              <div>
                <select
                  id="category_id"
                  className="input-modal"
                  onChange={handleInputChange}
                  value={AudioInfo.category_id ?? ""}
                >
                  <option value="" disabled>
                    ---select category---
                  </option>
                  {category.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                id="duration"
                placeholder="Duration"
                className="input-modal my-4 h-8"
                onChange={handleInputChange}
                value={AudioInfo.duration}
              />
            </div>
            <div>
              <AudioUpload onUploadResult={handleAudioFileChange} />
            </div>
          </div>
          <Button
            type="submit"
            label="Upload Audio"
            icon={<PiMusicNotes className="w-4 h-4" />}
            className="bg-green text-sm w-44"
            onClick={handleSave}
          />
        </form>
      </Modal>
      {/* End of Modal component(opens when you click upload)*/}
    </div>
  );
};

export default Audio;
