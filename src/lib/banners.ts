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
    href: "/"
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
  href: string
}

export const CATEGORY_TILES: CategoryTile[] = [
  {
    id: "curls",
    image: "/banners/cat-curls.jpg",
    label: "Curls & Afro",
    caption: "Volume for days",
    href: "/search?q=curly"
  },
  {
    id: "braids",
    image: "/banners/cat-braids.jpg",
    label: "Braids",
    caption: "Knotless, boho, cornrows",
    href: "/search?q=braids"
  },
  {
    id: "lace",
    image: "/banners/cat-lace.jpg",
    label: "Lace fronts",
    caption: "Melt it down",
    href: "/search?q=lace"
  },
  {
    id: "colour",
    image: "/banners/cat-colour.jpg",
    label: "Colour",
    caption: "Honey, burgundy, jet",
    href: "/search?q=colour"
  },
  {
    id: "stores",
    image: "/banners/cat-stores.jpg",
    label: "Everything",
    caption: "Browse the full range",
    href: "/search"
  }
]
