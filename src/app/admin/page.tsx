import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { participant as participantTable } from "@/db/schema";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { AdminSignIn } from "@/components/admin/AdminSignIn";
import { getResult, getSweepstake } from "@/lib/data";
import { getAdminSession } from "@/lib/session";

export default async function AdminPage() {
  const sweepstake = await getSweepstake();
  const adminSweepstakeId = await getAdminSession();
  const isHost = adminSweepstakeId === sweepstake.id;

  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6 pb-14">
      <header className="flex items-center justify-between gap-3">
        <h1 className="marker-caps text-3xl">Host tools</h1>
        <Link href="/board" className="min-h-[44px] text-base underline decoration-2 underline-offset-4">
          Back to the board
        </Link>
      </header>

      {isHost ? (
        <HostView sweepstakeId={sweepstake.id} />
      ) : (
        <section className="drawn px-5 py-5">
          <AdminSignIn />
        </section>
      )}
    </main>
  );
}

async function HostView({ sweepstakeId }: { sweepstakeId: string }) {
  const sweepstake = await getSweepstake();
  const result = await getResult(sweepstakeId);
  const db = await getDb();
  const participants = await db
    .select()
    .from(participantTable)
    .where(eq(participantTable.sweepstakeId, sweepstakeId))
    .orderBy(asc(participantTable.createdAt));

  return (
    <AdminPanel
      sweepstake={sweepstake}
      result={result}
      participants={participants}
    />
  );
}
