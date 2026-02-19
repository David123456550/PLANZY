interface PlanzyLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
}

export function PlanzyLogo({ size = "md", showText = true }: PlanzyLogoProps) {
  const sizes = {
    sm: { icon: 40, text: "text-xl" },
    md: { icon: 60, text: "text-2xl" },
    lg: { icon: 100, text: "text-4xl" },
    xl: { icon: 140, text: "text-5xl" },
  }

  const { icon, text } = sizes[size]

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={icon} height={icon * 1.2} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Location pin */}
        <path
          d="M50 0C27.9 0 10 17.9 10 40C10 70 50 100 50 100C50 100 90 70 90 40C90 17.9 72.1 0 50 0Z"
          fill="#ef7418"
        />
        {/* White circle inside */}
        <circle cx="50" cy="40" r="28" fill="white" />
        {/* Teal circle border */}
        <circle cx="50" cy="40" r="25" fill="none" stroke="#1a95a4" strokeWidth="3" />
        {/* Three people icons */}
        {/* Center person */}
        <circle cx="50" cy="32" r="6" fill="#1a95a4" />
        <path d="M50 40C43 40 38 45 38 52H62C62 45 57 40 50 40Z" fill="#1a95a4" />
        {/* Left person (smaller) */}
        <circle cx="35" cy="35" r="4" fill="#1a95a4" />
        <path d="M35 40C30 40 27 44 27 49H43C43 44 40 40 35 40Z" fill="#1a95a4" />
        {/* Right person (smaller) */}
        <circle cx="65" cy="35" r="4" fill="#1a95a4" />
        <path d="M65 40C60 40 57 44 57 49H73C73 44 70 40 65 40Z" fill="#1a95a4" />
      </svg>
      {showText && (
        <span className={`${text} font-bold`} style={{ color: "#1a95a4" }}>
          planzy
        </span>
      )}
    </div>
  )
}
