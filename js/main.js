var Grub = {
  init: function() {
    var bodyId = $('body').attr('id');
    if (bodyId === 'map-template' || bodyId === 'listing-template') this.createMap(); // only on map pages
    this.events();
  },

  events: function() {
    this.mapEvents();
  },

  mapEvents: function() {
    if ($('body').attr('id') !== 'map-template') return false;
    var that = this;
    $('#header-city').on('click', function(e) {
      e.preventDefault();
      var $this = $(this),
          where = ($('#pane-container').hasClass('top')) ? 'top' : 'bottom';
          theId = $this.attr('id'),
          markup = '<div id="pane-main">';
          markup += '<ul id="city-locations">';
          markup += $('#locations').html();
          markup += '</ul></div>';
          markup += '<div id="pane-sidebar"></div>';
      ($('#pane-container').data('opened-by') === theId) ? that.closePane() : that.openPane(where, theId, markup);
    });
  },

  openPane: function(position, openedBy, markup) {
    var $paneContainer = $('#pane-container'),
        $pane = $paneContainer.children('#pane');
    console.log(openedBy);
    $paneContainer.addClass('open ' + position).data('opened-by', openedBy).css({'height': ($(window).height() / 2 - ($('header').height() / 2))});
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
        latlng = [],
        $body = $('body'),
        zoom = $body.data('zoom') || 11,
        that = this;
    if (locations) {
      latlng.push($body.data('lat'));
      latlng.push($body.data('lon'));
      var map = L.mapbox.map('map', 'mccambridge.map-xne0uzqo').setView(latlng, zoom);
      map.markerLayer.setGeoJSON({
        type: 'FeatureCollection',
        features: locations
      });

      if ($body.attr('id') !== 'map-template') return true;

      // map events
      map.on('click', function(e) {
        if ($('#pane-container').hasClass('open')) that.closePane();
      });
      map.markerLayer.on('click', function(e) {
        var location,
            markerId = 'marker-' + e.layer._leaflet_id;

        e.layer.unbindPopup();
        
        if ($('#pane-container').data('opened-by') === markerId) {
          that.closePane();
        } else {
          // get cursor location relative to page height and open in proper position
          var pageY = e.originalEvent.clientY;  
          location = (pageY > ($(window).height() / 2)) ? 'top' : 'bottom';
          that.openPane(location, markerId, markerId);
        }
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