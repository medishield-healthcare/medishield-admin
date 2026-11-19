"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PageJumpProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

export function PageJump({ page, pageCount, onPageChange, disabled = false }: PageJumpProps) {
  const inputId = useId();
  const lastPage = Math.max(1, pageCount);
  const [pageInput, setPageInput] = useState(String(page));

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  function goToPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetPage = Number(pageInput);
    if (!Number.isInteger(targetPage) || targetPage < 1 || targetPage > lastPage) return;
    onPageChange(targetPage);
  }

  return (
    <form onSubmit={goToPage} className="flex flex-wrap items-center gap-2 text-sm">
      <label htmlFor={inputId} className="whitespace-nowrap text-muted-foreground">Page</label>
      <Input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={1}
        max={lastPage}
        step={1}
        required
        value={pageInput}
        onChange={(event) => setPageInput(event.target.value)}
        disabled={disabled || pageCount < 1}
        className="h-10 w-20 px-2 text-center tabular-nums"
      />
      <span className="whitespace-nowrap text-muted-foreground">of {lastPage}</span>
      <Button type="submit" variant="outline" size="sm" disabled={disabled || pageCount < 1}>
        Go
      </Button>
    </form>
  );
}
