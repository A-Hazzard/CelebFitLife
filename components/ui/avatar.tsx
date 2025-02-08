import Image from "next/image";

export function Avatar({ children }: { children: React.ReactNode }) {
    return <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brandWhite">{children}</div>;
  }
  
  export function AvatarImage({ src }: { src: string }) {
    return <Image src={src} alt="Avatar" width='10' height='10' className="w-full h-full object-cover" />;
  }
  
  export function AvatarFallback({ children }: { children: React.ReactNode }) {
    return <div className="w-full h-full flex items-center justify-center bg-brandGray">{children}</div>;
  }