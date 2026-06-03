export function ProductImport() {
  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-bold">Import</h1>

      <div className="max-w-2xl space-y-6">
        <div className="rounded border bg-yellow-50 p-4 text-sm text-yellow-800">
          <strong>Note:</strong> Imports require data formatted according to the Capture import
          templates. Download the templates below, fill in the required columns, and upload the
          completed file.
        </div>

        <ImportSection
          title="Import Products"
          description="Create or update products in bulk. Required columns: name. Optional: altId, description, productType, controlType, taxable, stockUnit."
          templateHref="#"
        />

        <ImportSection
          title="Import SKUs"
          description="Create or update SKUs in bulk. Required columns: productId, inventoryType. Optional: color, size, controlType, availabilityDate, stockThreshold, upc."
          templateHref="#"
        />

        <ImportSection
          title="Import Inventory"
          description="Create inventory lots or serials in bulk. Required columns: skuId, warehouseId, lotSerial. Optional: receivedDate, expiryDate."
          templateHref="#"
        />
      </div>
    </div>
  )
}

interface ImportSectionProps {
  title: string
  description: string
  templateHref: string
}

function ImportSection({ title, description, templateHref }: ImportSectionProps) {
  return (
    <div className="rounded border p-4">
      <h2 className="mb-1 font-semibold">{title}</h2>
      <p className="mb-3 text-sm text-muted-foreground">{description}</p>
      <div className="flex items-center gap-3">
        <a
          href={templateHref}
          className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Download Template
        </a>
        <span className="text-sm text-muted-foreground">
          Upload functionality requires client-side spreadsheet parsing — coming soon.
        </span>
      </div>
    </div>
  )
}
