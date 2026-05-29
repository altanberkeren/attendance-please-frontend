"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { ZodObject, ZodRawShape, z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export type FieldDef = {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
};

type AnyRecord = Record<string, unknown>;

type CrudDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  schema: ZodObject<ZodRawShape>;
  defaultValues: AnyRecord;
  fields: FieldDef[];
  onSubmit: (values: AnyRecord) => void;
};

export function CrudDialog({
  open,
  onOpenChange,
  title,
  schema,
  defaultValues,
  fields,
  onSubmit,
}: CrudDialogProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema) as never,
    defaultValues,
  });
  const { reset } = form;

  useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, reset, defaultValues]);

  function handleSubmit(values: z.infer<typeof schema>) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {fields.map((f) => (
              <FormField
                key={f.name}
                control={form.control}
                name={f.name as never}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{f.label}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={f.placeholder}
                        type={f.type ?? "text"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
