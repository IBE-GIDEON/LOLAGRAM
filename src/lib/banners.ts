import { type ProductCategory } from "@/lib/product-categories"

/**
 * Editorial imagery for the home feed.
 * Files live in /public/banners (Pexels licence — free for commercial use,
 * no attribution required) so they load from our own origin and keep working
 * offline through the service worker.
 */

export type HeroSlide = {
  id: string
  image: string
  eyebrow: string
  title: string
  subtitle: string
  ctaLabel: string
  href: string
}

// Order matters twice over: this is what a first-time visitor sees, and only
// the first slide is eager-loaded, so whatever sits here is the LCP image.
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "arrivals",
    image: "/banners/latest-arrivals.jpg",
    eyebrow: "New this week",
    title: "New arrivals",
    subtitle: "Fresh units added to the shelf, restocked as they come in.",
    ctaLabel: "See what's new",
    // Was "/", which is the page the hero already sits on — the button looked
    // dead because tapping it went nowhere.
    href: "/search"
  },
  {
    id: "glow",
    image: "/banners/find-hair.jpg",
    eyebrow: "Wigs & Hair",
    title: "Find your wig",
    subtitle:
      "Lace fronts, bone straight, curls and braids — picked, checked and sent out by us.",
    ctaLabel: "Shop wigs",
    href: "/search?q=wig"
  }
]

export type CategoryTile = {
  id: string
  image: string
  label: string
  caption: string
  /**
   * The product class this tile shows. Must be one of PRODUCT_CATEGORIES —
   * it is matched against products.category, so a value that drifts from that
   * list gives a tile that silently returns nothing.
   */
  term: ProductCategory
}

export function categoryHref(tile: CategoryTile) {
  // ?category=, not ?q=: the shelf is a property of the product, not a word
  // that has to appear in its name.
  return `/search?category=${encodeURIComponent(tile.term)}`
}

/**
 * Cut from the two photos in public/ rather than stock: the old tiles were
 * generic portraits — "Colour" was a woman in a yellow sweater with no wig in
 * frame — and the backdrop here already matches the hero and the banner.
 *
 * Each href is a search, so a tile only returns anything once products carry
 * that word in their name or description.
 */
export const CATEGORY_TILES: CategoryTile[] = [
  {
    id: "wigs",
    image: "/banners/tile-wigs.jpg",
    label: "Wigs",
    caption: "Every length, every shade",
    term: "wigs"
  },
  {
    id: "futura",
    image: "/banners/tile-futura.jpg",
    label: "Futura wigs",
    caption: "High quality blend",
    term: "futura"
  },
  {
    id: "closures",
    image: "/banners/tile-closures.jpg",
    label: "Closures and frontals",
    caption: "HD lace, 13x4 and 4x4",
    term: "closures"
  },
  {
    id: "essentials",
    image: "/banners/tile-essentials.jpg",
    label: "Hair essentials",
    caption: "Caps, glue, combs, care",
    term: "essentials"
  },
  {
    id: "combo",
    image: "/banners/tile-combo.jpg",
    label: "Combo deals",
    // Not "Bundle and save" — Bundles is now its own tile beside this one.
    caption: "Buy more, pay less",
    term: "combo"
  },
  // Sixth tile: five exactly fill the row, so without this there is nothing for
  // the horizontal scroll to reveal. Delete it and the rail simply stops
  // scrolling on desktop.
  {
    id: "bundles",
    image: "/banners/tile-bundles.jpg",
    label: "Bundles",
    caption: "Buy in bundles",
    term: "bundles"
  }
]
