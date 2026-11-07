import { getSupabaseClient } from "@/lib/supabase/client";
import type { ResumeVersionRow } from "@/lib/supabase/database.types";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

const checksum = async (file: File) => {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const listResumes = async (): Promise<ResumeVersionRow[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client.from("resume_versions").select("*").order("version", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const uploadResume = async (file: File) => {
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Resume uploads must be PDF files.");
  }
  if (file.size > MAX_PDF_BYTES) throw new Error("The resume must be smaller than 10 MB.");
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(bytes) !== "%PDF-") throw new Error("This file is not a valid PDF.");
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error("Your admin session expired.");
  const id = crypto.randomUUID();
  const path = `${auth.user.id}/${id}.pdf`;
  const { error: uploadError } = await client.storage.from("portfolio-resumes").upload(path, file, { contentType: "application/pdf", upsert: false });
  if (uploadError) throw new Error(uploadError.message);
  const { data, error } = await client.from("resume_versions").insert({
    id,
    storage_path: path,
    original_filename: file.name,
    mime_type: "application/pdf",
    byte_size: file.size,
    checksum_sha256: await checksum(file),
    is_active: false,
    created_by: auth.user.id,
  }).select("*").single();
  if (error) {
    await client.storage.from("portfolio-resumes").remove([path]);
    throw new Error(error.message);
  }
  return data;
};

export const activateResume = async (id: string) => {
  const { data, error } = await getSupabaseClient()!.rpc("activate_resume", { p_resume_id: id });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
};

export const getResumeUrl = async (path: string) => {
  const { data, error } = await getSupabaseClient()!.storage.from("portfolio-resumes").createSignedUrl(path, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
};
