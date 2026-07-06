import Link from "next/link";
import { notFound } from "next/navigation";
import type { ListWithItems } from "@utado/shared";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { FloatingDiscs } from "../../../../components/brand/FloatingDiscs";
import { ListOwnerControls } from "../../../../components/lists/ListOwnerControls";
import { ReorderableListItems } from "../../../../components/lists/ReorderableListItems";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function getList(id: string): Promise<ListWithItems | null> {
  const res = await fetch(`${API_URL}/lists/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load list");
  return res.json();
}

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = await getList(id);
  if (!list) notFound();

  return (
    <main className="relative min-h-screen bg-surface px-6 py-10 sm:px-10">
      <FloatingDiscs density="minimal" />
      <div className="mx-auto max-w-3xl">
        <AppHeader />

        <div className="mt-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-ink-secondary">List</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">{list.title}</h1>
            <p className="mt-1 text-sm text-ink/50">
              By{" "}
              <Link href={`/profile/${list.userId}`} className="hover:underline">
                @{list.username}
              </Link>{" "}
              &middot; {list.itemsCount} {list.itemsCount === 1 ? "song" : "songs"}
            </p>
            {list.description && <p className="mt-4 max-w-xl text-ink/70">{list.description}</p>}
          </div>
          <ListOwnerControls
            listId={list.id}
            ownerId={list.userId}
            title={list.title}
            description={list.description}
          />
        </div>

        <div className="mt-10">
          <ReorderableListItems listId={list.id} ownerId={list.userId} initialItems={list.items} />
        </div>
      </div>
    </main>
  );
}
