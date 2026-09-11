import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PasswordInput } from "@/components/ui/password-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase/client";
import { refreshCurrentUser, useAuth } from "@/lib/auth-store";
import { IMAGE_ACCEPT, uploadAvatar, validateImageFile } from "@/lib/storage";
import { toast } from "sonner";
import { AlertCircle, Trash2, Upload } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  staff: "Staf",
  anak: "Anak / Keluarga",
};

const roleTone: Record<string, string> = {
  admin: "bg-lavender/25 text-lavender-foreground",
  staff: "bg-teal/20 text-teal-foreground",
  anak: "bg-sage/20 text-sage-foreground",
};

const initialsOf = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("");

/**
 * "Profil Saya" — the same page for admin, staff and anak. A user can only ever
 * edit their own row: every write below is keyed on the session's own uid, and
 * the profiles RLS policy pins `role`/`status` so neither can be self-assigned.
 */
export function ProfilePage() {
  const { user, ready } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? "");
    setAvatar(user.avatar ?? "");
    setAvatarBroken(false);
    setDirty(false);
  }, [user]);

  if (!ready && !user) return <ProfileSkeleton />;

  if (!user)
    return (
      <Card className="mx-auto max-w-2xl border-border/60 p-10 text-center">
        <p className="text-sm font-medium">Sesi tidak dijumpai</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sila log masuk semula untuk melihat profil anda.
        </p>
      </Card>
    );

  const handleAvatarFile = async (file?: File) => {
    if (!file) return;
    const reason = validateImageFile(file);
    if (reason) {
      setUploadError(reason);
      toast.error(reason);
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const { url } = await uploadAvatar(file, user.id);
      // Persist immediately so the sidebar updates without needing Save.
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
      setAvatar(url);
      setAvatarBroken(false);
      await refreshCurrentUser();
      toast.success("Gambar profil dikemas kini");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Muat naik gambar gagal";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAvatar = async () => {
    setUploading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);
    setUploading(false);
    if (error) return toast.error(error.message);
    setAvatar("");
    setAvatarBroken(false);
    await refreshCurrentUser();
    toast.success("Gambar profil dibuang");
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), phone: phone.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refreshCurrentUser();
    setDirty(false);
    toast.success("Profil dikemas kini");
  };

  const changePassword = async () => {
    if (!pw.current) {
      toast.error("Sila masukkan kata laluan semasa.");
      return;
    }
    if (pw.next.length < 6) {
      toast.error("Kata laluan baharu mesti sekurang-kurangnya 6 aksara.");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("Pengesahan kata laluan tidak sepadan.");
      return;
    }
    setChangingPw(true);
    try {
      // Re-authenticate first: Supabase does not ask for the old password on
      // updateUser, so verifying it here is what stops a hijacked open tab.
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: pw.current,
      });
      if (signInErr) throw new Error("Kata laluan semasa tidak betul.");

      const { error } = await supabase.auth.updateUser({ password: pw.next });
      if (error) throw new Error(error.message);

      setPw({ current: "", next: "", confirm: "" });
      toast.success("Kata laluan berjaya ditukar");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menukar kata laluan.");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Profil Saya</h1>
        <p className="text-sm text-muted-foreground">
          Kemas kini maklumat akaun dan kata laluan anda.
        </p>
      </div>

      {/* Avatar */}
      <Card className="border-border/60 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Gambar Profil
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-20 w-20">
            {avatar && !avatarBroken && (
              <AvatarImage
                src={avatar}
                alt={user.name}
                onError={() => setAvatarBroken(true)}
              />
            )}
            <AvatarFallback className="gradient-teal font-display text-lg font-bold text-teal-foreground">
              {initialsOf(user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                <label className="cursor-pointer">
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  {uploading ? "Memuat naik..." : avatar ? "Ganti Gambar" : "Muat Naik Gambar"}
                  <input
                    ref={fileRef}
                    type="file"
                    accept={IMAGE_ACCEPT}
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => void handleAvatarFile(e.target.files?.[0])}
                  />
                </label>
              </Button>
              {avatar && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={uploading}
                  onClick={() => void removeAvatar()}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Buang
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, JPEG, PNG atau WebP · maksimum 5 MB
            </p>
            {uploading && (
              <div
                role="progressbar"
                aria-label="Memuat naik gambar profil"
                className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted"
              >
                <div className="h-full w-full animate-pulse rounded-full bg-primary/70" />
              </div>
            )}
            {avatarBroken && avatar && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> Gambar gagal dimuatkan.
              </p>
            )}
            {uploadError && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {uploadError}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Account details */}
      <Card className="border-border/60 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Maklumat Akaun
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="profil-nama">
              Nama Penuh *
            </Label>
            <Input
              id="profil-nama"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDirty(true);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="profil-telefon">
              No. Telefon
            </Label>
            <Input
              id="profil-telefon"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setDirty(true);
              }}
              placeholder="012-3456789"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="profil-emel">
              Emel
            </Label>
            <Input id="profil-emel" value={user.email} disabled readOnly />
            <p className="text-[11px] text-muted-foreground">
              Emel ialah ID log masuk anda dan tidak boleh diubah di sini.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Peranan</Label>
            <div className="flex h-9 items-center">
              <Badge variant="outline" className={roleTone[user.role] ?? ""}>
                {ROLE_LABEL[user.role] ?? user.role}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Peranan hanya boleh ditukar oleh admin melalui Pengurusan Staf.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={() => void saveProfile()} disabled={saving || !dirty}>
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </Card>

      {/* Password */}
      <Card className="border-border/60 p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tukar Kata Laluan
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Pilihan — biarkan kosong jika anda tidak mahu menukarnya.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs" htmlFor="pw-semasa">
              Kata Laluan Semasa
            </Label>
            <PasswordInput
              id="pw-semasa"
              value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="pw-baharu">
              Kata Laluan Baharu
            </Label>
            <PasswordInput
              id="pw-baharu"
              value={pw.next}
              onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
              placeholder="Min. 6 aksara"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="pw-sah">
              Sahkan Kata Laluan
            </Label>
            <PasswordInput
              id="pw-sah"
              value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button
            variant="outline"
            onClick={() => void changePassword()}
            disabled={changingPw || !pw.current || !pw.next || !pw.confirm}
          >
            {changingPw ? "Menukar..." : "Tukar Kata Laluan"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
