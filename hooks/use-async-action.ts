"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

/**
 * Run a mutating action with a shared busy flag, success/error toasts, and a
 * router refresh on success. Returns true on success so dialogs can close.
 */
export function useAsyncAction() {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)

  const run = React.useCallback(
    async (fn: () => Promise<unknown>, successMessage: string) => {
      setBusy(true)
      try {
        await fn()
        toast.success(successMessage)
        router.refresh()
        return true
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong")
        return false
      } finally {
        setBusy(false)
      }
    },
    [router]
  )

  return { busy, run }
}
