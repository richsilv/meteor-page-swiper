Package.describe({
  name: 'richsilv:page-swiper',
  summary: 'Page swiper plugin for Meteor',
  version: '0.0.1',
  git: 'https://github.com/richsilv/meteor-page-swiper.git'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.2.1');
  api.use(['templating@1.0.10', 'jquery@1.0.2', 'underscore@1.0.2'], 'client');
  api.addFiles('snabbt/snabbt.js', 'client');
  api.addFiles('touchable.js/touchable.js', 'client');
  api.addFiles('page-swiper.html', 'client');
  api.addFiles('page-swiper.js', 'client');
  api.addFiles('page-swiper.css', 'client');
  api.export('PageSwiper');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('richsilv:page-swiper');
  api.addFiles('page-swiper-tests.js');
});
