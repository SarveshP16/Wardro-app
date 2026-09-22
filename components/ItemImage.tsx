/// Renders a wardrobe item's cutout on the fixed "photo backdrop" tone —
/// cutouts have a transparent background, so they need a constant,
/// contrasty neutral behind them in both themes (see
/// --color-photo-backdrop in globals.css; a dark garment would otherwise
/// disappear into a near-black card in dark mode).
export function ItemImage({
  id,
  alt,
  className = "",
}: {
  id: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-photo-backdrop ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic, server-routed image, not a static asset */}
      <img
        src={`/api/images/${id}`}
        alt={alt}
        className="h-full w-full object-contain p-2"
      />
    </div>
  );
}
