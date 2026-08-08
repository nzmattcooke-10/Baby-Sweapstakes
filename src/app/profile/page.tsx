import Link from "next/link";
import { Icon } from "@/components/zine/Icon";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { requireUser } from "@/lib/data";

export default async function ProfilePage() {
  const { participant } = await requireUser();

  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-7 px-5 pt-8 pb-14">
      <header className="flex flex-col gap-2">
        <Link
          href="/board"
          className="flex min-h-[44px] items-center gap-1.5 self-start text-base text-ink-soft underline decoration-2 underline-offset-4"
        >
          <Icon name="arrow" size={20} strokeWidth={2.4} className="rotate-180" />
          Back to the board
        </Link>
        <h1 className="marker-caps text-3xl leading-tight">Edit your details</h1>
      </header>

      <ProfileForm participant={participant} />
    </main>
  );
}
