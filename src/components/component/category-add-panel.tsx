"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Delete } from "lucide-react";
import { useEffect, useState } from "react";

export function CategoryAddPanel() {
  const [categoryTree, setCategoryTree] = useState([]) as any;
  const [loading, setLoading] = useState(true);

  const fetchcategory = async () => {
    setLoading(true);
    const res = await fetch("/api/category");
    const data = await res.json();
    setCategoryTree(data["categories"]);
    setLoading(false);
  };

  useEffect(() => {
    fetchcategory();
  }, []);
  const data = categoryTree;
  const [selectedcategory, setCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const handleAddSubCat = () => {
    console.log("Add Subcategory");
    alert("Add Subcategory");
  };

  function handleAddCategory() {
    const newCategoryName = "New Category";
    const payload = {
      name: newCategoryName,
    };

    fetch("/api/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        setCategoryTree(data.categories);
      })
      .catch((error) => {
        console.error("Error adding category:", error);
      });
  }

  return (
    <div className="category-panel surface mt-6 overflow-hidden">
      <div className="flex min-w-0 flex-col w-full px-4 py-6 border-r">
        <div className="space-y-2 p-2 overflow-auto">
          <div className="font-bold">Category</div>
          <Input placeholder="Name of category" />
          <Button onClick={() => handleAddSubCat()} className="hover:bg-primary/90">
            Add Category
          </Button>
          {!loading &&
            data.map((category: any) => {
              return (
                <div
                  key={category._id}
                  className={
                    `flex items-center justify-between hover:bg-gray-300 cursor-pointer p-2 rounded-lg transition-all` +
                    (category._id === selectedcategory ? "bg-gray-300" : "")
                  }
                  onClick={() => setCategory(category._id)}
                >
                  <span>{category.name}</span>
                  <Button size={"sm"} variant={`destructive`}>
                    <Delete />
                  </Button>
                </div>
              );
            })}
        </div>
      </div>
      <div className="flex min-w-0 flex-col w-full px-4 py-6 border-r">
        <div className="space-y-2 p-2 overflow-auto">
          <div className="font-bold">Subcategory</div>
          <Input placeholder="Name of subcategory" />
          <Button onClick={() => handleAddSubCat()} className="hover:bg-primary/90">
            Add Subcategory
          </Button>
          {data.map((category: any) => {
            if (category._id === selectedcategory) {
              return category.children.map((subcategory: any) => {
                return (
                  <div
                    key={subcategory._id}
                    className={
                      `flex items-center justify-between hover:bg-gray-300 cursor-pointer p-2 rounded-lg transition-all` +
                      (subcategory._id === selectedSubCategory
                        ? " bg-gray-300"
                        : "")
                    }
                    onClick={() => setSelectedSubCategory(subcategory._id)}
                  >
                    <span>{subcategory.name}</span>
                    <Button size={"sm"} variant={`destructive`}>
                      <Delete />
                    </Button>
                  </div>
                );
              });
            }
          })}
        </div>
      </div>
      <div className="flex flex-col w-full px-4 py-6">
        <div className="space-y-2 p-2 overflow-auto">
          <div className="font-bold">Child Category</div>
          <Input placeholder="Name of child category" />
          <Button className="hover:bg-primary/90">Add Child Category</Button>

          {data.map((category: any) => {
            if (category._id === selectedcategory) {
              return category.children.map((subcategory: any) => {
                if (subcategory._id === selectedSubCategory) {
                  if (subcategory.children.length === 0) {
                    return (
                      <div className="text-gray-500">No child categories</div>
                    );
                  }

                  return subcategory.children.map((childcategory: any) => {
                    return (
                      <div
                        key={childcategory._id}
                        className="flex items-center justify-between hover:bg-gray-300 cursor-pointer p-2 rounded-lg transition-all"
                      >
                        <span>{childcategory.name}</span>
                        <Button size={"sm"} variant={`destructive`}>
                          <Delete />
                        </Button>
                      </div>
                    );
                  });
                }
              });
            }
          })}
        </div>
      </div>
    </div>
  );
}
