import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  let userId: string | null = null;

  try {
    // Auth — admin only
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    userId = user.id;

    const adminClient = createSupabaseAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse form data
    const formData   = await req.formData();
    const file       = formData.get("file") as File | null;
    const reviewerId = (formData.get("reviewerId") as string)?.trim();
    const docType    = (formData.get("docType") as string)?.trim() || "other";
    const notes      = (formData.get("notes") as string)?.trim() || null;

    if (!file)       return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!reviewerId) return NextResponse.json({ error: "reviewerId is required." }, { status: 400 });

    // Validate type (PDF only)
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds the 10 MB limit." }, { status: 400 });
    }

    // Validate docType
    const validDocTypes = ["nda", "contract", "other"];
    if (!validDocTypes.includes(docType)) {
      return NextResponse.json({ error: "Invalid document type." }, { status: 400 });
    }

    // Upload to Supabase Storage
    const storePath = `reviewer-contracts/${reviewerId}/${randomUUID()}.pdf`;
    const buffer    = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await adminClient.storage
      .from("documents")
      .upload(storePath, buffer, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      await logError({
        error: uploadError,
        source: "api/admin/reviewer-documents/upload",
        action: "POST:storage",
        userId,
        metadata: { reviewer_id: reviewerId, file_name: file.name },
      });
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
    }

    // Insert DB record
    const { data: doc, error: dbError } = await adminClient
      .from("reviewer_documents")
      .insert({
        reviewer_id:  reviewerId,
        file_name:    file.name,
        storage_path: storePath,
        doc_type:     docType,
        uploaded_by:  user.id,
        notes,
      })
      .select()
      .single();

    if (dbError || !doc) {
      // Roll back storage upload
      await adminClient.storage.from("documents").remove([storePath]);
      await logError({
        error: dbError ?? new Error("No doc row returned"),
        source: "api/admin/reviewer-documents/upload",
        action: "POST:db",
        userId,
        metadata: { reviewer_id: reviewerId, file_name: file.name },
      });
      return NextResponse.json({ error: "Failed to save document record." }, { status: 500 });
    }

    // Activity log
    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "upload_reviewer_document",
      entity_type: "reviewer_documents",
      entity_id:   reviewerId,
      metadata:    { doc_id: doc.id, file_name: file.name, doc_type: docType },
    });

    return NextResponse.json({ document: doc });

  } catch (err) {
    await logError({
      error: err,
      source: "api/admin/reviewer-documents/upload",
      action: "POST",
      userId,
    });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
