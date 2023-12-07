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
// import { AddLocationPayload } from "@/types";
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
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault(); // Prevent default form submission behavior

    // Start submitting
    // console.log(audioInfo);
    // if (
    //   audioInfo.address == "" ||
    //   audioInfo.name == "" ||
    //   audioInfo.isHQ == "" ||
    //   audioInfo.phone == "" ||
    //   audioInfo.type == "" ||
    //   audioInfo.stateId == null
    // ) {
    //   toast.error("Please check that all fields are filled");
    // } else {
    //   setIsSubmitting(true);
    //   try {
    //     const response = await saveLocations(audioInfo);
    //     if (response.status === "success") {
    //       console.log("Saved successfully");
    //       setaudioInfo(initialaudioInfo);
    //       // Show success toast
    //       setOpenModal(false);
    //       toast.success("Location details saved successfully");
    //     } else {
    //       // Show error toast
    //     }
    //   } catch (error) {
    //     // Handle error and show error toast
    //     toast.error("There is an error saving location");
    //   } finally {
    //     setIsSubmitting(false); // End submitting, whether success or error
      // }
    }

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
                <Link href="" onClick={handleClick}>Upload Location</Link>
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
    </div>
  );
};

export default Location;