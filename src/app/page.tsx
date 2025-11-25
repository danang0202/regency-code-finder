import UploadDocument from "@/components/UploadDocument";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <main style={{ padding: "32px" }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
          <UploadDocument />
        </div>
      </main>
    </div>
  );
}
