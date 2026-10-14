import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/button";

interface BrandCardProps {
  name: string;
  thumbnail: string;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

const BrandCard = ({ name, thumbnail, onEdit, onDelete, disabled }: BrandCardProps) => {
  return (
    <div className="brand-card surface flex flex-col gap-4 p-5 h-full">
      <Link
        href={`/dashboard/products?brand=${encodeURIComponent(name)}`}
        className="flex flex-1 items-center gap-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View products for ${name}`}
      >
        <img
          alt={`${name} logo`}
          className="aspect-square object-contain rounded-md bg-muted p-2 overflow-hidden w-16 shrink-0"
          height={120}
          src={thumbnail}
          width={120}
        />
        <h2 className="text-base font-semibold tracking-tight break-words min-w-0">{name}</h2>
      </Link>
      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" size="sm" onClick={onEdit} disabled={disabled} aria-label={`Edit brand: ${name}`}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={disabled} aria-label={`Delete brand: ${name}`}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default BrandCard;
