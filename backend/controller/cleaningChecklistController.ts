import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";

/**
 * Cleaning Checklist Controller
 *
 * Provides endpoints for:
 *  - GET  /api/admin/cleaners/checklist?haven_id=...
 *  - PATCH /api/admin/cleaners/checklist/tasks/[taskId]
 *  - POST  /api/admin/cleaners/checklist/save
 *  - POST  /api/admin/cleaners/checklist/submit
 */

/* ---------------------------
 * Default checklist template
 * --------------------------- */
const DEFAULT_CHECKLIST_TEMPLATE: { category: string; tasks: string[] }[] = [
  {
    category: "Bedroom",
    tasks: [
      "Make bed and change linens",
      "Dust furniture and surfaces",
      "Vacuum floor and rugs",
      "Clean mirrors and windows",
      "Empty trash bin",
    ],
  },
  {
    category: "Bathroom",
    tasks: [
      "Clean toilet, sink, and shower",
      "Replace towels and toiletries",
      "Mop floor",
      "Clean mirror",
      "Restock supplies",
    ],
  },
  {
    category: "Kitchen",
    tasks: [
      "Clean countertops and sink",
      "Wipe down appliances",
      "Clean microwave inside and out",
      "Mop floor",
      "Take out trash and recycling",
    ],
  },
  {
    category: "Living Room",
    tasks: [
      "Vacuum sofa and cushions",
      "Dust all surfaces",
      "Clean TV and entertainment center",
      "Vacuum or mop floor",
      "Arrange furniture and decor",
    ],
  },
  {
    category: "General",
    tasks: [
      "Check all light bulbs",
      "Wipe down door handles",
      "Check smoke detector",
      "Air out the unit",
      "Final walkthrough inspection",
    ],
  },
];

/* ---------------------------
 * Helper: group tasks by category
 * --------------------------- */

type TaskRow = {
  id: string;
  checklist_id: string;
  category: string;
  task_description: string;
  completed: boolean;
  display_order?: number;
};

function groupTasksByCategory(rows: TaskRow[]) {
  const categoriesMap: Record<
    string,
    {
      category: string;
      tasks: { id: string; task: string; completed: boolean }[];
    }
  > = {};

  rows.forEach((row: TaskRow) => {
    if (!categoriesMap[row.category]) {
      categoriesMap[row.category] = { category: row.category, tasks: [] };
    }
    categoriesMap[row.category].tasks.push({
      id: String(row.id),
      task: String(row.task_description),
      completed: !!row.completed,
    });
  });

  // Preserve insertion order of categories as they appeared
  return Object.values(categoriesMap);
}

/* ---------------------------
 * GET: Get or create checklist for a haven
 * Endpoint: GET /api/admin/cleaners/checklist?haven_id=...
 * --------------------------- */
