"use client";
import React, { useState, useEffect } from "react";
import Select from "./Select"; // Update the path to the Select component
import { fetchAllCategories } from "@/lib/actions"; // Update the path
import { Category } from "@/types";

interface SelectCategoryProps {
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number) => void;
}

const SelectCategory: React.FC<SelectCategoryProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  //   const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
  //     null
  //   );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetchAllCategories();
        setCategories(response.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const categoryId = parseInt(event.target.value);
    // setSelectedCategoryId(categoryId);
    onCategoryChange(categoryId);
  };

  //   selectedCategory = categories.find(
  //     (category) => category.id === selectedCategoryId
  //   );

  return (
    <div>
      <Select
        options={categories}
        className="w-full p-6 bg-white rounded-[10px] border border-white"
        value={
          selectedCategory === null
            ? ""
            : selectedCategory === -1
            ? ""
            : selectedCategory.toString()
        }
        onChange={handleCategoryChange}
      />
      {/* Other content in your component */}
    </div>
  );
};

export default SelectCategory;
