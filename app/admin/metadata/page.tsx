import MetadataManagement from "@/components/metadata-management"

export default function AdminMetadataPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Metadata Management</h1>
        <p className="text-gray-300">Manage curriculum, categories, and performers in one place</p>
      </div>
      <MetadataManagement />
    </>
  )
}
