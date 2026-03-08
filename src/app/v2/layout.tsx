import "./globals-v2.css";

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-gray-100">
      <div className="relative flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white shadow-xl">
        {children}
      </div>
    </div>
  );
}
