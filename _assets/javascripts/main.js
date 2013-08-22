//= require plugins
//= require swiper
//= require utilities

var Grub = {
  swiper: {},
  map: {},
  marker: {},
  zoom: {},
  height: '',
  me: {},

  init: function() {
    if (typeof Utilities !== 'undefined') {
      $.extend(Grub, Utilities);
      this.device();
    }
    var bodyId = $('body').attr('id');
    if (bodyId === 'map-template' || bodyId === 'listing-template') {
      this.map = this.createMap(); // only on map pages
      this.mapLocate();
    }
    this.events();
  },

  events: function() {
    this.mapEvents();
  },

  markerDefault: function() {
    this.marker.properties["marker-color"] = '#f63a39';
    this.marker.properties["marker-size"] = 'medium';
    this.map.markerLayer.clearLayers();
    this.map.markerLayer.setGeoJSON(this.map.markerLayer.getGeoJSON());
    $('#map').find('.leaflet-marker-pane').find('img').removeClass('top');
  },

  focusOnMarker: function(slide) {
    $locations = $('#locations').find('li');
    console.log('original:' + slide);
    if (typeof this.marker.properties !== 'undefined') {
      this.markerDefault(); // will fail unless already set from below
    }
    if (slide === 0 || slide === $locations.length) { // last slide
      slide = $locations.length;
    }
    slide = slide - ((this.device() === 'mobile') ? 2 : 4); // offset for city slide and array index ... two more if desktop
    var markers = this.map.markerLayer.getGeoJSON().features;
    if (typeof slide !== 'number' || slide < 0) {
      slide = markers.length + slide + 1; // now if the desktop slide is negative b/c of our offsetting, we have to correct
    }
    if (slide >= markers.length) {
      this.panToCityCenter();
      return false;
    }
    this.marker = this.map.markerLayer.getGeoJSON().features[slide]; // get marker in geojson
    console.log('second' + slide + ' vs ' + markers.length);
    this.marker.properties["marker-color"] = '#fe0';
    this.marker.properties["marker-size"] = 'large';
    this.map.markerLayer.clearLayers(); // kill em all!
    this.map.markerLayer.setGeoJSON(this.map.markerLayer.getGeoJSON()); // create new ones
    $('#map').find('.leaflet-marker-pane').find('img').eq(slide).addClass('top'); // z-index: 9999
    this.map.panTo([this.marker.geometry.coordinates[1], this.marker.geometry.coordinates[0]]);// center map on marker
    if (this.map.getZoom !== 15) {
      //this.map.setZoom(15); // only reset zoom if not already this close
    }
  },

  panToCityCenter: function() {
    var $body = $('body');
    var latlng = [$body.data('lat'), $body.data('lon')];
    this.map.panTo(latlng);
  },

  initSwiper: function() {
    var that = this,
        slides = (this.device() === 'mobile') ? 1 : 3;

    var mySwiper = new Swiper('.swiper-container' ,{
      slidesPerView: slides,
      loop: true,
      onSlideChangeStart: function(swiper) {
        that.map.closePopup();
        that.focusOnMarker(that.swiper.activeIndex);
      }
    });

    // add nav buttons to #pane
    var paneHeight = $('#pane-container').height() + 1;
    var navArrows = '<a href="#" id="swiper-prev" class="ir" style="height: ' + paneHeight + 'px">previous</a><a href="#" id="swiper-next" class="ir" style="height: ' + paneHeight + 'px"><span>next</span></a>';
    $('#pane').append(navArrows).addClass('swiperInit');
    $('#swiper-prev').on('click', function(e) {
      e.preventDefault();
      mySwiper.swipePrev();
    });
    $('#swiper-next').on('click', function(e) {
      e.preventDefault();
      mySwiper.swipeNext();
    });
    return mySwiper;
  },

  setHeight: function() {
    this.height = $(window).height() / 2 - ($('header').height() / 2);
  },

  mapEvents: function() {
    // this got a little messy. need to clean up
    if ($('body').attr('id') !== 'map-template') return false;
    var that = this;
    
    // init locations
    this.createPane();
    that.openPane('bottom', '#header-city'); // open on init now, id doensn't matter

    $('#header-city').on('click', function(e) {
      e.preventDefault();
      that.swiper.swipeTo(0);
    });
  },

  mapLocate: function() {
    // geolocate users position
    var that = this;
    if (navigator.geolocation) {
      this.map.locate();
      this.map.on('locationfound', function(e) {
        var latlng = [e.latlng.lat, e.latlng.lng];
        that.me = L.marker(latlng);
        that.me.addTo(that.map);
        var current = that.map.getCenter();
        var user = new L.LatLng(latlng[0], latlng[1]);
        if (user.distanceTo(current) < 40000) { // if less than 40000 meters
          that.map.panTo(latlng);
        }
      });
    }
  },

  createPane: function() {
    // create lower split-screen on map page
    var $paneContainer = $('#pane-container'),
        swiper = '#city-locations',
        $pane = $paneContainer.children('#pane');
      
    var markup = '<div id="pane-main" class="swiper-container">';
    markup += '<ul id="city-locations" class="swiper-wrapper">';
    markup += $('#locations').html();
    markup += '</ul></div>';

    $pane.html(markup);
  },

  openPane: function(position, openedBy) {
    // deprecated. originally, lower-level was opened after click event
    var $paneContainer = $('#pane-container');
    if (position === 'top') {
      this.moveZoomControls('bottomleft');
    }
    $paneContainer.addClass('open ' + position).data('opened-by', openedBy).css({'height': this.height + 2});

    if (!$('#pane').hasClass('swiperInit')) {
      this.swiper = this.initSwiper();
    }
  },

  closePane: function() {
    // deprecated, see above
    var $paneContainer = $('#pane-container'),
        $pane = $paneContainer.children('#pane');
    if ($paneContainer.hasClass('top')) {
      this.moveZoomControls('topleft');
    }
    $paneContainer.removeClass('open top bottom').data('opened-by', '');
    this.map.closePopup();
  },

  moveZoomControls: function(pos) {
    this.map.removeControl(this.zoom);
    this.zoom = new L.Control.Zoom({ position: pos }).addTo(this.map);
  },

  createMap: function() {
    // init from html data
    var locations = this.locationsFromHTML(),
        latlng = [],
        $body = $('body'),
        zoom = $body.data('zoom') || 11,
        that = this;
    if (locations) {
      this.setHeight();
      $('#map').css({'height': this.height}); // shore up map to upper pane
      latlng.push($body.data('lat'));
      latlng.push($body.data('lon'));
      var map = L.mapbox.map('map', 'mccambridge.map-xne0uzqo', { zoomControl: false }).setView(latlng, zoom);
      map.markerLayer.setGeoJSON({
        type: 'FeatureCollection',
        features: locations
      });

      // add zoom manually (so we can move it if need be)
      this.zoom = new L.Control.Zoom({ position: 'topleft' }).addTo(map);

      if ($body.attr('id') === 'listing-template') {
        if (this.device() === 'mobile') {
          var $map = $('#map').detach();
          $('#listing-main').children('h1').after($map);
          var $address = $('#address').detach();
          $('#listing-main').children('h1').after($address);
        }
      }

      if ($body.attr('id') !== 'map-template') return true;

      // map events
      map.on('click', function(e) {
        // if ($('#pane-container').hasClass('open')) that.closePane(); // clicking on map used to close pane
      });
      map.markerLayer.on('click', function(e) {
        var location,
            markerId = 'marker-' + e.layer._leaflet_id;

        //e.layer.unbindPopup();
        
        if ($('#pane-container').data('opened-by') === markerId) {
          // that.closePane(); // clicking on container responsible for opening pane used to toggle pane
        } else {
          // get cursor location relative to page height and open in proper position
          var pageY = e.originalEvent.clientY;
          location = (pageY > ($(window).height() / 2)) ? 'top' : 'bottom';
          that.openPane(location, markerId);
          that.swiper.swipeTo(e.layer.feature.properties.index); // open the right place
        }
      });
    }
    return map;
  },

  locationsFromHTML: function() {
    if (!$('#locations').length) return false;
    var locations = [],
        $locations = $('#locations').find('li.location'),
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
          url: $urls.eq(i).attr('href'),
          index: $this.index()
        }
      });
    }
    return locations;
  }
};

// fire!
(function(window, $) {
  $(document).on('ready', function() { Grub.init(); });
})(window, jQuery);

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-43184943-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();