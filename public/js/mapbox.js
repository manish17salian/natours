


export const displayMap = (locations)=>{
    mapboxgl.accessToken = 'pk.eyJ1Ijoic3BpZHkxNyIsImEiOiJja29pbDVoeTUwMTY1Mm5tbGpwZWE0cjlvIn0.rxcHUJLURFRPp7uYqK3f5A';
    var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/spidy17/ckoilqa5a06np18qmuxnxgc34',
    scrollZoom: false
    
    
    // interactive:false
    // center: [-118.113491, 34.111745],
    // zoom: 4
    });
    
    const bounds = new mapboxgl.LngLatBounds();
    
    locations.forEach(loc => {
        //Create Marker
        const el = document.createElement('div');
        el.className = 'marker';
    
        //Add Marker
        new mapboxgl.Marker({
            element:el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);
    
        //Add Popup
    
        new mapboxgl.Popup({
            offset:30
        }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);
    
        //Extend MapBound to include current location
        bounds.extend(loc.coordinates)
    });
    
    map.fitBounds(bounds,{
        padding:{
            top:200,
            bottom:150,
            left:100,
            right:100
        }
    })
}


