'use client'

import { useTheme } from 'next-themes'
import { Toaster , ToasterProps } from 'sonner'

const Toaster = ({ ...props }) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme ['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg')',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } .CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
