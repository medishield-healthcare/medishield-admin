import ProductShare from "@/components/component/product-share";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Checkout this product on Medishield",
  description: "MediShield - A dental supplies store",
};

const Page = ({ params: { slug } }: any) => {
  return (
    <>
      <ProductShare params={{ slug }} />
    </>
  );
};

export default Page;