export const getChecklistByHaven = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const havenId = searchParams.get("haven_id");

    if (!havenId) {
      return NextResponse.json(
        { success: false, error: "haven_id is required" },
        { status: 400 },
      );
    }

    // Ensure the haven exists
    const havenCheck = await pool.query(
      `SELECT uuid_id FROM havens WHERE uuid_id = $1`,
      [havenId],
    );
    if (havenCheck.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: "Haven not found" },
        { status: 404 },
      );
    }

    // Try to get the most recent checklist for this haven
    const checklistResult = await pool.query(
      `SELECT id, haven_id, status, completed_at, created_at, updated_at
       FROM cleaning_checklists
       WHERE haven_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [havenId],
    );

    // If checklist exists, fetch tasks and return grouped result
    if (checklistResult.rows.length > 0) {
      const checklist = checklistResult.rows[0];
      const tasksResult = await pool.query(
        `SELECT id, checklist_id, category, task_description, completed, display_order
         FROM cleaning_tasks
         WHERE checklist_id = $1
         ORDER BY display_order ASC, created_at ASC`,
        [checklist.id],
      );

      const categories = groupTasksByCategory(tasksResult.rows);

      return NextResponse.json({
        success: true,
        data: {
          checklist: {
            id: checklist.id,
            haven_id: checklist.haven_id,
            status: checklist.status,
            completed_at: checklist.completed_at,
            categories,
          },
        },
      });
    }

    // No checklist found -> create a new one using default template
    // We serialize creation using an advisory lock on the haven to avoid races
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Acquire an advisory lock derived from the haven_id hash to serialize
      // checklist creation for the same haven. Using an xact lock ensures the
      // lock is released at transaction end.
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`, [
        havenId,
      ]);

      // Re-check if a checklist was created while we waited for the lock
      const recheckRes = await client.query(
        `SELECT id, haven_id, status, completed_at, created_at, updated_at
         FROM cleaning_checklists
         WHERE haven_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [havenId],
      );

      if (recheckRes.rows.length > 0) {
        // Another request created it while we were waiting for the lock -
        // return that existing checklist.
        await client.query("COMMIT");

        const existing = recheckRes.rows[0];
        const tasksRes = await pool.query(
          `SELECT id, checklist_id, category, task_description, completed, display_order
           FROM cleaning_tasks
           WHERE checklist_id = $1
           ORDER BY display_order ASC, created_at ASC`,
          [existing.id],
        );

        const categories = groupTasksByCategory(tasksRes.rows as TaskRow[]);

        return NextResponse.json({
          success: true,
          data: {
            checklist: {
              id: existing.id,
              haven_id: existing.haven_id,
              status: existing.status,
              completed_at: existing.completed_at,
              categories,
            },
          },
        });
      }

      // Insert a new checklist (we hold the lock so this should not conflict)
      const createChecklistRes = await client.query(
        `INSERT INTO cleaning_checklists (haven_id, status, created_at, updated_at)
         VALUES ($1, 'pending', timezone('Asia/Manila', NOW()), timezone('Asia/Manila', NOW()))
         RETURNING *`,
        [havenId],
      );

      const checklistId = createChecklistRes.rows[0].id;

      // Insert tasks using display_order to preserve ordering
      let order = 1;
      for (const group of DEFAULT_CHECKLIST_TEMPLATE) {
        for (const taskText of group.tasks) {
          await client.query(
            `INSERT INTO cleaning_tasks (checklist_id, category, task_description, completed, display_order, created_at, updated_at)
             VALUES ($1, $2, $3, false, $4, timezone('Asia/Manila', NOW()), timezone('Asia/Manila', NOW()))`,
            [checklistId, group.category, taskText, order],
          );
          order++;
        }
      }

      await client.query("COMMIT");

      // Fetch inserted tasks to return
      const tasksResult = await pool.query(
        `SELECT id, checklist_id, category, task_description, completed, display_order
         FROM cleaning_tasks
         WHERE checklist_id = $1
         ORDER BY display_order ASC, created_at ASC`,
        [checklistId],
      );

      const categories = groupTasksByCategory(tasksResult.rows);

      return NextResponse.json({
        success: true,
        data: {
          checklist: {
            id: checklistId,
            haven_id: havenId,
            status: "pending",
            categories,
          },
        },
      });
    } catch (err) {
      // If something unexpected still caused a unique-violation, attempt to
      // recover by returning the existing checklist instead of failing hard.
      await client.query("ROLLBACK");

      type PgError = { code?: string | number; constraint?: string };
      const pgErr = err as PgError;

      if (
        pgErr &&
        (String(pgErr.code) === "23505" ||
          pgErr.constraint === "uniq_active_checklist_per_haven")
      ) {
        try {
          const existingRes = await pool.query(
            `SELECT id, haven_id, status, completed_at, created_at, updated_at
             FROM cleaning_checklists
             WHERE haven_id = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [havenId],
          );

          if (existingRes.rows.length > 0) {
            const existing = existingRes.rows[0];

            const tasksRes = await pool.query(
              `SELECT id, checklist_id, category, task_description, completed, display_order
               FROM cleaning_tasks
               WHERE checklist_id = $1
               ORDER BY display_order ASC, created_at ASC`,
              [existing.id],
            );

            const categories = groupTasksByCategory(tasksRes.rows as TaskRow[]);

            return NextResponse.json({
              success: true,
              data: {
                checklist: {
                  id: existing.id,
                  haven_id: existing.haven_id,
                  status: existing.status,
                  completed_at: existing.completed_at,
                  categories,
                },
              },
            });
          }
        } catch (innerErr) {
          const innerMessage =
            innerErr instanceof Error ? innerErr.message : String(innerErr);
          console.error(
            "Error while resolving unique-violation race:",
            innerMessage,
          );
          // fall through to generic error below
        }
      }

      const message = err instanceof Error ? err.message : String(err);
      console.error("Error creating default checklist:", message);
      return NextResponse.json(
        { success: false, error: message || "Failed to create checklist" },
        { status: 500 },
      );
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error getting checklist:", message);
    return NextResponse.json(
      { success: false, error: message || "Failed to get checklist" },
      { status: 500 },
    );
  }
};

