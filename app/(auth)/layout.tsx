import { DottedMap, Marker } from '@/components/ui/dotted-map'
import { GalleryVerticalEnd } from 'lucide-react'
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
                <div className="flex justify-center gap-2 md:justify-start">
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
            <div className="col-span-3 relative hidden rounded-l-2xl dark:rounded-l-0 bg-muted dark:bg-muted/70 lg:block overflow-hidden">
                <div className="absolute top-25 left-10 text-center z-20">
                    <h1 className='text-4xl font-medium'>The Next Big <span className='font-bold italic'> Auth</span></h1>
                </div>
                <div className="dark:hidden block h-screen w-full overflow-hidden z-5">
                    <DottedMap markers={markers} pulse dotColor='#000' />
                </div>
                <div className="hidden dark:block h-screen w-full overflow-hidden z-5">
                    <DottedMap markers={markers} pulse />
                </div>
                {/* Vignette: transparent in the center, darkening to the
                    background color toward the edges. */}
                <div className="pointer-events-none absolute z-10 inset-0 dark:bg-[radial-gradient(ellipse_at_center,transparent_35%,var(--background)_100%)]" />
            </div>
        </div>
    )
}

export default layout