import Image from 'next/image'

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="MembeGo"
      width={size}
      height={size}
      className={className}
      priority
    />
  )
}