/* ---------------------------
 * PATCH: Update a single task (toggle completion)
 * Endpoint: PATCH /api/admin/cleaners/checklist/tasks/[taskId]
 * --------------------------- */
export const updateTask = async (
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
): Promise<NextResponse> => {
  try {
    const { taskId } = await params;
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    if (typeof body.completed !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Field 'completed' (boolean) is required" },
        { status: 400 },
      );
    }

    // Update task
    const updateRes = await pool.query(
      `UPDATE cleaning_tasks
       SET completed = $1, updated_at = timezone('Asia/Manila', NOW())
       WHERE id = $2
       RETURNING id, checklist_id, category, task_description, completed`,
      [body.completed, taskId],
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 },
      );
    }

    const updatedTask = updateRes.rows[0];

    // Update checklist status accordingly:
    // - If no incomplete tasks remain -> completed (and set completed_at)
    // - Otherwise -> in_progress
    const incompleteCountRes = await pool.query(
      `SELECT COUNT(*)::int AS incomplete_count
       FROM cleaning_tasks
       WHERE checklist_id = $1
       AND completed = false`,
      [updatedTask.checklist_id],
    );

    let incompleteCount = parseInt(
      incompleteCountRes.rows[0]?.incomplete_count || "0",
      10,
    );

    // Helper: set checklist status safely and attempt recovery if a unique
    // constraint race is encountered (duplicate active checklists).
    async function setChecklistStatusSafely(
      checklistId: string,
      desiredStatus: "completed" | "in_progress",
    ) {
      try {
        if (desiredStatus === "completed") {
          await pool.query(
            `UPDATE cleaning_checklists
             SET status = 'completed', completed_at = timezone('Asia/Manila', NOW()), updated_at = timezone('Asia/Manila', NOW())
             WHERE id = $1`,
            [checklistId],
          );
        } else {
          await pool.query(
            `UPDATE cleaning_checklists
             SET status = 'in_progress', updated_at = timezone('Asia/Manila', NOW())
             WHERE id = $1`,
            [checklistId],
          );
        }
      } catch (err) {
        const pgErr = err as { code?: string | number; constraint?: string };
        const isUniqueViolation =
          String(pgErr?.code) === "23505" ||
          pgErr?.constraint === "uniq_active_checklist_per_haven";

        if (!isUniqueViolation) {
          // Not the unique-violation we're handling here - surface the error
          throw err;
        }

        // Attempt to resolve the duplicate-active-checklist situation:
        // 1) Find haven for the checklist
        // 2) Find the latest active checklist for that haven
        // 3) Move the task to the latest active checklist (if different)
        // 4) Delete older duplicate active checklists
        // 5) Recompute incomplete count and set checklist status accordingly
        try {
          const havenRes = await pool.query(
            `SELECT haven_id FROM cleaning_checklists WHERE id = $1`,
            [checklistId],
          );
          const havenId = havenRes.rows[0]?.haven_id;
          if (!havenId) {
            // Can't resolve without haven context - rethrow original
            throw err;
          }

          const latestRes = await pool.query(
            `SELECT id FROM cleaning_checklists
             WHERE haven_id = $1
             AND status != 'completed'
             ORDER BY created_at DESC
             LIMIT 1`,
            [havenId],
          );
          const latestChecklistId = latestRes.rows[0]?.id;

          if (latestChecklistId && latestChecklistId !== checklistId) {
            // Move this task to the latest active checklist so the update
            // applies to the current active checklist.
            await pool.query(
              `UPDATE cleaning_tasks SET checklist_id = $1, updated_at = timezone('Asia/Manila', NOW()) WHERE id = $2`,
              [latestChecklistId, updatedTask.id],
            );
            updatedTask.checklist_id = latestChecklistId;
          }

          // Remove older duplicates, keeping only the most recent active checklist
          await pool.query(
            `WITH duplicates AS (
               SELECT id, ROW_NUMBER() OVER (PARTITION BY haven_id ORDER BY created_at DESC) rn
               FROM cleaning_checklists
               WHERE haven_id = $1 AND status != 'completed'
             )
             DELETE FROM cleaning_checklists WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)`,
            [havenId],
          );

          // Recompute incomplete count for the (possibly moved) checklist
          const recomputeRes = await pool.query(
            `SELECT COUNT(*)::int AS incomplete_count
             FROM cleaning_tasks
             WHERE checklist_id = $1
             AND completed = false`,
            [updatedTask.checklist_id],
          );

          incompleteCount = parseInt(
            recomputeRes.rows[0]?.incomplete_count || "0",
            10,
          );

          // Finally, set the checklist status according to the recomputed count
          if (incompleteCount === 0) {
            await pool.query(
              `UPDATE cleaning_checklists
               SET status = 'completed', completed_at = timezone('Asia/Manila', NOW()), updated_at = timezone('Asia/Manila', NOW())
               WHERE id = $1`,
              [updatedTask.checklist_id],
            );
          } else {
            await pool.query(
              `UPDATE cleaning_checklists
               SET status = 'in_progress', updated_at = timezone('Asia/Manila', NOW())
               WHERE id = $1`,
              [updatedTask.checklist_id],
            );
          }
        } catch (innerErr) {
          const innerMessage =
            innerErr instanceof Error ? innerErr.message : String(innerErr);
          console.error(
            "Error resolving unique-violation when updating checklist status:",
            innerMessage,
          );
          // Re-throw original (or inner) so outer handler returns a 500
          throw err;
        }
      }
    }

    if (incompleteCount === 0) {
      await setChecklistStatusSafely(updatedTask.checklist_id, "completed");
    } else {
      await setChecklistStatusSafely(updatedTask.checklist_id, "in_progress");
    }

    return NextResponse.json({
      success: true,
      data: { task: updatedTask, incompleteCount },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error updating task:", message);
    return NextResponse.json(
      { success: false, error: message || "Failed to update task" },
      { status: 500 },
    );
  }
};

