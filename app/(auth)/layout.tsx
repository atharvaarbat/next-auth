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
            <div className="col-span-3 relative hidden bg-muted/30 lg:block overflow-hidden rounded-l-4xl">
                {/* <img
                    src="/auth-bg.png"
                    alt="Image"
                    className="absolute inset-0 h-full w-full object-cover"
                /> */}
                <div className="h-screen w-full overflow-hidden ">
                    {/* <div className="to-background absolute inset-0 bg-radial from-transparent to-200%" /> */}
                    <DottedMap markers={markers} pulse />
                </div>
            </div>
        </div>
    )
}

export default layout