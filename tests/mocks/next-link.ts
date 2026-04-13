import { createElement } from "react"
import type { MouseEvent, ReactNode } from "react"

interface LinkProps {
  href: string
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  className?: string
  [key: string]: unknown
}

const MockLink = ({ children, href, onClick, ...props }: LinkProps) =>
  createElement(
    "a",
    {
      href,
      onClick: (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        onClick?.(e)
      },
      ...props,
    },
    children,
  )

export default MockLink
