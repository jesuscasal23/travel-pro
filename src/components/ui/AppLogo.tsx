import Image from "next/image";

interface AppLogoProps {
  size?: number;
}

export function AppLogo({ size = 40 }: AppLogoProps) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <Image src="/logo.png" alt="Voya" width={size} height={size} className="scale-150" />
    </div>
  );
}
