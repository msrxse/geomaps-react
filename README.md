# run

```
bun run dev
```

# Preparing data

## how to download and prepare geometry from the U.S. Census Bureau

- Visit 'http://www2.census.gov/geo/tiger/GENZ2014/shp/' and download/unzip census data polygons:

- Save these to folder in data. From data/cb_2014_06_tract_500k folder, use shp2json to convert to GeoJSON:

```
../../node_modules/shapefile/bin/shp2json cb_2014_06_tract_500k.shp -o ca.json
```

- We know to avoid expensive trigonometric opeartions at runtime, we apply a geographic projection. The resulting GeoJson renders much faster: From the data folder (note we moved ca.json u one folder)

```
../node_modules/d3-geo-projection/bin/geoproject.js 'd3.geoConicEqualArea().parallels([34, 40.5]).rotate([120, 0]).fitSize([960, 960], d)' < ca.json > ca-albers.json
```

To view the projected gesmetry you can:

```
../node_modules/d3-geo-projection/bin/geo2svg.js -w 960 -h 960 < ca-albers.json > ca-albers.svg
```

- The resulting file ca-alberts.svg can be opened to preview the projection.

- The ndjson-cli module has tools for converting JSON to NDJSON, which is more convenient when using UNIX commands.

```
../node_modules/ndjson-cli/ndjson-split 'd.features' \
  < ca-albers.json \
  > ca-albers.ndjson
```

- Now, we can add a n id to each feature using ndjson-map:

```
../node_modules/ndjson-cli/ndjson-map 'd.id = d.properties.GEOID.slice(2), d' \
  < ca-albers.ndjson \
  > ca-albers-id.ndjson
```

- This id will be needed to join the geometry with the population estimates, which now will download form the Census Bureaus's API using curl.

```
curl "https://api.census.gov/data/2014/acs/acs5?get=B01003_001E&for=tract:*&in=state:06&key=%key%" -o cb_2014_06_tract_B01003.json
```

- The resulting file is a JSON array. To convert to an NDJSON stream, use ndjson-cat (to remove the newlines), ndjson-split (to separate the array into multiple lines) and ndjson-map (to reformat each line as an object)

```
 ../node_modules/ndjson-cli/ndjson-cat cb_2014_06_tract_B01003.json \
  | ../node_modules/ndjson-cli/ndjson-split 'd.slice(1)' \
  | ../node_modules/ndjson-cli/ndjson-map '{id: d[2] + d[3], B01003: +d[0]}' \
  > cb_2014_06_tract_B01003.ndjson

```

- Now, magic! Join the population data to the geometry using ndjson-join:

```
../node_modules/ndjson-cli/ndjson-join 'd.id' \
  ca-albers-id.ndjson \
  cb_2014_06_tract_B01003.ndjson \
  > ca-albers-join.ndjson

```

- To compute the population density using ndjson-map, and to remove the additional properties we no longer need:

```
../node_modules/ndjson-cli/ndjson-map 'd[0].properties = {density: Math.floor(d[1].B01003 / d[0].properties.ALAND * 2589975.2356)}, d[0]' \
  < ca-albers-join.ndjson \
  > ca-albers-density.ndjson

```

- To convert back to GeoJSON, use ndjson-reduce:

```

../node_modules/ndjson-cli/ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' \
  < ca-albers-density.ndjson \
  > ca-albers-density.json

```

- create map (didnt work = Error [ERR_REQUIRE_ESM]: require() of ES Module)
  (This is for local viewing anyways!)

```
../node_modules/ndjson-cli/ndjson-map -r d3 \
  '(d.properties.fill = d3.scaleSequential(d3.interpolateViridis).domain([0, 4000])(d.properties.density), d)' \
  < ca-albers-density.ndjson \
  > ca-albers-color.ndjson

```

- create svg

```

../node_modules/d3-geo-projection/bin/geo2svg -n --stroke none -p 1 -w 960 -h 960 < ca-albers-color.ndjson > ca-albers-color.svg

```

- END of create map (didnt work = Error [ERR_REQUIRE_ESM]: require() of ES Module)

---

- We use topojson to convert to topJSON, reducing its size (8.1M):

```
../node_modules/topojson-server/bin/geo2topo -n \
  tracts=ca-albers-density.ndjson \
  > ca-tracts-topo.json

```

- Now to toposimplify, further reducing to 3.1M:

```
../node_modules/topojson-simplify/bin/toposimplify -p 1 -f \
  < ca-tracts-topo.json \
  > ca-simple-topo.json

```

- Lastly to topoquantize and delta-encode, reducing to 1.6M:

```
../node_modules/topojson-client/bin/topoquantize 1e5 \
  < ca-simple-topo.json \
  > ca-quantized-topo.json

```

- Gzip (performed automatically by most servers) further reduces the transfer size to a svelte 390K.

- The Census Bureau also publishes county boundaries, but we don’t actually need them. TopoJSON has another powerful trick up its sleeve: since census tracts compose hierarchically into counties, we can derive county geometry using topomerge!

```
../node_modules/topojson-client/bin/topomerge -k 'd.id.slice(0, 3)' counties=tracts \
  < ca-quantized-topo.json \
  > ca-merge-topo.json

```

- Now, we don’t actually want the full county polygons; we want only the internal borders—the ones separating counties. (Stroking exterior borders tends to lose detail along coastlines.)

```
../node_modules/topojson-client/bin/topomerge --mesh -f 'a !== b' counties=counties \
  < ca-merge-topo.json \
  > ca-topo.json

```

- Final Choropleth with country borders:

```
(../node_modules/topojson-client/bin/topo2geo tracts=- \
    < ca-topo.json \
    | ../node_modules/ndjson-cli/ndjson-map -r d3 -r d3=d3-scale-chromatic 'z = d3.scaleThreshold().domain([1, 10, 50, 200, 500, 1000, 2000, 4000]).range(d3.schemeOrRd[9]), d.features.forEach(f => f.properties.fill = z(f.properties.density)), d' \
    | ../node_modules/ndjson-cli/ndjson-split 'd.features'; \
../node_modules/topojson-client/bin/topo2geo counties=- \
    < ca-topo.json \
    | ../node_modules/ndjson-cli/ndjson-map 'd.properties = {"stroke": "#000", "stroke-opacity": 0.3}, d')\
  | ../node_modules/d3-geo-projection/bin/geo2svg.js -n --stroke none -p 1 -w 960 -h 960 \
  > ca.svg
```
