import Link from "next/link";
import { notFound } from "next/navigation";
import type { ListWithItems } from "@utado/shared";
import { AlbumCover } from "../../../../components/ui/AlbumCover";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { ListOwnerControls } from "../../../../components/lists/ListOwnerControls";
import { RemoveFromListButton } from "../../../../components/lists/RemoveFromListButton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function getList(id: string): Promise<ListWithItems | null> {
  const res = await fetch(`${API_URL}/lists/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load list");
  return res.json();
}

export default async function ListPage({ params }: { params: { id: string } }) {
  const list = await getList(params.id);
  if (!list) notFound();

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <AppHeader />

        <div className="mt-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brown-dark">List</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-charcoal">{list.title}</h1>
            <p className="mt-1 text-sm text-charcoal/50">
              By{" "}
              <Link href={`/profile/${list.userId}`} className="hover:underline">
                @{list.username}
              </Link>{" "}
              &middot; {list.itemsCount} {list.itemsCount === 1 ? "song" : "songs"}
            </p>
            {list.description && <p className="mt-4 max-w-xl text-charcoal/70">{list.description}</p>}
          </div>
          <ListOwnerControls listId={list.id} ownerId={list.userId} />
        </div>

        <div className="mt-10">
          {list.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-charcoal/40">No songs in this list yet.</p>
          ) : (
            <ul className="divide-y divide-charcoal/10 rounded-xl2 bg-white/60 shadow-soft">
              {list.items.map((item, i) => (
                <li key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <span className="w-5 text-sm text-charcoal/30">{i + 1}</span>
                  <Link href={`/songs/${item.songId}`} className="shrink-0">
                    <AlbumCover src={item.songCoverUrl} alt={item.songTitle} size={48} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/songs/${item.songId}`}
                      className="font-semibold text-charcoal hover:underline"
                    >
                      {item.songTitle}
                    </Link>
                    <p className="text-xs text-charcoal/50">{item.artistName}</p>
                  </div>
                  <RemoveFromListButton listId={list.id} songId={item.songId} ownerId={list.userId} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
