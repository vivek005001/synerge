import Image from "next/image"

export default function Header() {
  return (
    <>
    <div className="relative w-screen">
        <div className="absolute inset-0 bg-white/5 z-0 blur-sm  "> </div>
    <div className="px-6 py-4 flex justify-between text-white h-auto w-screen align-baseline">
       <div className=" font-sans text-3xl " >
        Synerge
       </div>
       <div>
        <button className="rounded-full w-6 h-6 bg-blue-500 flex text-white items-center justify-center z-10">
            <Image src={"/icons/user.svg"} alt="user_icon" width={12} height={12} />

        </button>
       </div>
    </div>
    </div>

    </>
  )
}

