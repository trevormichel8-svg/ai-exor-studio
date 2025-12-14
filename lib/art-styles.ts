export const ART_STYLES = [
  // Modern / Brand
  "Minimalist",
  "Modern Flat",
  "Luxury Brand",
  "Corporate Professional",
  "Startup Tech",
  "Futuristic",
  "AI Neural",
  "Abstract Geometry",
  "Monogram",
  "Lettermark",

  // Artistic
  "Hand Drawn",
  "Watercolor",
  "Oil Painting",
  "Ink Illustration",
  "Line Art",
  "Sketch Style",
  "Graffiti",
  "Calligraphy",
  "Brush Stroke",
  "Paper Cutout",

  // Retro / Vintage
  "Vintage 1920s",
  "Retro 1980s",
  "Retro 1990s",
  "Art Deco",
  "Mid-Century Modern",
  "Psychedelic",
  "Vaporwave",
  "Synthwave",
  "Pixel Art",
  "Low Poly",

  // Cultural / Thematic
  "Japanese Zen",
  "Nordic Minimal",
  "Cyberpunk",
  "Steampunk",
  "Mythical Fantasy",
  "Luxury Gold Foil",
  "Neon Glow",
  "Dark Mode",
  "Organic Nature",
  "Eco Green",
] as const;

export type ArtStyle = typeof ART_STYLES[number];
  
