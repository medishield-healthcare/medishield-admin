"use client";
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import Image from "next/image";
import { AlertDialogDemo } from "./alert-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useEdgeStore } from "@/lib/edgestore";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Input } from "postcss";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

interface ProductCardProps {
  title: string;
  id: string;
  description: string;
  image: string;
  slug: string;
  price: number;
  media_gallery: string[];
  product: any;
  selectedProduct: any;
  setSelectedProduct: any;
}

const ProductCard = ({
  title,
  id,
  description,
  image,
  slug,
  price,
  media_gallery,
  product,
  selectedProduct,
  setSelectedProduct,
}: ProductCardProps) => {
  const router = useRouter();
  const { edgestore } = useEdgeStore();

  const [isPublished, setIsPublished] = React.useState(product.published);
  const [isFeatured, setIsFeatured] = React.useState(product.featured);
  const deleteProduct = async (id: string) => {
    const res = await fetch(`/api/product/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
  };

  const handleAction = () => {
    // first delete the images
    try {
      console.log("Deleting images", media_gallery);
      media_gallery.forEach(async (image) => {
        try {
          await edgestore.publicFiles.delete({
            url: image,
          });
        } catch (error) {
          console.log("Error deleting image", error);
        }
      });
      deleteProduct(id);
      toast("Product has been deleted", {
        description: "The product has been removed from the database.",
        closeButton: true,
      });
      window.location.reload();
      router.refresh();
    } catch (error) {
      toast("Error", {
        description: "There was an error deleting the product.",
        closeButton: true,
      });
    }

    console.log("Action has been clicked");
  };

  const handlePublish = async (id: string) => {
    console.log("Publishing product", id);
    const res = await fetch(`/api/product/${id}`, {
      method: "PUT",
      body: JSON.stringify({ published: !isPublished }),
    });

    const data = await res.json();
    console.log(data);

    console.log("Publishing product", id);
    // turn off the switch
    setIsPublished(!isPublished);
  };

  const handleFeatured = async (id: string) => {
    const res = await fetch(`/api/product/${id}`, {
      method: "PUT",
      body: JSON.stringify({ featured: !isFeatured }),
    });

    const data = await res.json();
    console.log(data);

    console.log("mark as featured product", id);
    // turn off the switch
    setIsFeatured(!isFeatured);
  };

  return (
    <Card
      className={cn(
        "product-card cursor-pointer relative group flex flex-col",
        selectedProduct.includes(id) && "is-selected"
      )}
    >
      <input
        type="checkbox"
        aria-label="Select product"
        className="
          absolute top-0 right-0 z-10 m-3
           h-5 w-5 cursor-pointer
          "
        checked={selectedProduct.includes(id)}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedProduct([...selectedProduct, id]);
          } else {
            setSelectedProduct(
              selectedProduct.filter((item: any) => item !== id)
            );
          }
        }}
      />
      <CardContent
        className="product-card-content"
      >
        <div
          className="product-card-link"
          role="link"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter") router.push(`/dashboard/products/${id}`);
          }}
          onClick={() => router.push(`/dashboard/products/${id}`)}
        >
          <img
            alt={title}
            className="product-card-image"
            height={150}
            src={image}
            width={200}
          />
          <h2 className="product-card-title">{title}</h2>
          <p className="product-card-description">
            {description}
          </p>
          <div className="flex items-center justify-between">
            <span className="product-card-price">₹ {price}</span>
          </div>
        </div>

        <div className="flex items-center justify-between w-full mt-auto pt-3">
          <Badge
            onClick={() => handleFeatured(id)}
            role="button"
            tabIndex={0}
            aria-pressed={isFeatured}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleFeatured(id);
              }
            }}
            className={cn(
              "text-sm",
              isFeatured ? "border-transparent bg-secondary text-primary hover:bg-accent" : "border-border bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {isFeatured ? "Featured" : "Not Featured"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="product-card-footer">
        <div className="flex items-center space-x-2">
          <Label htmlFor="published">Published</Label>
          <Switch
            id="published"
            aria-label={`Publish ${title}`}
            checked={isPublished}
            onCheckedChange={() => handlePublish(id)}
          />
        </div>
        <Button
          onClick={() => router.push(`/dashboard/products/addProduct/${id}`)}
          size="sm"
          variant="outline"
        >
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive" className="border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                product and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAction}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
