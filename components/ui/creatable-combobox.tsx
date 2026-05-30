"use client";

import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CreatableComboboxOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type CreatableComboboxProps = {
  options: CreatableComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  onCreate: (searchValue: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  createLabel?: string;
  emptyLabel?: string;
};

export function CreatableCombobox({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  createLabel = "Create",
  emptyLabel = "No results found.",
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.value === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.sublabel ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, options]);

  const canCreate = query.trim().length > 0;

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setQuery("");
    setOpen(false);
  }

  function handleCreate() {
    const next = query.trim();
    if (!next) return;
    onCreate(next);
    setQuery("");
    setOpen(false);
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span
            className={cn("truncate", !selected && "text-muted-foreground")}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover p-2 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-8"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                {emptyLabel}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      option.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {option.label}
                    </span>
                    {option.sublabel ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.sublabel}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))
            )}
          </div>

          {canCreate ? (
            <>
              <div className="my-2 h-px bg-border" />
              <button
                type="button"
                onClick={handleCreate}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm font-medium text-primary outline-none hover:bg-accent focus:bg-accent"
              >
                <Plus className="h-4 w-4" />
                {createLabel}
              </button>
            </>
          ) : null}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
