import { useEffect, useRef, useState } from 'react'

import * as d3 from 'd3'
import { type FeatureCollection } from 'geojson'

interface MapProps {
  width: number
  height: number
  data: FeatureCollection
}

function Map({ width, height, data }: MapProps) {
  const [count, setCount] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const projection = d3
    .geoMercator()
    .scale(width / 2 / Math.PI - 40)
    .center([10, 35])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context) {
      return
    }

    // If the context is provided, geoPath() understands that we work with canvas, not SVG
    const geoPathGenerator = d3.geoPath().projection(projection).context(context)

    context.clearRect(0, 0, width, height)
    context.beginPath()

    geoPathGenerator(data)

    context.fillStyle = 'grey'
    context.fill()

    context.strokeStyle = 'lightGrey'
    context.lineWidth = 0.1
    context.stroke()
  }, [data, height, projection, width])

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
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  )
}

export default Map
