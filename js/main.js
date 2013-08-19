var Grub = {
  swiper: {},
  map: {},

  init: function() {
    if (typeof Utilities !== 'undefined') {
      $.extend(Grub, Utilities);
      this.device();
    }
    var bodyId = $('body').attr('id');
    if (bodyId === 'map-template' || bodyId === 'listing-template') {
      this.map = this.createMap(); // only on map pages
    }
    this.events();
  },

  events: function() {
    this.mapEvents();
  },

  initSwiper: function() {
    var that = this,
        slides = (this.device() === 'mobile') ? 1 : 3;

    var mySwiper = new Swiper('.swiper-container' ,{
      slidesPerView: slides,
      loop: true,
      onSlideChangeStart: function(swiper) {
        that.map.closePopup();
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

  mapEvents: function() {
    if ($('body').attr('id') !== 'map-template') return false;
    var that = this;
    
    // init locations
    this.createPane();

    $('#header-city').on('click', function(e) {
      e.preventDefault();
      var $this = $(this),
          where = ($('#pane-container').hasClass('top')) ? 'top' : 'bottom';
          theId = $this.attr('id');

      ($('#pane-container').hasClass('open')) ? that.closePane() : that.openPane(where, theId);
    });
  },

  createPane: function() {
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
    var $paneContainer = $('#pane-container');
    $paneContainer.addClass('open ' + position).data('opened-by', openedBy).css({'height': ($(window).height() / 2 - ($('header').height() / 2))});
    if (!$('#pane').hasClass('swiperInit')) {
      this.swiper = this.initSwiper();
    }
  },

  closePane: function() {
    var $paneContainer = $('#pane-container'),
        $pane = $paneContainer.children('#pane');
    $paneContainer.removeClass('open top bottom').data('opened-by', '');
    this.map.closePopup();
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

        //e.layer.unbindPopup();
        
        if ($('#pane-container').data('opened-by') === markerId) {
          that.closePane();
        } else {
          // get cursor location relative to page height and open in proper position
          var pageY = e.originalEvent.clientY,
              offset = (that.device() === 'mobile') ? 0 : 1;
          location = (pageY > ($(window).height() / 2)) ? 'top' : 'bottom';
          that.openPane(location, markerId);
          that.swiper.swipeTo(e.layer.feature.properties.index - offset); // open the right place
        }
      });
    }
    return map;
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
          url: $urls.eq(i).attr('href'),
          index: $this.index()
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