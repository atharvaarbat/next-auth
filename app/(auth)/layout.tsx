import Image from "next/image"
import { redirect } from "next/navigation"
import React from "react"
import { DottedMap, Marker } from "@/components/ui/dotted-map"
import { getSession } from "@/lib/auth"

type Props = {
  children: React.ReactNode
}

const markers: Marker[] = [
  {
    lat: 18.5204,
    lng: 73.8567,
    size: 0.3,
  },
  {
    lat: 40.7128,
    lng: -74.006,
    size: 0.3,
    pulse: false,
  },
]

export default async function AuthLayout({ children }: Props) {
  const session = await getSession()
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-5">
      <div className="col-span-5 flex flex-col gap-4 p-6 md:p-10 lg:col-span-2">
        <div className="flex justify-center gap-2 animate-fade-in md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <Image src="/next-auth.png" alt="Logo" width={24} height={24} className="h-6 w-6" />
            Next Auth
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="relative col-span-3 hidden overflow-hidden rounded-l-2xl bg-muted dark:rounded-l-0 dark:bg-muted/50 lg:block">
        <div className="absolute inset-0 z-20 p-12 animate-slide-in-right">
          <h1 className="max-w-xs text-4xl font-light leading-tight text-foreground/90">
            Build faster.
            <br />
            <span className="font-semibold text-primary">Ship sooner.</span>
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed">
            Pre-built auth flows so you can focus on what makes your product unique.
          </p>
        </div>
        <div className="z-5 block h-screen w-full overflow-hidden dark:hidden">
          <DottedMap markers={markers} pulse dotColor="#000" />
        </div>
        <div className="z-5 hidden h-screen w-full overflow-hidden dark:block">
          <DottedMap markers={markers} pulse />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            maskImage: "radial-gradient(ellipse at center, transparent 25%, black 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, transparent 25%, black 70%)",
          }}
        />
      </div>
    </div>
  )
}
