import Image from "next/image";
import Link from "next/link";
import type { List } from "@utado/shared";

export function ListCard({ list }: { list: List }) {
  const covers = list.coverUrls ?? [];

  return (
    <Link href={`/lists/${list.id}`} className="block w-40">
      <div
        className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl2 bg-ink-muted/20 shadow-soft"
        style={{ width: 160, height: 160 }}
      >
        {covers.length === 0 ? (
          <div className="col-span-2 row-span-2 flex items-center justify-center text-sm text-ink/30">
            No songs yet
          </div>
        ) : (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="relative bg-ink-muted/20" style={{ width: 79, height: 79 }}>
              {covers[i] && <Image src={covers[i]!} alt="" fill className="object-cover" />}
            </div>
          ))
        )}
      </div>
      <p className="mt-2 truncate font-semibold text-ink">{list.title}</p>
      <p className="text-xs text-ink/50">
        {list.itemsCount} {list.itemsCount === 1 ? "song" : "songs"}
      </p>
    </Link>
  );
}
