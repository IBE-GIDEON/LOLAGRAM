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

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "glow",
    image: "/banners/hero-glow.jpg",
    eyebrow: "Wigs & Hair",
    title: "Find your wig",
    subtitle:
      "Lace fronts, bone straight, curls and braids from vetted vendors near you.",
    ctaLabel: "Shop wigs",
    href: "/search?q=wig"
  },
  {
    id: "noir",
    image: "/banners/hero-noir.jpg",
    eyebrow: "Beauty drops",
    title: "Soft glam, delivered",
    subtitle: "Lashes, skincare and cosmetics from stores that actually deliver.",
    ctaLabel: "Shop beauty",
    href: "/search?q=beauty"
  },
  {
    id: "street",
    image: "/banners/hero-street.jpg",
    eyebrow: "New this week",
    title: "Fresh from your city",
    subtitle: "Newly uploaded pieces from active vendors, updated every day.",
    ctaLabel: "See what's new",
    href: "/"
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
    label: "Hair stores",
    caption: "Browse every vendor",
    href: "/search"
  }
]
