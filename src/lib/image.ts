"use client"

import imageCompression from "browser-image-compression"

import { canUseDemoMode, hasSupabase } from "@/lib/env"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export async function compressImage(file: File) {
  return imageCompression(file, {
    maxWidthOrHeight: 800,
    maxSizeMB: 1,
    useWebWorker: true
  })
}

export async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadImage(file: File, folder: string) {
  const compressed = await compressImage(file)

  if (!hasSupabase) {
    if (!canUseDemoMode) {
      throw new Error("Image uploads need Supabase storage before launch.")
    }
    return fileToDataUrl(compressed as File)
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    if (!canUseDemoMode) {
      throw new Error("Image uploads need Supabase storage before launch.")
    }
    return fileToDataUrl(compressed as File)
  }

  const extension = compressed.name.split(".").pop() ?? "jpg"
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

  const { error } = await supabase.storage
    .from("store-assets")
    .upload(path, compressed, {
      cacheControl: "3600",
      upsert: true
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from("store-assets").getPublicUrl(path)
  return data.publicUrl
}

export async function uploadImages(
  files: Iterable<File>,
  folder: string
) {
  return Promise.all(Array.from(files, (file) => uploadImage(file, folder)))
}
