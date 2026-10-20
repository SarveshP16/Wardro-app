/// Renders a wardrobe item's cutout on the look's "board" tone --
/// cutouts have a transparent background, so they need a constant,
/// contrasty neutral behind them in both themes (see --board in
/// globals.css; a dark garment would otherwise disappear into a dark
/// card).
///
/// `?v=2` busts browsers' year-long cache of the full-size PNGs the route
/// served before it switched to trimmed display copies (see
/// readDisplayImage).
export function itemImageSrc(id: string): string {
  return `/api/images/${id}?v=2`;
}

export function ItemImage({
  id,
  alt,
  className = "",
  padding = "p-2",
}: {
  id: string;
  alt: string;
  className?: string;
  padding?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-board ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic, server-routed image, not a static asset */}
      <img
        src={itemImageSrc(id)}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 h-full w-full object-contain ${padding}`}
      />
    </div>
  );
}
