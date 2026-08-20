import Image from "next/image";

export function LogoLoader() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          {/* Spinning brand-green ring */}
          <div
            className="absolute w-[72px] h-[72px] rounded-[22px] border-2 border-transparent animate-spin"
            style={{
              borderTopColor: "#0C973A",
              borderRightColor: "rgba(12,151,58,0.22)",
              animationDuration: "0.9s",
            }}
          />
          {/* Logo box */}
          <div className="w-16 h-16 bg-[#0F2030] rounded-2xl flex items-center justify-center logo-glow">
            <Image
              src="/Uniwhite.png"
              alt="Loading"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse tracking-wide">
          Loading…
        </p>
      </div>
    </div>
  );
}
