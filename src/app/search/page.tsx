import { SearchPageClient } from "@/components/search-page-client"

/**
 * ?q= is read here and handed down rather than pulled from useSearchParams in
 * the client component: that hook opts the whole route out of static rendering
 * unless it is wrapped in Suspense, and this page has no other reason to be.
 */
export default function SearchPage({
  searchParams
}: {
  searchParams?: { q?: string | string[] }
}) {
  const raw = searchParams?.q
  const initialQuery = (Array.isArray(raw) ? raw[0] : raw) ?? ""

  return <SearchPageClient initialQuery={initialQuery} />
}
