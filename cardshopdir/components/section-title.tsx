import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface Props {
  index?: string
  title: string
  href?: string
  cta?: string
  aside?: React.ReactNode
  id?: string
}

/** Section heading: heavy rule, mono index, big serif title, optional CTA. */
export function SectionTitle({ index, title, href, cta, aside, id }: Props) {
  return (
    <div
      id={id}
      className="mb-8 flex items-end justify-between gap-4 border-t-2 border-foreground pt-4"
    >
      <div className="min-w-0">
        {index && <p className="label-mono text-primary">{index}</p>}
        <h2 className="mt-2 font-serif text-[2rem] leading-none font-bold tracking-tight sm:text-5xl">
          {title}
        </h2>
      </div>
      {aside}
      {href && cta && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1.5 pb-1 text-[13px] font-bold tracking-wide text-primary uppercase"
        >
          <span className="link-draw">{cta}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
