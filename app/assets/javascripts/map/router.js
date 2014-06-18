/**
 * The router module.
 *
 * Router handles app routing and URL parameters and updates Presenter.
 * 
 * @return singleton instance of Router class (extends Backbone.Router).
 */
define([
  'jquery',
  'underscore',
  'backbone',
  'mps',
  'gmap',
  'presenter',
  'views/map',
  'collections/layers'
], function ($, _, Backbone, mps, gmap, presenter, map, layersCollection) {
  
  var Router = Backbone.Router.extend({

    routes: {
      'map': 'map',
      'map/:zoom/:lat/:lng/:iso/:maptype/:baselayers': 'map',
      'map/:zoom/:lat/:lng/:iso/:maptype/:baselayers/:sublayers': 'map',
    },

    initialize: function() {
      console.log('router.initialize()');
      Backbone.Router.prototype.initialize.call(this);
      _.bindAll(this, 'navigateTo');
      mps.subscribe('navigate', this.navigateTo);
    },

    map: function(zoom, lat, lng, iso, maptype, baselayers, sublayers) {
      layersCollection.fetch();
      layersCollection.bind('reset', function() {
        // Async Google Maps API loading
        gmap.init(function() {
          map.render();
          presenter.setFromUrl({
            zoom: Number(zoom),
            lat: Number(lat),
            lng: Number(lng),
            iso: iso,
            maptype: maptype,
            baselayers: baselayers,
            sublayers: sublayers
          });
        });
      });
    },

    navigateTo: function(place) {
      this.path = place.path;
      delete place.path;
      this.navigate('map/' + this.path, place);
    }


  });

  var router = new Router();

  return router;

});