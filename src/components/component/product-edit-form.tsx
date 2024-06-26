"use client";

import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "@/components/ui/card";

import { CategoryDropDown } from "./category-dropdown";
import { set, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Cross, Delete, XIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../ui/command";
import { useEffect, useState } from "react";
import useDisableNumberInputScroll from "@/hooks/useNumber";
import { toast } from "sonner";
import { FileState, MultiImageDropzone } from "./multi-image-upload";
import { useEdgeStore } from "@/lib/edgestore";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { VarientsAddTable } from "./varients-add-table";
import { Badge } from "../ui/badge";

const MarkdownEditor = dynamic(() => import("./markdown-editor"), {
  ssr: false,
});

const formSchema = z.object({
  name: z.string().min(2, {
    message: "product name must be at least 2 characters.",
  }),
  sku: z
    .string()
    .min(2, { message: "sku must be at least 2 characters." })
    .trim(),
  barcode: z
    .string()
    .min(2, {
      message: "barcode must be at least 2 characters.",
    })
    .trim(),
  price: z.object({
    minimalPrice: z.coerce.number().min(0, {
      message: "price must be greater than 0.",
    }),
    maximalPrice: z.coerce.number().min(0, {
      message: "price must be greater than 0.",
    }),
    regularPrice: z.coerce.number().min(0, {
      message: "price must be greater than 0.",
    }),
  }),
  max_sale_qty: z.coerce
    .number()
    .min(0, { message: "stock must be greater than 0." }),
  medishield_coins: z.coerce.number(),
  short_description: z.string().min(2, {
    message: "description must be at least 2 characters.",
  }),
  product_specs: z.object({
    description: z.string().min(2, {
      message: "message must be at least 2 characters.",
    }),
    key_specifications: z.string(),
    packaging: z.string(),
    direction_to_use: z.string(),
    features: z.string(),
  }),
  thumbnail_url: z.string().min(2, {
    message: "thumbnail_url must be at least 2 characters.",
  }),
  media_gallery_entries: z
    .array(
      z.object({
        file: z.string(),
      })
    )
    .min(1, { message: "media_gallery_entries must have at least 1 entry." }),
  categories: z.array(
    z.object({
      name: z.string(),
    })
  ),
  manufacturer: z.string().min(1),
});

interface ProductEditFormProps {
  defaultValues?: z.infer<typeof formSchema>;
}

export function ProductEditForm({ defaultValues }: ProductEditFormProps) {
  const router = useRouter();

  // 1. Use `useForm` to create a form instance.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: "",
      sku: "",
      price: {
        minimalPrice: 0,
        maximalPrice: 0,
        regularPrice: 0,
      },
      barcode: "",
      max_sale_qty: 0,
      short_description: "",
      product_specs: {
        description: "",
        key_specifications: "",
        packaging: "",
        direction_to_use: "",
        features: "",
      },
      thumbnail_url: "",
      media_gallery_entries: [],
      categories: [],
      manufacturer: "",
      medishield_coins: 0,
    },
  });
  // 2. Define a submit handler.
  async function onSaveDraft(values: z.infer<typeof formSchema>) {
    try {
      form.setValue("price.maximalPrice", values.price.regularPrice);
      console.log("Saving draft", {
        ...values,
        published: true,
        childProducts: childProduct,
      });

      // check field validation
      const isValid = formSchema.safeParse(values);
      if (!isValid.success) {
        console.log(isValid.error.errors);
        toast.error("Please fill all required fields");
        return;
      }

      setLoading(true);
      const res = await fetch(`/api/product/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          published: true,
          childProducts: childProduct,
        }),
      });
      const data = await res.json();
      toast.success("Product added successfully");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to add product");
    }
  }
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      form.setValue("price.maximalPrice", values.price.regularPrice);

      console.log({ ...values, childProducts: childProduct });
      const response = await fetch("/api/product", {
        method: "POST",
        body: JSON.stringify({ ...values, childProducts: childProduct }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Error in adding product");
      }
      form.reset();
      setImages([]);
      setCategory([]);
      setFileStates([]);
      setChildProduct([]);

      toast.success("Product added successfully");
      // console.log(response);
    } catch (error) {
      toast.error(
        "Error in adding product or product already exist with same sku"
      );
    }
  }
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState<[]>([]);
  const [childProduct, setChildProduct] = useState<[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const { edgestore } = useEdgeStore();

  function updateFileProgress(key: string, progress: FileState["progress"]) {
    setFileStates((fileStates) => {
      const newFileStates = structuredClone(fileStates);
      const fileState = newFileStates.find(
        (fileState) => fileState.key === key
      );
      if (fileState) {
        fileState.progress = progress;
      }
      return newFileStates;
    });
  }

  function updateFileStateUrl(key: string, url: string) {
    setFileStates((fileStates) => {
      const newFileStates = structuredClone(fileStates);
      const fileState = newFileStates.find(
        (fileState) => fileState.key === key
      );
      if (fileState) {
        fileState.url = url;
      }
      return newFileStates;
    });
  }

  const handleAddImage = (imageUrl: string) => {
    const mediaEntry = { file: imageUrl };
    const currentMediaEntries = form.getValues("media_gallery_entries");
    const updatedMediaEntries = [...currentMediaEntries, mediaEntry];
    form.setValue("media_gallery_entries", updatedMediaEntries);
    // set thumbnail url as first image
    form.setValue("thumbnail_url", updatedMediaEntries[0].file);
    console.log(form.getValues("media_gallery_entries"));
  };

  const handleAddCategory = (category: any) => {
    form.resetField("categories");
    const currentCategories = form.getValues("categories");
    const updatedCategories = [
      ...currentCategories,
      ...category,
      {
        name: form.getValues("manufacturer"),
      },
    ];
    form.setValue("categories", updatedCategories);
    console.log(form.getValues("categories"));
  };

  const fetchBrands = async () => {
    setLoading(true);
    const response = await fetch("/api/brands");
    const data = await response.json();
    console.log(data);
    setLoading(false);
    return data["data"];
  };

  const fetchCategories = async () => {
    setLoading(true);
    const response = await fetch("/api/category");
    const data = await response.json();
    console.log(data);
    setLoading(false);
    return data["categories"];
  };

  useEffect(() => {
    fetchBrands().then((data) => {
      setBrands(data);
    });

    fetchCategories().then((data) => {
      setCategories(data);
    });

    console.log(brands);
  }, []);

  const handleBarcodeChange = () => {
    let interval: NodeJS.Timeout | null = null;
    var barcode = "";
    if (typeof document === "undefined") return;
    document.addEventListener("keydown", (e) => {
      if (interval) clearInterval(interval);
      if (e.key === "Enter") {
        e.preventDefault();
        if (barcode) {
          form.setValue("barcode", barcode);
        }
        barcode = "";
        return;
      }
      if (e.key !== "Shift") {
        barcode += e.key;
      }
      interval = setInterval(() => (barcode = ""), 60);
    });
  };

  handleBarcodeChange();

  useDisableNumberInputScroll();

  return (
    <div className="flex flex-col">
      <div className="mx-3">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Add Product</CardTitle>
            <CardDescription>Add a product in your catalog.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Product name" {...field} />
                      </FormControl>
                      <FormDescription>
                        Provide a name for the product.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="#XXXXXXXSKU" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter Product SKU (Stock Keeping Unit)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter Product Barcode (Universal Product Code - UPC)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="short_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Short description for the product"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price.minimalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Price of the product in INR"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price.regularPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regular Price (MRP)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Product's MRP"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medishield_coins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medishield Coin (MSC)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Provide MedishieldCoin for the product"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max_sale_qty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="No. of products in stock"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="media_gallery_entries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Images</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <MultiImageDropzone
                            value={fileStates}
                            dropzoneOptions={{
                              maxFiles: 6,
                            }}
                            onChange={(files: any) => {
                              setFileStates(files);
                            }}
                            onFilesAdded={async (addedFiles: any) => {
                              setFileStates([...fileStates, ...addedFiles]);
                              await Promise.all(
                                addedFiles.map(async (addedFileState: any) => {
                                  try {
                                    setLoading(true);
                                    const res =
                                      await edgestore.publicFiles.upload({
                                        file: addedFileState.file,
                                        onProgressChange: async (progress) => {
                                          updateFileProgress(
                                            addedFileState.key,
                                            progress
                                          );
                                          if (progress === 100) {
                                            // wait 1 second to set it to complete
                                            // so that the user can see the progress bar at 100%
                                            await new Promise((resolve) =>
                                              setTimeout(resolve, 1000)
                                            );
                                            updateFileProgress(
                                              addedFileState.key,
                                              "COMPLETE"
                                            );
                                            updateFileStateUrl(
                                              addedFileState.key,
                                              res.url
                                            );
                                          }
                                        },
                                      });
                                    console.log(res);
                                    handleAddImage(res.url);
                                    setLoading(false);
                                  } catch (err) {
                                    setLoading(false);
                                    updateFileProgress(
                                      addedFileState.key,
                                      "ERROR"
                                    );
                                  }
                                })
                              );
                            }}
                            onFileRemove={async (removedFile: any) => {
                              // remove image from edgestore
                              try {
                                setLoading(true);
                                const res = await edgestore.publicFiles.delete({
                                  url: removedFile.url,
                                });

                                toast.success("Image removed successfully");
                                setFileStates((fileStates) =>
                                  fileStates.filter(
                                    (fileState) =>
                                      fileState.key !== removedFile.key
                                  )
                                );
                                // remove image from media_gallery_entries
                                const currentMediaEntries = form.getValues(
                                  "media_gallery_entries"
                                );
                                const updatedMediaEntries =
                                  currentMediaEntries.filter(
                                    (entry: any) =>
                                      entry.file !== removedFile.url
                                  );
                                form.setValue(
                                  "media_gallery_entries",
                                  updatedMediaEntries
                                );
                                setLoading(false);
                              } catch (error) {
                                setLoading(false);
                                console.error(error);
                                toast.error("Error in removing image");
                              }
                            }}
                          />
                        </div>
                      </FormControl>
                      {
                        <div className="flex flex-col gap-2">
                          {form
                            .getValues("media_gallery_entries")
                            .map((image, index) => (
                              <div key={index} className="flex flex-col">
                                <span>{image.file}</span>
                              </div>
                            ))}
                        </div>
                      }
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-[250px] overflow-auto ml-4 justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {!loading && field.value
                                ? brands.find(
                                    (b: any) => b.name === field.value
                                  )?.name
                                : "Select Manufacturer"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px]  p-1">
                          <Command>
                            <CommandInput placeholder="Search brands..." />
                            <CommandEmpty>No brands found.</CommandEmpty>
                            <CommandGroup className="h-[400px] overflow-auto">
                              {!loading &&
                                brands.map((b: any) => (
                                  <CommandItem
                                    value={b.name}
                                    key={b.name}
                                    onSelect={() => {
                                      form.setValue("manufacturer", b.name);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        b.name === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {b.name}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <div className="ml-2">
                          {!loading && (
                            <CategoryDropDown
                              categoryList={categories}
                              setCategory={setCategory}
                              handleChange={handleAddCategory}
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {category.length > 0 && (
                  <>
                    <div className="flex gap-2">
                      {category.map((cat: any, index) => (
                        <Badge
                          key={index}
                          className="bg-blue-500 text-white text-md"
                        >
                          <span>{cat.name}</span>
                          <XIcon
                            className="w-4 h-4 ml-1 cursor-pointer"
                            onClick={() => {
                              setCategory(
                                // @ts-ignore
                                category.filter((c) => c.name !== cat.name)
                              );
                              form.setValue("categories", category);

                              console.log(form.getValues());
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
                <FormField
                  control={form.control}
                  name="product_specs.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <MarkdownEditor
                          handleProcedureContentChange={(value: string) => {
                            form.setValue("product_specs.description", value);
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="product_specs.direction_to_use"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Direction to use</FormLabel>
                      <FormControl>
                        <MarkdownEditor
                          handleProcedureContentChange={(value: string) => {
                            form.setValue(
                              "product_specs.direction_to_use",
                              value
                            );
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="product_specs.key_specifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Specification</FormLabel>
                      <FormControl>
                        <MarkdownEditor
                          handleProcedureContentChange={(value: string) => {
                            form.setValue(
                              "product_specs.key_specifications",
                              value
                            );
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="product_specs.packaging"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packaging</FormLabel>
                      <FormControl>
                        <MarkdownEditor
                          handleProcedureContentChange={(value: string) => {
                            form.setValue("product_specs.packaging", value);
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="product_specs.features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features</FormLabel>
                      <FormControl>
                        <MarkdownEditor
                          handleProcedureContentChange={(value: string) => {
                            form.setValue("product_specs.features", value);
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <VarientsAddTable
                  childProducts={childProduct}
                  setChildProducts={setChildProduct}
                />

                {/* <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log(childProduct);
                  }}
                >
                  Test
                </Button> */}

                <Button disabled={loading} variant="outline" type="submit">
                  Save as Draft
                </Button>
                <Button
                  disabled={loading}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onSaveDraft(form.getValues());
                  }}
                  className="ml-4"
                >
                  Publish Product
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter></CardFooter>
        </Card>
      </div>
    </div>
  );
}
