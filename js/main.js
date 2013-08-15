var Grub = {
  init: function() {
    this.createMap();
    this.events();
  },

  events: function() {
    var that = this;
    $('#header-city').on('click', function(e) {
      e.preventDefault();
      var $this = $(this),
          theId = $this.attr('id'),
          markup = $this.text();
      ($('#pane-container').data('opened-by') === theId) ? that.closePane() : that.openPane('bottom', theId, markup);
    });
  },

  openPane: function(position, openedBy, markup) {
    var $paneContainer = $('#pane-container'),
        $pane = $paneContainer.children('#pane');
    console.log(openedBy);
    $paneContainer.addClass('open ' + position).data('opened-by', openedBy);
    $pane.html(markup);
  },

  closePane: function() {
    var $paneContainer = $('#pane-container'),
        $pane = $paneContainer.children('#pane');
    $paneContainer.removeClass('open top bottom').data('opened-by', '');
    $pane.html('');
  },

  createMap: function() {
    var locations = this.locationsFromHTML(),
        that = this;
    if (locations) {
      var map = L.mapbox.map('map', 'mccambridge.map-xne0uzqo').setView([32.792, -79.914], 11);
      map.markerLayer.setGeoJSON({
        type: 'FeatureCollection',
        features: locations
      });

      // map events
      map.on('click', function(e) {
        if ($('#pane-container').hasClass('open')) that.closePane();
      });
      map.markerLayer.on('click', function(e) {
        var location;
        e.layer.unbindPopup();
        // get cursor location relative to page height
        var pageY = e.originalEvent.clientY;  
        location = (pageY > ($(window).height() / 2)) ? 'top' : 'bottom';
        that.openPane(location, 'marker-' + e.layer._leaflet_id, 'marker-' + e.layer._leaflet_id);
        console.log(e);
      });
    }
  },

  locationsFromHTML: function() {
    if (!$('#locations').length) return false;
    var locations = [],
        $locations = $('#locations').find('li'),
        $names = $locations.find('h2'), // cache for speed
        $descs = $locations.find('p'), // zoom!
        $urls = $locations.find('a'); // whoosh!

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
          title: $names.eq(i).text(),
          description: $descs.eq(i).html(),
          url: $urls.eq(i).attr('href')
        }
      });
    }
    $locations.parent().css({'display': 'none'});
    return locations;
  }
};

// fire!
(function(window, $) {
  $(document).on('ready', function() { Grub.init(); });
})(window, jQuery);