/* ---------------------------
 * POST: Save checklist progress (bulk update)
 * Endpoint: POST /api/admin/cleaners/checklist/save
 * Body: { checklist_id: string, tasks: [{ id: string, completed: boolean }] }
 * --------------------------- */
export const saveChecklistProgress = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { checklist_id, tasks } = body || {};

    if (!checklist_id || !Array.isArray(tasks)) {
      return NextResponse.json(
        { success: false, error: "checklist_id and tasks array are required" },
        { status: 400 },
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const t of tasks) {
        if (!t || !t.id || typeof t.completed !== "boolean") continue;
        await client.query(
          `UPDATE cleaning_tasks
           SET completed = $1, updated_at = timezone('Asia/Manila', NOW())
           WHERE id = $2`,
          [t.completed, t.id],
        );
      }

      // Recompute checklist status
      const incompleteCountRes = await client.query(
        `SELECT COUNT(*)::int AS incomplete_count
         FROM cleaning_tasks
         WHERE checklist_id = $1
         AND completed = false`,
        [checklist_id],
      );

      let incompleteCount = parseInt(
        incompleteCountRes.rows[0]?.incomplete_count || "0",
        10,
      );

      // Attempt status update, with dedupe & migration fallback for unique-violation races.
      // If a unique constraint on active checklists is triggered (possible when
      // pre-existing duplicates exist), we try to recover by:
      //  - finding the haven for the checklist,
      //  - moving tasks from the current checklist into the latest active checklist (if different),
      //  - removing older duplicate active checklists,
      //  - recomputing the incomplete count and finally setting status on the
      //    appropriate checklist.
      const attemptStatusUpdate = async (id: string) => {
        // Helper to apply a status to a given checklist id inside the transaction.
        const applyStatus = async (
          status: "completed" | "in_progress",
          targetId: string,
        ) => {
          if (status === "completed") {
            await client.query(
              `UPDATE cleaning_checklists
               SET status = 'completed', completed_at = timezone('Asia/Manila', NOW()), updated_at = timezone('Asia/Manila', NOW())
               WHERE id = $1`,
              [targetId],
            );
          } else {
            await client.query(
              `UPDATE cleaning_checklists
               SET status = 'in_progress', updated_at = timezone('Asia/Manila', NOW())
               WHERE id = $1`,
              [targetId],
            );
          }
        };

        try {
          // Normal path: try to set status on the given checklist id.
          if (incompleteCount === 0) {
            await applyStatus("completed", id);
          } else {
            await applyStatus("in_progress", id);
          }
        } catch (err) {
          // Detect Postgres unique-violation (duplicate active checklist)
          const pgErr = err as { code?: string | number; constraint?: string };
          const isUniqueViolation =
            String(pgErr?.code) === "23505" ||
            pgErr?.constraint === "uniq_active_checklist_per_haven";

          if (!isUniqueViolation) throw err;

          // Recovery path: attempt to dedupe & merge changes into the latest active checklist.
          try {
            const havenRes = await client.query(
              `SELECT haven_id FROM cleaning_checklists WHERE id = $1 LIMIT 1`,
              [id],
            );
            const havenId = havenRes.rows[0]?.haven_id;
            if (!havenId) throw err;

            // Find the latest active (non-completed) checklist for the haven
            const latestRes = await client.query(
              `SELECT id FROM cleaning_checklists
               WHERE haven_id = $1 AND status != 'completed'
               ORDER BY created_at DESC
               LIMIT 1`,
              [havenId],
            );
            const latestId = latestRes.rows[0]?.id;

            let targetId = id;

            if (latestId && latestId !== id) {
              // Move all tasks from the current checklist to the latest active checklist
              await client.query(
                `UPDATE cleaning_tasks
                 SET checklist_id = $1, updated_at = timezone('Asia/Manila', NOW())
                 WHERE checklist_id = $2`,
                [latestId, id],
              );
              targetId = latestId;
            }

            // Remove older active duplicates, keeping only the most recent per haven
            await client.query(
              `WITH duplicates AS (
                 SELECT id, ROW_NUMBER() OVER (PARTITION BY haven_id ORDER BY created_at DESC) rn
                 FROM cleaning_checklists
                 WHERE haven_id = $1 AND status != 'completed'
               )
               DELETE FROM cleaning_checklists
               WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)`,
              [havenId],
            );

            // Recompute incomplete count for the (possibly moved) checklist
            const recompute = await client.query(
              `SELECT COUNT(*)::int AS incomplete_count
               FROM cleaning_tasks
               WHERE checklist_id = $1
               AND completed = false`,
              [targetId],
            );

            incompleteCount = parseInt(
              recompute.rows[0]?.incomplete_count || "0",
              10,
            );

            // Finally, set status on the resolved checklist (targetId)
            if (incompleteCount === 0) {
              await applyStatus("completed", targetId);
            } else {
              await applyStatus("in_progress", targetId);
            }
          } catch (innerErr) {
            console.error(
              "Error while resolving unique-violation in saveChecklistProgress:",
              innerErr,
            );
            // Re-throw the original to let the outer handler rollback and notify the client
            throw err;
          }
        }
      };

      await attemptStatusUpdate(checklist_id);

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Checklist progress saved",
        data: { incompleteCount },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error saving checklist progress:", message);
      return NextResponse.json(
        {
          success: false,
          error: message || "Failed to save checklist progress",
        },
        { status: 500 },
      );
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in saveChecklistProgress:", message);
    return NextResponse.json(
      { success: false, error: message || "Failed to save checklist progress" },
      { status: 500 },
    );
  }
};

