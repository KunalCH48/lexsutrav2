import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  let userId: string | null = null;

  try {
    // Auth — must be a logged-in client who owns this diagnostic
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    userId = user.id;

    const adminClient = createSupabaseAdminClient();

    // Parse multipart form
    const form = await req.formData();
    const file        = form.get("file")        as File | null;
    const diagnosticId = form.get("diagnosticId") as string | null;
    const questionId  = form.get("questionId")  as string | null;

    if (!file || !diagnosticId || !questionId) {
      return NextResponse.json({ error: "Missing file, diagnosticId, or questionId" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only PDF, DOCX, and XLSX files are allowed." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File must be 25 MB or smaller." }, { status: 400 });
    }

    // Verify the user's profile and company
    const { data: profile } = await adminClient
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["client", "admin", "reviewer"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify the diagnostic belongs to this user's company (skip for admin/reviewer)
    if (profile.role === "client") {
      const { data: diag } = await adminClient
        .from("diagnostics")
        .select("ai_system_id")
        .eq("id", diagnosticId)
        .single();

      if (!diag) return NextResponse.json({ error: "Diagnostic not found" }, { status: 404 });

      const { data: sys } = await adminClient
        .from("ai_systems")
        .select("company_id")
        .eq("id", diag.ai_system_id)
        .single();

      if (!sys || sys.company_id !== profile.company_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Sanitise filename and build storage path
    const sanitisedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath   = `${diagnosticId}/${questionId}/${sanitisedName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await adminClient.storage
      .from("diagnostic-files")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      await logError({
        error: uploadError,
        source: "api/diagnostics/upload",
        action: "POST:storageUpload",
        userId,
        metadata: { diagnosticId, questionId, storagePath },
      });
      return NextResponse.json({ error: "File upload failed. Please try again." }, { status: 500 });
    }

    // Upsert the response row with file_path and file_name
    const { error: upsertError } = await adminClient
      .from("diagnostic_responses")
      .upsert(
        {
          diagnostic_id: diagnosticId,
          question_id:   questionId,
          file_path:     storagePath,
          file_name:     file.name,
        },
        { onConflict: "diagnostic_id,question_id" }
      );

    if (upsertError) {
      await logError({
        error: upsertError,
        source: "api/diagnostics/upload",
        action: "POST:upsertResponse",
        userId,
        metadata: { diagnosticId, questionId },
      });
      return NextResponse.json({ error: "Failed to record file upload." }, { status: 500 });
    }

    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "upload_diagnostic_file",
      entity_type: "diagnostics",
      entity_id:   diagnosticId,
      metadata:    { question_id: questionId, file_name: file.name, file_size: file.size },
    });

    return NextResponse.json({ path: storagePath, name: file.name });

  } catch (err) {
    await logError({
      error: err,
      source: "api/diagnostics/upload",
      action: "POST",
      userId,
      metadata: {},
    });
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
