import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 20 MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 20 MB." }, { status: 400 });
    }

    const allowedSpecificTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ];

    const rawType = file.type || "";
    const baseType = rawType.split(";")[0].toLowerCase().trim();

    const isAllowed =
      baseType.startsWith("image/") ||
      baseType.startsWith("audio/") ||
      allowedSpecificTypes.includes(baseType);

    if (!isAllowed) {
      return NextResponse.json({ error: `File type not allowed (${baseType || 'unknown'})` }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "bin";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${userId}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("message-attachments")
      .upload(path, buffer, {
        contentType: rawType || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage
      .from("message-attachments")
      .getPublicUrl(path);

    return NextResponse.json({
      success: true,
      path,
      publicUrl: publicData.publicUrl,
      fileName: file.name,
      mimeType: rawType || baseType,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error("Error uploading message attachment:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
