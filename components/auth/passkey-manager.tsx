"use client"

import { useState, useCallback } from "react"
import { startRegistration } from "@simplewebauthn/browser"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  getPasskeyCredentials,
  removePasskey,
  renamePasskey,
} from "@/lib/actions/webauthn"
import { Trash2 } from "lucide-react"

type Credential = {
  id: string
  name: string | null
  deviceType: string
  backedUp: boolean
  createdAt: Date
  lastUsedAt: Date | null
}

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

// WebAuthn never tells the server a real device name, so approximate one
// from the user agent to use as the passkey's default label (still
// user-renameable afterward). Order matters: Edge/Opera/CriOS UAs also
// match the Chrome pattern, and Chrome UAs also match the Safari pattern.
function getDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Passkey"
  const ua = navigator.userAgent

  let os = "device"
  if (/iPhone/.test(ua)) os = "iPhone"
  else if (/iPad/.test(ua)) os = "iPad"
  else if (/Android/.test(ua)) os = "Android"
  else if (/Mac OS X/.test(ua)) os = "Mac"
  else if (/Windows/.test(ua)) os = "Windows"
  else if (/Linux/.test(ua)) os = "Linux"

  let browser = "Browser"
  if (/Edg\//.test(ua)) browser = "Edge"
  else if (/OPR\//.test(ua)) browser = "Opera"
  else if (/Chrome\/|CriOS\//.test(ua)) browser = "Chrome"
  else if (/Firefox\//.test(ua)) browser = "Firefox"
  else if (/Safari\//.test(ua)) browser = "Safari"

  return `${browser} on ${os}`
}

export function PasskeyManager({ initial }: { initial: Credential[] }) {
  const [credentials, setCredentials] = useState<Credential[]>(initial)
  const [registering, setRegistering] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const refresh = useCallback(async () => {
    const creds = await getPasskeyCredentials()
    setCredentials(creds)
  }, [])

  async function handleRegister() {
    setRegistering(true)
    try {
      const optionsResult = await generatePasskeyRegistrationOptions()
      if ("error" in optionsResult) {
        toast(optionsResult.error)
        return
      }
      const { options, challengeId } = optionsResult
      const response = await startRegistration({ optionsJSON: options })
      const result = await verifyPasskeyRegistration(challengeId, response, getDeviceLabel())
      if (result.error) {
        toast(result.error)
        return
      }
      toast("Passkey added successfully")
      await refresh()
    } catch (err) {
      if (err instanceof Error && (err.name === "AbortError" || err.name === "NotAllowedError")) {
        return
      }
      toast(err instanceof Error ? err.message : "Failed to add passkey")
    } finally {
      setRegistering(false)
    }
  }

  async function handleRemove(id: string) {
    try {
      await removePasskey(id)
      toast("Passkey removed")
      await refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to remove passkey")
    }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return
    try {
      await renamePasskey(id, editName)
      toast("Passkey renamed")
      setEditingId(null)
      setEditName("")
      await refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to rename passkey")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Passkeys let you sign in quickly using your fingerprint, face, or device PIN.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegister}
          disabled={registering}
        >
          {registering ? "Adding..." : "Add passkey"}
        </Button>
      </div>

      {credentials.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No passkeys registered yet.
        </p>
      ) : (
        <div className="space-y-2">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="flex items-center justify-between rounded-md px-3 py-2 ring-1 ring-foreground/10 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  viewBox="0 0 24 24"
                  className="size-4 shrink-0 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 20h12a2 2 0 0 0 2-2v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2a2 2 0 0 0 2 2Z" />
                  <circle cx="12" cy="8" r="4" />
                </svg>

                {editingId === cred.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleRename(cred.id)
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={64}
                      className="h-6 w-32 rounded border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring"
                      autoFocus
                      onBlur={() => {
                        setEditingId(null)
                        setEditName("")
                      }}
                    />
                    <Button
                      type="submit"
                      size="xs"
                      variant="ghost"
                      // Without this, the input's onBlur fires first on click
                      // (stealing focus), cancelling edit mode before the
                      // submit handler ever runs.
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      Save
                    </Button>
                  </form>
                ) : (
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="cursor-pointer truncate text-xs font-medium hover:text-foreground/70"
                        onClick={() => {
                          setEditingId(cred.id)
                          setEditName(cred.name ?? "My Passkey")
                        }}
                        title="Click to rename"
                      >
                        {cred.name ?? "My Passkey"}
                      </span>
                      <Badge variant="secondary" className="shrink-0">
                        {cred.deviceType === "multiDevice" ? "Roaming" : "Device"}
                      </Badge>
                    </div>
                    <p className="truncate text-[0.65rem] text-muted-foreground">
                      Added {formatDate(cred.createdAt)}
                      {cred.lastUsedAt ? ` · Last used ${formatDate(cred.lastUsedAt)}` : ""}
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(cred.id)}
                className="relative text-muted-foreground shrink-0 before:absolute before:-inset-1.5 before:content-[''] hover:text-destructive"
                title="Remove passkey"
              >
                <Trash2/>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
