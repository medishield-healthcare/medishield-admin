import { CategoryAddPanel } from "@/components/component/category-add-panel";

import React from "react";

const page = () => {
  return (
    <div className="page-content">
      <header>
        <h1 className="page-title">Category</h1>
      </header>
      <CategoryAddPanel />
    </div>
  );
};

export default page;
