"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

/**
 * A single-textarea "describe it and generate" dialog. Shared by every
 * AI-generation entry point (plans, specs, …).
 */
export function PromptDialog({
  triggerLabel,
  title,
  description,
  placeholder,
  submitLabel = "Generate",
  rows = 5,
  disabled,
  onSubmit,
}: {
  triggerLabel: string
  title: string
  description: string
  placeholder?: string
  submitLabel?: string
  rows?: number
  disabled?: boolean
  onSubmit: (text: string) => Promise<boolean>
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button disabled={disabled}>
            <Sparkles />
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={disabled || !value.trim()}
            onClick={async () => {
              if (await onSubmit(value)) {
                setValue("")
                setOpen(false)
              }
            }}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
