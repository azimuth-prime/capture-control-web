interface PlaceholderProps {
  module: string
}

export default function Placeholder({ module }: PlaceholderProps) {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <h2 className="text-lg font-medium">{module}</h2>
      <p className="text-sm mt-1">Migration in progress</p>
    </div>
  )
}
