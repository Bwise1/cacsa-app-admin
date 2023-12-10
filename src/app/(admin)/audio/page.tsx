"use client";
import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import React, { FormEvent, useEffect, useState } from "react";
import { PiChurch, PiMusicNote, PiMusicNotes, PiMusicNotesSimpleBold, PiPlayLight, PiSlidersHorizontal  } from "react-icons/pi";
import { CiMicrophoneOn } from "react-icons/ci";
import { BiLocationPlus, BiSearch } from "react-icons/bi";

import Modal from "@/app/_components/Modal";
import { fetchAllAudio, fetchAllCategories } from "@/lib/actions";
// import SelectState from "./selectState";
import { AddAudioPayload } from "@/types";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

const Location = () => {
  const [openModal, setOpenModal] = useState(false);
  const [audios, setAudio] = useState<AudioInfo[]>([]);
  const [category, setAudioCategory] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  
  const handleClick = () => {
    setOpenModal(true);
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
    id:number
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
    id:number
    name:string
  };

  interface ApiResponse<T> {
    status: string;
    [key: string]: any;
  }

  // useEffect(() => {
  //   const fetchAudios = async () => {
  //     try {
  //       const response = await fetchAllAudio();
  //       const catresponse = await fetchAllCategories();
  //       // console.log(response.audios);
  //       console.log(catresponse.categories);
  //       setAudio(response.audios);
  //       setAudioCategory(catresponse.categories)

  //       // const getAudioCatId = audios.map((audio)=>audio.category_id);
  //       // const getCat = category.map((cat)=>cat.id);

  //       // if (getCat){
  //       //   console.log(getCat);
  //       // }

  //       // for (let index = 0; index < getAudioCatId.length; index++) {
  //       //   if (getCat == getAudioCatId[index]){
  //       //     const element = array[index];
  //       //   }
          
  //       // }

  //       const getAudioCatId = audios.map((audio) => audio.category_id);
  //       const getCat = category.map((cat) => cat.id);

  //       if (getCat) {
  //         console.log(getCat);
        
  //         for (let index = 0; index < getAudioCatId.length; index++) {
  //           if (getCat.includes(getAudioCatId[index])) {
  //             // Use the index to access the corresponding audio or category
  //             const audioElement = audios[index];
  //             const categoryElement = category.find((cat) => cat.id === getAudioCatId[index]);
        
  //             // Update the audioElement.category_id with categoryElement.name
  //             audioElement.category_id = categoryElement ? categoryElement.name : 'Unknown Category';
        
  //             // Do something with the updated audio element
  //             console.log("Corresponding audio:", audioElement);
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error fetching categories:", error);
  //     }
  //   };

  //   fetchAudios();
  // }, []);
  useEffect(() => {
    const fetchAudios = async () => {
      try {
        const response = await fetchAllAudio();
        const catresponse = await fetchAllCategories();
        console.log(response.audios);
        setAudio(response.audios);
        setAudioCategory(catresponse.categories);

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
    description: "",
    artist: "",
    date: "",
    category_id: null,
    audio_url: "",
    thumbnail_url: "",
  };

  const [AudioInfo, setAudioInfo] = useState<AddAudioPayload>(initialAudioInfo);

  // const initialAudioInfo: 

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: '2-digit' };
    const formattedDate = new Date(dateString).toLocaleDateString(undefined, options).replace(/\//g, '-');
    return formattedDate;
  };
  

  // const initialaudioInfo: AddLocationPayload = {
  //   name: "",
  //   stateId: null,
  //   address: "",
  //   type: "",
  //   website: "",
  //   phone: "",
  //   isHQ: "false",
  // };
  // const [audioInfo, setaudioInfo] =
  //   useState<AddLocationPayload>(initialaudioInfo);
  // const [submitting, setSubmitting] = useState(false);

  // const handleInputChange = (
  //   event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  // ): void => {
  //   console.log("target", event.target.value);
  //   const { id, value } = event.target;

  //   let updatedValue: string | number | boolean = value; // Default to the provided value

  //   // Check if id is 'state_id', convert value to a number
  //   if (id === "stateId") {
  //     updatedValue = parseFloat(value);
  //   }

  //   setaudioInfo((prevaudioInfo) => ({
  //     ...prevaudioInfo,
  //     [id]: updatedValue,
  //   }));
  // };

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
              <span>250</span>
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
              <span>150</span>
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
              <span>25</span>
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
              <span>50</span>
              <span className="text-base font-medium">Music</span>
            </span>
          </div>
        </Card>
        <Card>
          <div className="w-[190px] h-[137px]  flex flex-row text-3xl items-center justify-center gap-5">
            <span className=" text-yellow">
              <PiPlayLight  className="h-10 w-10" />
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
              <span className="bg-ca-grey text-sm flex items-center p-2 rounded-md w-24">
                <PiSlidersHorizontal className="h-5 w-10" />
                <Link href="" onClick={handleClick}>All</Link>
              </span>
              <span className="bg-green text-sm flex items-center p-2 rounded-md">
                <PiMusicNotes className="h-5 w-10" />
                <Link href="" onClick={handleClick}>Upload Audio</Link>
              </span>
              <span className="bg-ca-grey text-sm flex items-center p-2 w-24 rounded-md">
                <PiMusicNote className="h-5 w-10" />
                <Link className="" href="" onClick={handleClick}>Edit</Link>
              </span>
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
                  {audios.map((audio) => (
                    <tr
                      key={audio.title}
                    //   className={`w-full ${
                    //     selectedRow === audio.category_id ? "bg-green" : ""
                    //   }`}
                      onClick={() => setSelectedRow(audio.category_id)}
                    >
                      <td className=" p-2">{audio.title}</td>
                      <td className="truncate p-2 flex">{audio.artist}</td>
                      <td className=" p-2">{category.find((cat) => cat.id === audio.category_id)?.name || 'Unknown Category'}</td>
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
          className="pt-16 w-full flex items-center gap-3"
          // onSubmit={handleSubmit}
        >
          <div className="">
            <input type="text"
              id="name"
              placeholder="Title"
              className="input-modal my-4 h-8"
              // onChange={handleInputChange}
              value={AudioInfo.title}
            />
            <input type="text"
              id="name"
              placeholder="Music description"
              className="input-modal my-4 h-8"
              // onChange={handleInputChange}
              value={AudioInfo.description}
            />
            <input type="text" id="address" placeholder="Artist/Preacher" className="input-modal my-4 h-8"
              // onChange={handleInputChange}
              value={AudioInfo.artist}
            />
            <input type="text"
              id="address"
              placeholder="Duration"
              className="input-modal my-4 h-8"
              // onChange={handleInputChange}
              value={AudioInfo.artist}
            />
            <Button type="submit" label="Upload Audio"
              icon={<PiMusicNotes className="w-4 h-4" />}
              className="bg-green text-sm w-44"
            />
          </div>
          <div>
            <input type="file"
              id="address"
              placeholder="Upload Thumbnail"
              className="input-modal"
              // onChange={handleInputChange}
              value={AudioInfo.artist}
            />
          </div>
          {/* <input type="text" placeholder="State" className="input-modal" /> */}
          {/* <SelectState
            value={locationInfo.stateId}
            id="stateId"
            onChange={handleInputChange}
          /> */}
          
          {/* <select
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
          /> */}
        </form>
      </Modal>
      {/* End of Modal component(opens when you click upload)*/}
    </div>
  );
};

export default Location;