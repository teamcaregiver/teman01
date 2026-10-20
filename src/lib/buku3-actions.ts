// Admin writes to Buku 3 (`buku3_bahagian`, migration 0014). Reading and
// merging with the built-in text is in buku3-bahagian.ts.
import { supabase } from "./supabase/client";
import { bahagianAsal } from "./buku3-bahagian";
import type { BahagianBuku3, Buku3Kunci } from "./buku3-bahagian";
import type { ContentVisibility } from "./mock-data";

export interface BahagianForm {
  tajuk: string;
  kandungan: string;
  visibility: ContentVisibility;
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/**
 * Saves a built-in section's title and text. A value equal to the manual's is
 * stored as null, so that part keeps following the built-in text.
 */
export async function simpanBahagianAsal(
  kunci: Buku3Kunci,
  form: Pick<BahagianForm, "tajuk" | "kandungan">,
) {
  const asal = bahagianAsal(kunci);
  if (!asal) throw new Error("Bahagian Buku 3 tidak dikenali.");
  const tajuk = form.tajuk.trim();
  const { error } = await supabase.from("buku3_bahagian").upsert(
    {
      kunci,
      tajuk: tajuk === asal.tajuk ? null : tajuk,
      kandungan: form.kandungan === asal.kandungan ? null : form.kandungan,
    },
    { onConflict: "kunci" },
  );
  check(error);
}

/** A built-in section back to the manual's title and text; its position stays. */
export async function pulihkanBahagianAsal(kunci: Buku3Kunci) {
  const { error } = await supabase
    .from("buku3_bahagian")
    .update({ tajuk: null, kandungan: null })
    .eq("kunci", kunci);
  check(error);
}

/** Adds a section at `urutan`; resolves to the new section's id. */
export async function tambahBahagian(
  form: BahagianForm,
  urutan: number,
): Promise<string> {
  const { data, error } = await supabase
    .from("buku3_bahagian")
    .insert({
      tajuk: form.tajuk.trim(),
      kandungan: form.kandungan,
      visibility: form.visibility,
      urutan,
    })
    .select("id")
    .single();
  check(error);
  return data!.id;
}

export async function kemaskiniBahagianTambahan(
  id: string,
  form: BahagianForm,
) {
  const { error } = await supabase
    .from("buku3_bahagian")
    .update({
      tajuk: form.tajuk.trim(),
      kandungan: form.kandungan,
      visibility: form.visibility,
    })
    .eq("id", id)
    .is("kunci", null);
  check(error);
}

/** Deletes a section admin added. Built-in sections cannot be deleted. */
export async function padamBahagian(id: string) {
  const { error } = await supabase
    .from("buku3_bahagian")
    .delete()
    .eq("id", id)
    .is("kunci", null);
  check(error);
}

/** Saves the positions from pindahBahagian(). */
export async function simpanUrutan(
  changes: { bahagian: BahagianBuku3; urutan: number }[],
) {
  const asal = changes.filter((c) => c.bahagian.kunci);
  const tambahan = changes.filter((c) => !c.bahagian.kunci);
  const results = await Promise.all([
    ...(asal.length
      ? [
          supabase.from("buku3_bahagian").upsert(
            asal.map((c) => ({ kunci: c.bahagian.kunci!, urutan: c.urutan })),
            { onConflict: "kunci" },
          ),
        ]
      : []),
    ...tambahan.map((c) =>
      supabase
        .from("buku3_bahagian")
        .update({ urutan: c.urutan })
        .eq("id", c.bahagian.id),
    ),
  ]);
  check(results.find((r) => r.error)?.error ?? null);
}
