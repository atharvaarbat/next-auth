import React from 'react'

type Props = {
    children: React.ReactNode
}

const layout = ({ children }: Props) => {
    return (
        <div className='flex items-center w-screen h-screen'>
            <div className='z-10 mx-auto'>
                {children}
            </div>
            <img src="/auth-bg.png" className="absolute top-0 left-0 w-full h-full object-cover z-0" />
        </div>
    )
}

export default layout