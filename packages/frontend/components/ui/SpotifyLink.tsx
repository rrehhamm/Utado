export function SpotifyLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ed760]"
    >
      Listen on Spotify
    </a>
  );
}
