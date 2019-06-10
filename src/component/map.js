var $ = require('jquery');
require('jsrender')($);
var L = require('leaflet');
require('leaflet.awesome-markers');

export default class Map {

  constructor() {
    this.component = L.map('map');
    this.markers = [];
    this.initializeLayer();
    $("#map").show();
  }

  initializeLayer() {
    import(/* webpackChunkName: "mapbox" */ './mapbox.js').then(()=>{
      L.mapboxGL({
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
        accessToken: 'not-needed',
        style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.MAPTILER_API_KEY}`
      }).addTo(this.component);
    });
  }

  centerLocation(coords, zoom=13) {
    this.component.setView([coords.latitude, coords.longitude], zoom);
  }

  isBigArea(onlyHPC){
    const maxValue = onlyHPC ? 9 : 11 
    return this.component.getZoom() < maxValue;
  }

  getBounds() {
    const bounds = this.component.getBounds();
    return {
      northEast: {
        latitude: bounds.getNorthEast().lat,
        longitude: bounds.getNorthEast().lng
      },
      southWest: {
        latitude: bounds.getSouthWest().lat,
        longitude: bounds.getSouthWest().lng
      }
    }
  }

  clearMarkers() {
    this.markers.forEach(m => m.remove());
    this.markers = [];
  }

  addStation(model, onClickCallback) {

    let color = '';

    const maxPower = model.chargePoints.reduce((max,value)=> max > value.power ? max : value.power, 0);

    if(maxPower > 50){
      color = "red"
    }
    else if(maxPower > 22){
      color = "orange"
    }
    else if(maxPower > 3.7){
      color = "blue"
    }
    else{
      color = "gray";
    }

    var redMarker = L.AwesomeMarkers.icon({
      icon: "plug",
      markerColor: color,
      prefix: 'fa'
    });
        
    const marker = L.marker([model.latitude, model.longitude],{icon: redMarker});
    marker.addTo(this.component);
    marker.on('click', () => onClickCallback(model));
    this.markers.push(marker);
  }

  onBoundsChanged(callback) {
    this.component.on("moveend", (res) => callback(this.getBounds()));
  }

}