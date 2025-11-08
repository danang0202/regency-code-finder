import UploadDocument from "@/components/UploadDocument";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <UploadDocument />
        </div>
      </main>
    </div>
  );
}
