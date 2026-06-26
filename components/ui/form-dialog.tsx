"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * A dialog wrapping a native form. Gathers fields via FormData, calls onSubmit,
 * and closes on success. The form id is per-instance (useId) so multiple
 * dialogs can mount on the same page without colliding.
 */
export function FormDialog({
  title,
  trigger,
  children,
  onSubmit,
  disabled,
  submitLabel = "Save",
  contentClassName = "max-h-[90svh] overflow-y-auto sm:max-w-lg",
}: {
  title: string
  trigger: React.ReactNode
  children: React.ReactNode
  onSubmit: (values: Record<string, string>) => Promise<boolean>
  disabled?: boolean
  submitLabel?: string
  contentClassName?: string
}) {
  const [open, setOpen] = React.useState(false)
  const formId = React.useId()

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const values = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >
    if (await onSubmit(values)) setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form id={formId} onSubmit={handle} className="space-y-4">
          {children}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={disabled}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
