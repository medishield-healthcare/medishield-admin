"use client";
import {
  AccordionTrigger,
  AccordionContent,
  AccordionItem,
  Accordion,
} from "@/components/ui/accordion";
import { ImageCarousel } from "./image-carousel";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface ProductDetailsProps {
  product: any;
  isView?: boolean;
}

export function ProductDetails({ product, isView }: ProductDetailsProps) {
  const router = useRouter();
  isView = isView || false;
  const productSpecs = product?.product_specs ?? {};
  console.log(product);
  return (
    <div className="product-details">
      <div className="page-heading">
        <h1 className="page-title">Product details</h1>
        {isView ? null : (
          <Button
            onClick={() =>
              router.push(`/dashboard/products/addProduct/${product._id}`)
            }
            size="sm"
            variant="default"
          >
            Edit
          </Button>
        )}
      </div>
      <div className="grid gap-5 md:items-start">
        <div className="product-overview surface">
          <ImageCarousel
            images={product.media_gallery_entries.map(
              (image: any) => image.file
            )}
          />
          <div className="grid content-start gap-4 break-words">
            <h2 className="font-semibold text-2xl leading-snug">{product.name}</h2>
            <p className="font-bold">
              SKU <span className="font-medium">{product.sku}</span>
            </p>
            <p className="font-bold">
              Stock{" "}
              <span className="font-medium mr-2">{product.max_sale_qty}</span>(
              <span
                className={`
              ${product.max_sale_qty > 0 ? "text-primary" : "text-destructive"}
              `}
              >
                {product.max_sale_qty > 0 ? "In Stock" : "Out of Stock"}
              </span>
              )
            </p>
            <div>
              <p>{product.short_description}</p>
            </div>
            <div className="text-3xl font-semibold text-primary py-2">
              ₹ {product.price.minimalPrice}.00
            </div>

            <div className="md:flex items-start"></div>
            <h3 className="text-sm font-semibold text-muted-foreground">Listed in categories</h3>
            {product.categories.map((category: any, index: any) => (
              <p key={index} className="ml-1">
                {category.name}
              </p>
            ))}
          </div>
        </div>

        {product.childProducts.length > 1 && (
          <div>
            <h2 className="section-title mb-4">Product variants</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {product.childProducts.map((child: any) => (
                <div
                  key={child?.sku}
                  className="surface flex min-w-0 break-words p-5 space-x-4"
                >
                  <div className="flex space-x-2 items-start">
                    <div>
                      <h1 className="font-bold">
                        {child.name}{" "}
                        <span className="font-medium block text-sm">
                          SKU #{child.sku}
                        </span>
                      </h1>
                      <p>{child.short_description}</p>
                      <p className="font-semibold">
                        {" "}
                        ₹ {child.price.minimalPrice.amount.value}
                      </p>
                      <p className="font-semibold">
                        {"Stock "} {child?.max_sale_qty ?? 0}{" "}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Accordion className="surface product-specs w-full" collapsible type="single">
          <AccordionItem value="more-info">
            <AccordionTrigger>Description</AccordionTrigger>
            <AccordionContent>
              <p
                dangerouslySetInnerHTML={{
                  __html: productSpecs.description ?? "",
                }}
              ></p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion className="surface product-specs w-full" collapsible type="single">
          <AccordionItem value="more-info">
            <AccordionTrigger>Key Specification</AccordionTrigger>
            <AccordionContent>
              <p
                dangerouslySetInnerHTML={{
                  __html: productSpecs.key_specifications ?? "",
                }}
              ></p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Accordion className="surface product-specs w-full" collapsible type="single">
          <AccordionItem value="more-info">
            <AccordionTrigger>Packaging</AccordionTrigger>
            <AccordionContent>
              <p
                dangerouslySetInnerHTML={{
                  __html: productSpecs.packaging ?? "",
                }}
              ></p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Accordion className="surface product-specs w-full" collapsible type="single">
          <AccordionItem value="more-info">
            <AccordionTrigger>Direction To Use</AccordionTrigger>
            <AccordionContent>
              <p
                dangerouslySetInnerHTML={{
                  __html: productSpecs.direction_to_use ?? "",
                }}
              ></p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Accordion className="surface product-specs w-full" collapsible type="single">
          <AccordionItem value="more-info">
            <AccordionTrigger>Features</AccordionTrigger>
            <AccordionContent>
              <p
                dangerouslySetInnerHTML={{
                  __html: productSpecs.features ?? "",
                }}
              ></p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
