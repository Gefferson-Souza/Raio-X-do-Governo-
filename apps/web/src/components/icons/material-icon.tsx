interface MaterialIconProps {
  icon: string
  filled?: boolean
  className?: string
  size?: number
}

export function MaterialIcon({
  icon,
  filled = false,
  className = "",
  size = 24,
}: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}),
      }}
      aria-hidden="true"
    >
      {icon}
    </span>
  )
}
