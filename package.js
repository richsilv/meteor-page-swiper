Package.describe({
  name: 'richsilv:page-slider',
  summary: 'Page slider plugin for Meteor',
  version: '0.0.1',
  git: 'https://github.com/richsilv/meteor-page-slider.git'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.2.1');
  api.use(['templating@1.0.10', 'jquery@1.0.2', 'underscore@1.0.2'], 'client');
  api.addFiles('page-slider.html', 'client');
  api.addFiles('page-slider.js', 'client');
  api.addFiles('page-slider.css', 'client');
  api.export('PageSlider');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('page-slider');
  api.addFiles('page-slider-tests.js');
});
