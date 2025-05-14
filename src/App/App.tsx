import { type FeatureCollection } from 'geojson'

import Map from './map/Map'
import { data } from './map/data'

const App = ({ width = 700, height = 400 }) => {
  return (
    <div className="App">
      <Map width={width} height={height} data={data as FeatureCollection} />
    </div>
  )
}

export { App }
