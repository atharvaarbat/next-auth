import { DottedMap, Marker } from '@/components/ui/dotted-map'
import React from 'react'

type Props = {
    children: React.ReactNode
}

const layout = ({ children }: Props) => {
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
    return (
        <div className="grid min-h-svh lg:grid-cols-5">
            <div className="col-span-5 lg:col-span-2 flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start animate-fade-in">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <img src="/vercel.svg" alt="Logo" className="h-6 w-6" />
                        Next Auth
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        {children}
                    </div>
                </div>
            </div>
            <div className="col-span-3 relative hidden rounded-l-2xl dark:rounded-l-0 bg-muted dark:bg-muted/50 lg:block overflow-hidden">
                <div className="absolute inset-0 z-20  p-12 animate-slide-in-right">
                    {/* <p className="text-xs font-mono uppercase tracking-[0.2em] mb-4">
                        Authentication Template
                    </p> */}
                    <h1 className="text-4xl font-light leading-tight text-foreground/90 max-w-xs">
                        Build faster.
                        <br />
                        <span className="font-semibold text-primary">Ship sooner.</span>
                    </h1>
                    <p className="text-sm mt-2 max-w-xs leading-relaxed">
                        Pre-built auth flows so you can focus on what makes your product unique.
                    </p>
                </div>
                <div className="dark:hidden block h-screen w-full overflow-hidden z-5">
                    <DottedMap markers={markers} pulse dotColor='#000' />
                </div>
                <div className="hidden dark:block h-screen w-full overflow-hidden z-5">
                    <DottedMap markers={markers} pulse />
                </div>
                <div
                    className="pointer-events-none absolute z-10 inset-0"
                    style={{
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        maskImage: 'radial-gradient(ellipse at center, transparent 25%, black 70%)',
                        WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 25%, black 70%)',
                    }}
                />
            </div>
        </div>
    )
}

export default layout