import { useState } from 'react'

import * as d3 from 'd3'
import { type FeatureCollection } from 'geojson'

interface MapProps {
  width: number
  height: number
  data: FeatureCollection
}

function Map({ width, height, data }: MapProps) {
  const [count, setCount] = useState(0)
  const projection = d3
    .geoMercator()
    .scale(width / 2 / Math.PI - 40)
    .center([10, 35])

  const geoPathGenerator = d3.geoPath().projection(projection)

  const allSvgPaths = data.features
    .filter((shape) => shape.id !== 'ATA')
    .map((shape) => {
      return (
        <path
          key={shape.id}
          d={geoPathGenerator(shape) as string | undefined}
          stroke="lightGrey"
          strokeWidth={0.5}
          fill="grey"
          fillOpacity={0.7}
        />
      )
    })
  return (
    <div className="p-4">
      <button
        className="rounded-lg bg-blue-500 px-3 py-1.5 text-white"
        onClick={() => setCount((count) => count + 1)}
      >
        count is {count}
      </button>
      <h1 className="m-3 p-1 text-3xl font-bold text-red-900 underline">
        Vite + React/TS = EruptionJS
      </h1>
      <p className="text-gray-700">Click on the Vite, React and Eruption logos to learn more</p>
      <svg width={width} height={height}>
        {allSvgPaths}
      </svg>
    </div>
  )
}

export default Map
