import { NextResponse } from "next/server";
import { getBoardView } from "@/lib/board-access";
import { getCurrentUser } from "@/lib/data";

/**
 * The board data as JSON.
 *
 * The page renders server-side and doesn't need this, but the visibility rules
 * are the most important thing in the app and "the UI doesn't show it" is not
 * evidence of anything. This endpoint exists so the rules can be checked
 * against the raw payload — which is what an actual curious relative with
 * devtools would be looking at.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const view = await getBoardView(
    user.sweepstake,
    user.participant.committedAt !== null,
  );

  return NextResponse.json(view, {
    headers: { "Cache-Control": "no-store" },
  });
}
