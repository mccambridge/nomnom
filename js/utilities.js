var Utilities = {
  device: function() {
    var $body = $('body'),
        bodyDevice = (typeof $body.data('device') === 'undefined') ? false : $body.data('device');
    if (bodyDevice) {
      return bodyDevice;
    } else {
      var device,
          width = $(window).width();
      if (width < 768) {
        device = 'mobile';
      } else if (width < 1025) {
        device = 'tablet';
      } else {
        device = 'desktop';
      }
      $body.data('device', device);
      return device;
    }
  }
};