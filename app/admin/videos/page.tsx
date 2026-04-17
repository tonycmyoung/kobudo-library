import VideoManagement from "@/components/video-management"

export default function AdminVideosPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Video Management</h1>
        <p className="text-gray-300">Add, edit, and manage training videos</p>
      </div>
      <VideoManagement />
    </>
  )
}
