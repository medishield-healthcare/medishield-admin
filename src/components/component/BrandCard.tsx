import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "../ui/button";

interface BrandCardProps {
  name: string;
  thumbnail: string;
}

const BrandCard = ({ name, thumbnail }: BrandCardProps) => {
  const router = useRouter();
  return (
    <div
      onClick={() => {
        router.push(`/dashboard/products?brand=${name}`);
      }}
      className="brand-card surface flex cursor-pointer items-center gap-4 p-5 relative group h-full"
    >
      <img
        alt="Brand thumbnail"
        className="aspect-square object-contain rounded-md bg-muted p-2 overflow-hidden w-16 shrink-0"
        height={120}
        src={thumbnail}
        width={120}
      />
      <h2 className="text-base font-semibold tracking-tight break-words min-w-0">{name}</h2>
    </div>
  );
};

export default BrandCard;
