import { type FeatureCollection } from 'geojson'

import Map from './map/Map'
import { data } from './map/data'

const App = ({ width = 940, height = 600 }) => {
  return <Map width={width} height={height} data={data as FeatureCollection} />
}

export { App }
