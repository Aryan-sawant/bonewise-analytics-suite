
/// <reference types="vite/client" />

// Google Maps type definitions
interface Window {
  google: {
    maps: {
      Map: any;
      Marker: any;
      LatLngBounds: any;
      places: {
        PlacesService: any;
        PlacesServiceStatus: any;
      };
      geometry: {
        spherical: {
          computeDistanceBetween: (from: any, to: any) => number;
        };
      };
      SymbolPath: {
        CIRCLE: number;
      };
      Geocoder: any;
    };
  };
}
