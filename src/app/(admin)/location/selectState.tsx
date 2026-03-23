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

const SelectState: React.FC<SelectStateProps> = ({ onChange, id, value }) => {
  const { data } = useSWR(
    `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}${API_ENDPOINTS.STATES}`,
    fetcher
  );

  if (!data?.states) {
    return null;
  }
  const v = value == null ? "" : String(value);
  return (
    <div>
      <Select
        id={id}
        name={id}
        value={v}
        options={[
          { id: "", state_name: "---Select State---", isDisabled: true },
          ...data.states,
        ]}
        valueKey="id"
        labelKey="state_name"
        onChange={onChange}
      />
    </div>
  );
};

export default SelectState;
