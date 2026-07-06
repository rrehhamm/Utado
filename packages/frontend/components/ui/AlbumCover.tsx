import Image from "next/image";

type AlbumCoverProps = {
  src: string | null | undefined;
  alt: string;
  size?: number;
  rounded?: "md" | "full";
  /** Adds a couple of thumbnails peeking out from behind, for "this represents a group" contexts (e.g. recently logged). */
  stacked?: boolean;
  className?: string;
};

export function AlbumCover({
  src,
  alt,
  size = 160,
  rounded = "md",
  stacked = false,
  className,
}: AlbumCoverProps) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-xl2";

  return (
    <div className={`relative ${className ?? ""}`} style={{ width: size, height: size }}>
      {stacked && (
        <>
          <div
            className={`absolute ${radius} bg-ink-muted/30`}
            style={{ width: size, height: size, top: 7, left: 7 }}
            aria-hidden="true"
          />
          <div
            className={`absolute ${radius} bg-ink-muted/50 shadow-soft`}
            style={{ width: size, height: size, top: 3.5, left: 3.5 }}
            aria-hidden="true"
          />
        </>
      )}
      <div
        className={`relative overflow-hidden ${radius} bg-ink-muted/20 shadow-soft`}
        style={{ width: size, height: size }}
      >
        {src ? (
          <Image src={src} alt={alt} width={size} height={size} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-secondary text-sm">
            No Art
          </div>
        )}
      </div>
    </div>
  );
}
