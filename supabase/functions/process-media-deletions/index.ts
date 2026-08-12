import { createClient } from "npm:@supabase/supabase-js@2";
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const MAX_EXECUTION_TIME_MS = 45_000;
const BATCH_SIZE = 10;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5 * 60 * 1000;

Deno.serve(async (req) => {
  const workerSecret = Deno.env.get("MEDIA_DELETION_WORKER_SECRET");
  const providedSecret = req.headers.get("x-worker-secret");

  if (!workerSecret || providedSecret !== workerSecret) {
    return Response.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }
  const startedAt = Date.now();

  const workerId =
    Deno.env.get("SB_EXECUTION_ID") ??
    `edge-worker-${crypto.randomUUID()}`;

  let processedCount = 0;
  let failedCount = 0;

  try {
    while (Date.now() - startedAt < MAX_EXECUTION_TIME_MS) {
      const { data: jobs, error: claimError } = await supabaseAdmin.rpc(
        "claim_media_deletion_jobs",
        {
          p_limit: BATCH_SIZE,
          p_worker_id: workerId,
        }
      );

      if (claimError) {
        throw claimError;
      }

      if (!jobs || jobs.length === 0) {
        break;
      }

      for (const job of jobs) {
        if (Date.now() - startedAt >= MAX_EXECUTION_TIME_MS) {
          break;
        }

        try {
          if (job.provider === "supabase") {
            await deleteFromSupabase(job);
          } else if (job.provider === "cloudflare_stream") {
            throw new Error(
              "Cloudflare Stream deletion is not implemented yet"
            );
          } else if (job.provider === "mux") {
            throw new Error(
              "Mux deletion is not implemented yet"
            );
          } else {
            throw new Error(
              `Unsupported media provider: ${job.provider}`
            );
          }

          const { error: completeError } = await supabaseAdmin
            .from("media_deletion_jobs")
            .update({
              status: "completed",
              processed_at: new Date().toISOString(),
              next_retry_at: null,
              locked_at: null,
              locked_by: null,
              error_message: null,
            })
            .eq("id", job.id)
            .eq("locked_by", workerId);

          if (completeError) {
            throw completeError;
          }

          processedCount++;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);

          const nextRetryCount =
            (job.retry_count ?? 0) + 1;

          const finalFailure =
            nextRetryCount >= MAX_RETRIES;

          const { error: retryError } = await supabaseAdmin
            .from("media_deletion_jobs")
            .update({
              status: finalFailure ? "failed" : "retry",
              retry_count: nextRetryCount,
              next_retry_at: finalFailure
                ? null
                : new Date(
                  Date.now() + RETRY_DELAY_MS
                ).toISOString(),
              error_message: message,
              last_error_at: new Date().toISOString(),
              locked_at: null,
              locked_by: null,
            })
            .eq("id", job.id)
            .eq("locked_by", workerId);

          if (retryError) {
            console.error(
              `Failed to update retry state for job ${job.id}`,
              retryError
            );
          }

          failedCount++;
        }
      }
    }

    return Response.json({
      success: true,
      processed_count: processedCount,
      failed_count: failedCount,
      execution_time_ms: Date.now() - startedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    return Response.json(
      {
        success: false,
        error: message,
        processed_count: processedCount,
        failed_count: failedCount,
      },
      { status: 500 }
    );
  }
});

async function deleteFromSupabase(job: {
  id: string;
  bucket_id: string | null;
  storage_path: string | null;
}) {
  if (!job.bucket_id || !job.storage_path) {
    throw new Error(
      "Supabase deletion job is missing bucket_id or storage_path"
    );
  }

  const { error } = await supabaseAdmin.storage
    .from(job.bucket_id)
    .remove([job.storage_path]);

  if (!error) {
    return;
  }

  const message =
    error.message?.toLowerCase() ?? "";

  const name =
    error.name?.toLowerCase() ?? "";

  if (
    message.includes("not found") ||
    message.includes("does not exist") ||
    name.includes("notfound")
  ) {
    return;
  }

  throw error;
}