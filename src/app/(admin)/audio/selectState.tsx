import React, { useState, useEffect } from "react";
import Select from "@/app/_components/Select"; // Update the path to the Select component
import useSWR from "swr";
import { API_ENDPOINTS } from "@/lib/endpoints";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SelectStateProps {
  value: number | null;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  id: string;
}

const SelectState: React.FC<SelectStateProps> = ({ onChange, id }) => {
  const { data, error, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}${API_ENDPOINTS.STATES}`,
    fetcher
  );

  if (!data) {
    return null;
  }
  console.log(data.states);
  return (
    <div>
      <Select
        id={id}
        options={data.states}
        valueKey="id"
        placeholder="---Select State---"
        labelKey="state_name"
        onChange={onChange}
      />
    </div>
  );
};

export default SelectState;
