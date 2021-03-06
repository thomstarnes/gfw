/**
 * The layers filter module.
 *
 * @return singleton instance of layers fitler class (extends Backbone.View).
 */
define([
  'backbone',
  'underscore',
  'amplify',
  'chosen',
  'map/presenters/LayersNavPresenter',
  'handlebars',
  'text!map/templates/layersNav.handlebars',
  'text!map/templates/layersNavByCountry.handlebars',
  'text!map/templates/layersNavByCountryWrapper.handlebars'
], function(Backbone, _, amplify, chosen, Presenter, Handlebars, tpl, tplCountry, tplCountryWrapper) {

  'use strict';

  var LayersNavView = Backbone.View.extend({

    el: '.layers-menu',

    template: Handlebars.compile(tpl),
    templateCountry: Handlebars.compile(tplCountry),
    templateCountryWrapper: Handlebars.compile(tplCountryWrapper),

    events: {
      'click .layer': '_toggleLayer',
      'click .wrapped-layer': '_toggleLayerWrap',
      'click #toggleUmd' : 'toggleUmd',
      'click #country-layers' : '_showNotification',
      'click #country-layers-reset' : '_resetIso'
    },

    initialize: function() {
      _.bindAll(this, '_toggleSelected');
      this.presenter = new Presenter(this);
      this.render();
    },

    render: function() {
      this.$el.append(this.template());
      //Experiment
      this.presenter.initExperiment('source');

      //Init
      this.$UMDlayers = $('#umd-group .layer');
      this.$toggleUMD = $('#toggleUmd');
      this.$categoriesList = $('.categories-list');
      this.$layersCountry = $('#layers-country-nav');
      this.$countryLayers = $('#country-layers');
      this.$countryLayersReset = $('#country-layers-reset');

    },


    /**
     * Used by LayersNavPresenter to toggle the class
     * name selected.
     *
     * @param  {object} layerSpec
     */
    _toggleSelected: function(layers) {

      this.layers = layers;

      // Toggle sublayers
      _.each(this.$el.find('.layer'), function(li) {
        var $li = $(li);
        var $toggle = $li.find('.onoffradio, .onoffswitch');
        var $toggleIcon = $toggle.find('span');
        var $layerTitle = $li.find('.layer-title');
        var layer = layers[$li.data('layer')];

        if (layer) {
          // var isBaselayer = (layer.category_slug === 'forest_clearing');

          $li.addClass('selected');
          $toggle.addClass('checked');
          $layerTitle.css('color', layer.title_color);
          $toggle.css('background', layer.title_color);

          ga('send', 'event', 'Map', 'Toggle', 'Layer: ' + layer.slug);
        } else {
          $li.removeClass('selected');
          $toggle.removeClass('checked').css('background', '').css('border-color', '');
          $toggleIcon.css('background-color', '');
          $layerTitle.css('color', '');
        }
      });
      this.toogleSelectedWrapper();
      this.checkUMD();
    },

    /**
     * Handles a toggle layer change UI event by dispatching
     * to LayersNavPresenter.
     *
     * @param  {event} event Click event
     */
    _toggleLayer: function(event) {
      event && event.preventDefault();
      // this prevents layer change when you click in source link
      if (!$(event.target).hasClass('source') && !$(event.target).parent().hasClass('source')) {
        var layerSlug = $(event.currentTarget).data('layer');

        if ($(event.currentTarget).hasClass('wrapped')) {
          event && event.stopPropagation();

          var $elem = $(event.currentTarget);
          if ($elem.prop('tagName') !== 'LI'){
            //as the toggle are switches, we should turn off the others (siblings) before turning on our layer
            for (var i=0;i < $elem.siblings().length; i++) {
              if ($($elem.siblings()[i]).hasClass('selected')) {
                this.presenter.toggleLayer($($elem.siblings()[i]).data('layer'));
              }
              $elem.parents('li').data('layer' , $elem.data('layer')).addClass('selected');
            }
          }
        }
        this.presenter.toggleLayer(layerSlug);
        ga('send', 'event', 'Map', 'Toggle', 'Layer: ' + layerSlug);
      }
    },

    _toggleLayerWrap: function(e){
      if (!$(e.target).hasClass('source') && !$(e.target).parent().hasClass('source') && !$(e.target).hasClass('layer')) {
        var $layers = $(e.currentTarget).find('.layer');

        if ($(e.currentTarget).hasClass('selected')) {
          _.each($layers, _.bind(function(layer){
            if ($(layer).hasClass('selected')) {
              $(layer).click();
            }
          }, this ))
        }else{
          $($layers[0]).click();
        }
      }
    },

    toogleSelectedWrapper: function(layers){
      // Toggle sublayers
      _.each(this.$el.find('.wrapped-layer'), function(li) {
        var $li = $(li);
        var $toggle = $li.find('.onoffradio, .onoffswitch');
        var $toggleIcon = $toggle.find('span');
        var $layerTitle = $li.find('.layer-title');
        var selected = 0;
        var layer = $li.hasClass('active');
        var $layers = $li.find('.layer');

        _.each($layers, _.bind(function(layer){
          if ($(layer).hasClass('selected')) {
            selected ++;
          }
        }, this ))

        if (selected > 0) {
          $li.addClass('selected');
          $toggle.addClass('checked');
          $layerTitle.css('color', '#cf7fec');
          $toggle.css('background', '#cf7fec');
        } else {
          $li.removeClass('selected');
          $toggle.removeClass('checked').css('background', '').css('border-color', '');
          $toggleIcon.css('background-color', '');
          $layerTitle.css('color', '');
        }
      });

    },


    toggleUmd: function(e){

      _.each(this.$UMDlayers, _.bind(function(layer){
        if (this.$toggleUMD.find('.onoffradio').hasClass('checked')) {
          if ($(layer).hasClass('selected')) {
            $(layer).trigger('click');
          }
        }else{
          if (!$(layer).hasClass('selected')) {
            $(layer).trigger('click');
          }
        }
      }, this));
    },

    checkUMD: function(){
      var count = 0;
      _.each(this.$UMDlayers, _.bind(function(layer){
        if ($(layer).hasClass('selected')) {
          count ++;
        }
      }, this));
      (count == 2) ? this.$toggleUMD.find('.onoffradio').addClass('checked') : this.$toggleUMD.find('.onoffradio').removeClass('checked');
    },


    setIso: function(iso){
      this.iso = iso.country;
      this.region = iso.region;
      this.setIsoLayers();
    },

    updateIso: function(iso){
      // This is for preventing blur on layers nav
      this.$categoriesList.width('auto');
      (iso.country !== this.iso) ? this.resetIsoLayers() : null;
      this.iso = iso.country;
      this.region = iso.region;
      this.setIsoLayers();
    },

    _resetIso: function(){
      this.presenter.resetIso();
    },

    /**
     * Render Iso Layers.
     */
    _getIsoLayers: function(layers) {
      this.layersIso = layers;
    },

    resetIsoLayers: function(){
      _.each(this.$countryLayers.find('.layer'),function(li){
        if ($(li).hasClass('selected')) {
          $(li).click();
        }
      })
    },

    setIsoLayers: function(e){
      var layersToRender = [];
      _.each(this.layersIso, _.bind(function(layer){
        if (layer.iso === this.iso) {
          layersToRender.push(layer);
        }
      }, this ));

      if (!!this.iso && this.iso !== 'ALL') {
        this.$countryLayersReset.removeClass('hidden');
      }else{
        this.$countryLayersReset.addClass('hidden');
      }


      if(layersToRender.length > 0) {
        this.$countryLayers.addClass('active').removeClass('disabled');
        this.$countryLayersReset.addClass('active').removeClass('disabled');
      }else{
        this.$countryLayers.removeClass('active').addClass('disabled');
        this.$countryLayersReset.removeClass('active').addClass('disabled');
      }
      this.renderIsoLayers(layersToRender);
    },

    renderIsoLayers: function(layers){
      var country = _.find(amplify.store('countries'), _.bind(function(country){
        return country.iso === this.iso;
      }, this ));
      var name = (country) ? country.name : 'Country';
      (country) ? this.$countryLayers.addClass('iso-detected') : this.$countryLayers.removeClass('iso-detected');
      this.$countryLayers.html(this.templateCountry({ country: name ,  layers: layers }));
      for (var i = 0; i< layers.length; i++) {
        if (!!layers[i].does_wrapper) {
          var self = this;
          var wrapped_layers = JSON.parse(layers[i].does_wrapper);
          self.$countryLayers.find('.does_wrapper').html(self.templateCountryWrapper({layers: wrapped_layers}));
          var removeLayerFromCountry = function(layer) {
            self.$countryLayers.find('[data-layer="' +  layer.slug + '"]:not(.wrapped)').remove();
          }
          _.each(wrapped_layers,removeLayerFromCountry);
        }
      }

      this.fixLegibility();

      this.presenter.initExperiment('source');
      this._toggleSelected(this.layers);
    },

    fixLegibility: function(){
      var w = this.$categoriesList.width();
      if (w%2 != 0) {
        // This is for preventing blur on layers nav
        this.$categoriesList.width(w+1);
      }

    },

    _showNotification: function(e){
      if ($(e.currentTarget).hasClass('disabled')) {
        if($(e.currentTarget).hasClass('iso-detected')){
          this.presenter.notificate('not-country-not-has-layers');
        }else{
          this.presenter.notificate('not-country-choose');
          $('#countries-tab-button').addClass('pulse');
          setTimeout(function(){
            $('#countries-tab-button').removeClass('pulse');
          },3000);
        }
      }
    }

  });

  return LayersNavView;

});
