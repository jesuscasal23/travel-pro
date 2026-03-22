export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh justify-center bg-gray-100">
      <div
        id="app-container"
        className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white shadow-xl"
      >
        {children}
      </div>
    </div>
  );
}
