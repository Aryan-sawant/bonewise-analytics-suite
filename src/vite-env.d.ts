
/// <reference types="vite/client" />

// Add Google Maps API type definitions
interface Window {
  google?: {
    maps: {
      Map: any;
      Marker: any;
      LatLng: any;
      places: {
        PlacesService: any;
        PlacesServiceStatus: any;
        RankBy: {
          DISTANCE: number;
        };
      };
      Geocoder: any;
    }
  }
}
