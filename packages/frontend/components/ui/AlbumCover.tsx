import Image from "next/image";

type AlbumCoverProps = {
  src: string | null | undefined;
  alt: string;
  size?: number;
  rounded?: "md" | "full";
  className?: string;
};

export function AlbumCover({ src, alt, size = 160, rounded = "md", className }: AlbumCoverProps) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-xl";
  return (
    <div
      className={`overflow-hidden ${radius} bg-groove-light shadow-soft ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-charcoal/30 text-sm">
          No Art
        </div>
      )}
    </div>
  );
}
