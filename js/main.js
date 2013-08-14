var Grub = {
  init: function() {
    var locations = this.locations();
    if (locations) {
      var map = L.mapbox.map('map', 'mccambridge.map-xne0uzqo').setView([32.792, -79.914], 11);
      L.mapbox.markerLayer({
        type: 'FeatureCollection',
        features: locations
      }).addTo(map);
    }
  },

  locations: function() {
    if (!$('#locations-list').length) return false;
    var locations = [],
        $locations = $('#locations-list').find('li');
    for (var i = 0; i < $locations.length; i++) {
      var $this = $locations.eq(i);
      locations.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [$this.data('lon'), $this.data('lat')]
        },
        properties: {
          'marker-color': '#f63a39',
          'marker-symbol': $this.data('type'),
          title: $this.find('h2').html(),
          description: $this.find('p').html()
        }
      });
    }
    $locations.css({'display': 'none'});
    return locations;
  }
};

// fire!
(function(window, $) {
  $(document).on('ready', function() { Grub.init(); });
})(window, jQuery);