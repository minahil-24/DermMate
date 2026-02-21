import { useState } from 'react'
import { motion } from 'framer-motion'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { mockCases } from '../../mock-data/cases'



const ImageManagement = () => {
  const [selectedCase] = useState(mockCases[0])
  const [beforeAfter, setBeforeAfter] = useState(50)
  const [selectedComparison, setSelectedComparison] = useState(null)
  const [uploadedComparisons, setUploadedComparisons] = useState([]) // newly uploaded comparisons
  const [newBefore, setNewBefore] = useState(null)
  const [newAfter, setNewAfter] = useState(null)

  const handleUpload = () => {
    if (!newBefore || !newAfter) return
    const newItem = {
      id: Date.now(),
      before: URL.createObjectURL(newBefore),
      after: URL.createObjectURL(newAfter),
    }
    setUploadedComparisons((prev) => [newItem, ...prev])
    setNewBefore(null)
    setNewAfter(null)
    alert('Comparison uploaded!')
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Image Management' }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Management</h1>
        <p className="text-gray-600">Compare before and after treatment images</p>
      </div>

      {/* Main Comparison Slider */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Before / After Comparison
        </h2>

        <div className="relative h-96 rounded-lg overflow-hidden mb-4">
          <div className="absolute inset-0 flex">
            {/* BEFORE */}
            <div
              className="flex-1 relative"
              style={{ clipPath: `inset(0 ${100 - beforeAfter}% 0 0)` }}
            >
              <img
                src={selectedComparison?.before || selectedCase.images[0]?.url}
                alt="Before"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">
                Before
              </div>
            </div>

            {/* AFTER */}
            <div className="flex-1 relative">
              <img
                src={selectedComparison?.after || selectedCase.images[1]?.url}
                alt="After"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded text-sm font-medium">
                After
              </div>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={beforeAfter}
            onChange={(e) => setBeforeAfter(e.target.value)}
            className="absolute bottom-4 left-4 right-4 w-auto"
          />
        </div>

        {/* Case Images */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {selectedCase.images.map((img) => (
            <div key={img.id} className="relative">
              <img
                src={img.url}
                alt={img.angle}
                className="w-full h-32 object-cover rounded-lg"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {img.angle}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Dermatologist Uploaded Comparisons */}
      <Card className="mt-10">
        <h2 className="text-xl font-semibold mb-4">
         Upload to see Comparisons
        </h2>

        {/* Upload Section */}
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Upload New Comparison</h3>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewBefore(e.target.files[0])}
              className="border rounded p-2"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewAfter(e.target.files[0])}
              className="border rounded p-2"
            />
            <button
              onClick={handleUpload}
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition"
            >
              Upload
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ImageManagement
