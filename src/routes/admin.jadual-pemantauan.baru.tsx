import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Buku3BahagianForm } from "@/components/buku3-bahagian-form";
import { gabungBahagian, urutanBaru } from "@/lib/buku3-bahagian";
import { tambahBahagian } from "@/lib/buku3-actions";
import type { BahagianForm } from "@/lib/buku3-actions";
import { qk, useBuku3Query, useInvalidate } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/jadual-pemantauan/baru")({
  component: NewBahagian,
});

const KOSONG: BahagianForm = {
  tajuk: "",
  kandungan: "",
  visibility: "published",
  coverImage: "",
  pdfUrl: "",
  pdfName: "",
  youtubeUrl: "",
};

function NewBahagian() {
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const q = useBuku3Query();

  const backToList = () => navigate({ to: "/admin/jadual-pemantauan" });

  const handleSubmit = async (values: BahagianForm) => {
    // New sections go to the end of Buku 3; admin can move them afterwards.
    const id = await tambahBahagian(
      values,
      urutanBaru(q.data ?? gabungBahagian([])),
    );
    invalidate(qk.buku3);
    toast.success("Bahagian berjaya ditambah");
    navigate({
      to: "/admin/jadual-pemantauan/$bahagianId",
      params: { bahagianId: id },
    });
  };

  return (
    <Buku3BahagianForm
      initial={KOSONG}
      heading="Bahagian Baru"
      description="Tambah bahagian baharu ke Buku 3 (Jadual Pemantauan)."
      submitLabel="Simpan Bahagian"
      backLabel="Kembali ke senarai"
      onSubmit={handleSubmit}
      onLeave={backToList}
    />
  );
}