/* ---------------------------
 * POST: Submit checklist (finalize)
 * Endpoint: POST /api/admin/cleaners/checklist/submit
 * Body: { checklist_id: string }
 *
 * Submission is only allowed when all tasks are completed.
 * --------------------------- */
export const submitChecklist = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { checklist_id } = body || {};

    if (!checklist_id) {
      return NextResponse.json(
        { success: false, error: "checklist_id is required" },
        { status: 400 },
      );
    }

    // Check for incomplete tasks
    const incompleteCountRes = await pool.query(
      `SELECT COUNT(*)::int AS incomplete_count
       FROM cleaning_tasks
       WHERE checklist_id = $1
       AND completed = false`,
      [checklist_id],
    );

    const incompleteCount = parseInt(
      incompleteCountRes.rows[0]?.incomplete_count || "0",
      10,
    );

    if (incompleteCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot submit: there are incomplete tasks",
          incompleteCount,
        },
        { status: 400 },
      );
    }

    // Mark checklist as completed
    const updateRes = await pool.query(
      `UPDATE cleaning_checklists
       SET status = 'completed', completed_at = timezone('Asia/Manila', NOW()), updated_at = timezone('Asia/Manila', NOW())
       WHERE id = $1
       RETURNING id, haven_id, status, completed_at, created_at, updated_at`,
      [checklist_id],
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Checklist not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Checklist submitted successfully",
      data: { checklist: updateRes.rows[0] },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error submitting checklist:", message);
    return NextResponse.json(
      { success: false, error: message || "Failed to submit checklist" },
      { status: 500 },
    );
  }
};
