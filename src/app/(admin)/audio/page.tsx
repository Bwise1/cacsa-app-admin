"use client";
import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import React, {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  PiChurch,
  PiMusicNote,
  PiMusicNotes,
  PiMusicNotesSimpleBold,
  PiPlayLight,
  PiSlidersHorizontal,
  PiTrash,
} from "react-icons/pi";
import { CiMicrophoneOn } from "react-icons/ci";
import { BiLocationPlus, BiSearch } from "react-icons/bi";

import Modal from "@/app/_components/Modal";
import {
  deleteAudio,
  fetchAllAudio,
  fetchAllCategories,
  fetchAudioStats,
  saveAudioDetails,
  updateAudioDetails,
} from "@/lib/actions";
// import SelectState from "./selectState";
import { AddAudioPayload } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";

import AudioUpload from "@/app/dashboard/_components/AudioUpload";
import PaginationBar from "@/app/_components/PaginationBar";

const PAGE_SIZE = 10;

function formatAudioDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  };
  return new Date(dateString)
    .toLocaleDateString(undefined, options)
    .replace(/\//g, "-");
}

/** MySQL DATE / API: YYYY-MM-DD. Never use `Date.now().toLocaleString()` — that formats the ms count, not a calendar date. */
function todayMysqlDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const Audio = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openSortModal, setOpenSortModal] = useState(false);
  const [audios, setAudio] = useState<AudioInfo[]>([]);
  const [filteredAudios, setFilteredAudios] = useState<AudioInfo[]>(audios);
  const [category, setAudioCategory] = useState<Category[]>([]);
  const [audioStats, setAudioStats] = useState<AudioStats>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editingMode, seteditingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadSlotKey, setUploadSlotKey] = useState(0);
  const [durationPreview, setDurationPreview] = useState("");
  const [audioUploadBusy, setAudioUploadBusy] = useState(false);

  const handleSortClick = () => {
    setOpenSortModal(true);
  };

  const handleOnClose = () => {
    setOpenModal(false);
    seteditingMode(false);
    setDurationPreview("");
    setAudioUploadBusy(false);
    setUploadSlotKey((k) => k + 1);
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
    play_count?: number;
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
    totalStreams: number;
  }

  interface ApiResponse<T> {
    status: string;
    [key: string]: any;
  }

  useEffect(() => {
    const fetchAudios = async () => {
      try {
        const [response, catresponse, stats] = await Promise.all([
          fetchAllAudio(),
          fetchAllCategories(),
          fetchAudioStats(),
        ]);

        setAudio(response.audios);
        setAudioCategory(catresponse.categories);

        const nextStats: AudioStats = {
          total: stats.data.total,
          sermon: stats.data.stats[0].count,
          podcast: stats.data.stats[1].count,
          music: stats.data.stats[2].count,
          totalStreams: Number(stats.data.totalStreams ?? 0),
        };
        setAudioStats(nextStats);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchAudios();
  }, [listRefreshKey]);

  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredAudios(audios);
    } else {
      const selectedCategoryId = category.find(
        (cat) => cat.name === selectedCategory
      )?.id;
      setFilteredAudios(
        selectedCategoryId == null
          ? audios
          : audios.filter((a) => a.category_id === selectedCategoryId)
      );
    }
  }, [audios, selectedCategory, category]);

  const searchFilteredAudios = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredAudios;
    return filteredAudios.filter((audio) => {
      const catName =
        category.find((c) => c.id === audio.category_id)?.name ?? "";
      const dateStr = formatAudioDate(audio.date);
      const parts = [
        audio.title,
        audio.artist,
        catName,
        dateStr,
        String(audio.play_count ?? ""),
        audio.duration ?? "",
      ];
      return parts.some((s) => String(s).toLowerCase().includes(q));
    });
  }, [filteredAudios, searchQuery, category]);

  const paginatedAudios = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return searchFilteredAudios.slice(start, start + PAGE_SIZE);
  }, [searchFilteredAudios, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, listRefreshKey]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(searchFilteredAudios.length / PAGE_SIZE) || 1
    );
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [searchFilteredAudios.length]);

  useEffect(() => {
    if (selectedRow === null) return;
    if (!searchFilteredAudios.some((a) => a.id === selectedRow)) {
      setSelectedRow(null);
    }
  }, [searchFilteredAudios, selectedRow]);

  const initialAudioInfo: AddAudioPayload = {
    title: "",
    description: "A brief audio discription",
    artist: "",
    date: todayMysqlDate(),
    category_id: null,
    audio_url: "",
    thumbnail_url: "",
  };

  const [AudioInfo, setAudioInfo] = useState<AddAudioPayload>(initialAudioInfo);

  /** Save only: upload can happen anytime; S3 returns URL independently of other fields. */
  const canSubmitAudio = useMemo(() => {
    return (
      AudioInfo.title.trim() !== "" &&
      AudioInfo.artist.trim() !== "" &&
      AudioInfo.date !== "" &&
      AudioInfo.category_id != null &&
      AudioInfo.audio_url.trim() !== "" &&
      AudioInfo.thumbnail_url.trim() !== ""
    );
  }, [
    AudioInfo.title,
    AudioInfo.artist,
    AudioInfo.date,
    AudioInfo.category_id,
    AudioInfo.audio_url,
    AudioInfo.thumbnail_url,
  ]);

  const durationFieldValue = useMemo(() => {
    if (durationPreview) return durationPreview;
    if (audioUploadBusy) return "Uploading…";
    if (AudioInfo.audio_url) return "—";
    return "Upload audio to detect";
  }, [durationPreview, audioUploadBusy, AudioInfo.audio_url]);

  const handleClick = () => {
    seteditingMode(false);
    setAudioInfo({
      title: "",
      description: "A brief audio discription",
      artist: "",
      date: todayMysqlDate(),
      category_id: null,
      audio_url: "",
      thumbnail_url: "",
    });
    setDurationPreview("");
    setUploadSlotKey((k) => k + 1);
    setOpenModal(true);
  };

  // const initialAudioInfo:

  const handleAudioFileChange = (audioUrl: string): void => {
    if (!audioUrl) {
      setDurationPreview("");
      setAudioInfo((prev) => ({
        ...prev,
        audio_url: "",
        duration: undefined,
      }));
      return;
    }
    setAudioInfo((prev) => ({
      ...prev,
      audio_url: audioUrl,
    }));
  };

  const handleDurationDetected = (label: string) => {
    setDurationPreview(label);
    setAudioInfo((prev) => ({
      ...prev,
      duration: label || undefined,
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

    if (!canSubmitAudio) {
      toast.error(
        "Fill in title, artist, date, category (for thumbnail), and ensure an audio file is uploaded before saving."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      let response;

      if (editingMode && selectedRow !== null) {
        response = await updateAudioDetails(selectedRow, AudioInfo);
      } else {
        response = await saveAudioDetails(AudioInfo);
      }

      if (response.status === "success") {
        console.log(editingMode ? "Edited successfully" : "Saved successfully");
        setAudioInfo(initialAudioInfo);
        setDurationPreview("");
        setListRefreshKey((k) => k + 1);
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
            (response as { message?: string }).message || "Unknown error"
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
  };

  const handleDelete = async () => {
    if (selectedRow === null || isDeleting) return;
    const selected = audios.find((a) => a.id === selectedRow);
    const label = selected?.title?.trim() || "this track";
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await deleteAudio(selectedRow);
      if (res.status === "success") {
        toast.success("Audio deleted");
        setSelectedRow(null);
        setListRefreshKey((k) => k + 1);
      } else {
        toast.error(res.message || "Could not delete audio");
      }
    } catch {
      toast.error("Could not delete audio");
    } finally {
      setIsDeleting(false);
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
        duration: selectedAudio?.duration,
      });
      setDurationPreview(selectedAudio?.duration || "");
      setUploadSlotKey((k) => k + 1);
      setOpenModal(true);
    }
  };

  return (
    <div className="flex h-full  flex-col gap-8 w-full overflow-hidden ">
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
              <span>{audioStats?.totalStreams ?? 0}</span>
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
                  id="audio-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, artist, category…"
                  autoComplete="off"
                  className="appearance-none bg-transparent w-full min-h-[2.75rem] pl-10 pr-3 py-2.5 rounded-md border border-white/20 focus:border-green focus:outline-none cursor-text"
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
                className="bg-ca-grey text-sm flex items-center relative p-2 rounded-md w-24 cursor-pointer"
                onClick={() => setOpenSortModal(!openSortModal)}
              >
                <PiSlidersHorizontal className="h-5 w-10" />
                <Link
                  href=""
                  className="cursor-pointer"
                  onClick={handleSortClick}
                >
                  {selectedCategory}
                </Link>
                {openSortModal && (
                  <div className="absolute mt-2 w-48 bg-ca-grey rounded-md shadow-lg z-10 top-10">
                    <ul className="py-1">
                      {/* Use categories for dynamic approach, staticCategories for static approach */}

                      <li
                        className="block px-4 py-2 text-sm text-white hover:bg-green cursor-pointer"
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
                            className="block px-4 py-2 text-sm text-white hover:bg-green cursor-pointer"
                          >
                            {aCategory.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </span>
              <span className="bg-green text-sm flex items-center p-2 rounded-md cursor-pointer">
                <PiMusicNotes className="h-5 w-10" />
                <Link href="" onClick={handleClick} className="cursor-pointer">
                  Upload Audio
                </Link>
              </span>
              <button
                type="button"
                onClick={handleEditClick}
                disabled={selectedRow === null}
                title={
                  selectedRow === null
                    ? "Select a row in the table"
                    : "Edit selected audio"
                }
                className={`text-sm flex items-center p-2 w-24 rounded-md ${
                  selectedRow === null
                    ? "bg-ca-grey opacity-40 cursor-not-allowed"
                    : "bg-ca-grey hover:bg-green cursor-pointer"
                }`}
              >
                <PiMusicNote className="h-5 w-10" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={selectedRow === null || isDeleting}
                title={
                  selectedRow === null
                    ? "Select a row in the table"
                    : "Delete selected audio"
                }
                className={`text-sm flex items-center gap-1.5 px-2 py-2 rounded-md ${
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
                    <th className=" p-2">Title</th>
                    <th className=" p-2">Artist</th>
                    <th className=" p-2">Category</th>
                    <th className=" p-2">Date Uploaded</th>
                    <th className=" p-2">Streams Count</th>
                    <th className=" p-2">Duration</th>
                  </tr>
                </thead>
                <tbody className="">
                  {paginatedAudios.map((audio) => (
                    <tr
                      key={audio.id}
                      className={`w-full cursor-pointer select-none transition-colors duration-150 ease-out ${
                        selectedRow === audio.id
                          ? "bg-green/15 border-l-4 border-green shadow-[inset_0_0_0_1px_rgba(0,165,81,0.35)]"
                          : "border-l-4 border-transparent hover:bg-white/[0.06]"
                      }`}
                      onClick={() => setSelectedRow(audio.id)}
                    >
                      <td className=" p-2">{audio.title}</td>
                      <td className="truncate p-2 flex">{audio.artist}</td>
                      <td className=" p-2">
                        {category.find((cat) => cat.id === audio.category_id)
                          ?.name || "Unknown Category"}
                      </td>
                      <td className=" p-2">{formatAudioDate(audio.date)}</td>
                      <td className=" p-2">
                        {Number(audio.play_count ?? 0)}
                      </td>
                      <td className=" p-2">{audio.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar
              page={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={searchFilteredAudios.length}
              onPageChange={setCurrentPage}
              className="mt-4 pt-4 border-t border-white/10"
            />
            {/* <!-- component --> */}
          </div>
        </Card>
      </div>
      {/* End of Bottom Card */}

      {/* Start of Modal component(opens when you click upload)*/}
      <Modal
        isOpen={openModal}
        onClose={handleOnClose}
        shellClassName="relative w-[702px] max-w-[min(702px,calc(100vw-2rem))] h-auto"
        bodyClassName="modal-content relative bg-black px-14 py-6 sm:px-16 md:px-20 rounded-lg max-h-[calc(100vh-4rem)] overflow-y-auto shadow-lg"
        cardClassName="h-auto min-h-0"
      >
        <form>
          <div className="pt-10 flex flex-col">
            <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start w-full">
              <div className="flex-1 flex flex-col gap-3 w-full min-w-0 lg:max-w-[min(340px,100%)]">
                <input
                  type="text"
                  id="title"
                  placeholder="Title"
                  className="input-modal w-full"
                  onChange={handleInputChange}
                  value={AudioInfo.title}
                />

                <input
                  type="text"
                  id="artist"
                  placeholder="Artist/Preacher"
                  className="input-modal w-full"
                  onChange={handleInputChange}
                  value={AudioInfo.artist}
                />

                <div>
                  <select
                    id="category_id"
                    className="input-modal w-full"
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

                <div className="rounded-lg border border-white/15 bg-black/30 px-3 py-2">
                  <label
                    htmlFor="duration-readonly-modal"
                    className="block text-[11px] text-white/60 mb-1"
                  >
                    Duration (read only)
                  </label>
                  <input
                    id="duration-readonly-modal"
                    readOnly
                    tabIndex={-1}
                    value={durationFieldValue}
                    className="w-full rounded border border-white/20 bg-black/50 px-2 py-1.5 text-sm text-white/90 cursor-default"
                  />
                  <p className="text-[10px] text-white/45 mt-1 leading-snug">
                    From file after upload; saved with the record if blank here.
                  </p>
                </div>

                <div className="pt-1 flex justify-end lg:justify-start">
                  <Button
                    type="submit"
                    label={editingMode ? "Save changes" : "Save audio"}
                    icon={<PiMusicNotes className="w-4 h-4" />}
                    className="bg-green text-sm min-w-[11rem] disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={handleSave}
                    disabled={!canSubmitAudio || isSubmitting}
                  />
                </div>
              </div>

              <div className="flex-1 w-full min-w-0 flex flex-col">
                <AudioUpload
                  key={uploadSlotKey}
                  initialUrl={AudioInfo.audio_url || null}
                  onUploadResult={handleAudioFileChange}
                  onDurationDetected={handleDurationDetected}
                  onUploadingChange={setAudioUploadBusy}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
      {/* End of Modal component(opens when you click upload)*/}
    </div>
  );
};

export default Audio;
