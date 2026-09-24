/*
 * Icons drawn the way lucide draws them, for the sections that show how the
 * set sizes and weighs an icon.
 *
 * The line's products use lucide, and what matters about it here is its
 * output rather than the package: a 24-unit viewBox, `width` and `height` of
 * 24, `stroke-width="2"` and the `lucide` class. That is what the theme's
 * stroke rule keys off and what a button has to size, so it is written out
 * as lucide writes it rather than depended on for two glyphs.
 */

interface IconProps {
  className?: string
}

function Lucide({ name, className, children }: IconProps & { name: string; children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={['lucide', `lucide-${name}`, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Lucide name="plus" {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </Lucide>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <Lucide name="trash-2" {...props}>
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Lucide>
  )
}

export function XIcon(props: IconProps) {
  return (
    <Lucide name="x" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Lucide>
  )
}

export function MoreIcon(props: IconProps) {
  return (
    <Lucide name="ellipsis" {...props}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </Lucide>
  )
}
