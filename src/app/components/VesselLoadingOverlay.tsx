'use client'

import { useVessel } from '../context/VesselContext'

export default function VesselLoadingOverlay() {
  const { loadingVessel, loadingMessage } = useVessel()

  if (!loadingVessel) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-500">
      <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-700 font-medium">{loadingMessage || 'Loading vessel...'}</p>
      </div>
    </div>
  )
}

