import { useRef } from 'react'

import { type FeatureCollection } from 'geojson'

import { useDimensions } from '@/App/map/useDImensions'

import Map from './map/Map'
import { data } from './map/data'

const App = () => {
  const chartRef = useRef<HTMLDivElement>(null)
  const dimensions = useDimensions(chartRef)

  return (
    <div className="h-screen w-full" ref={chartRef}>
      <Map width={dimensions.width} height={dimensions.height} data={data as FeatureCollection} />
    </div>
  )
}

export { App }
