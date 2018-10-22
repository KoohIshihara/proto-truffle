
riot.enableReloadContent = true;

riot.route('/test/*', function(tagName) {
  riot.mount('modal-content', 'page-test', {content: 'content'});
  riot.update();
})

riot.route('/users/*', function(uid) {
  riot.mount('header', 'util-header', {status: 'back'});
  riot.mount('modal-content', 'page-user-account', {content: uid});
  riot.update();
})

riot.route('/edit-profile', function() {

  if('profileContentToEdit' in riot){
    riot.mount('header', 'util-header', {
      status: 'add_profile',
      label: riot.profileContentToEdit.label,
    });
  }else{
    riot.mount('header', 'util-header', {
      status: 'add_profile',
    });
  }
  riot.mount('modal-content', 'page-edit-profile', {content: 'content'});
  riot.update();
})

riot.route('/login', function(tagName) {

  if(riot.enableFadeIn) $('content').removeClass('not-opacity');

  riot.enableFadeIn = true;

  $(document).trigger("custom:close");

  setTimeout(function() {
    $('content').addClass('not-opacity');
    riot.mount('content', 'page-login', {content: 'content'});
    riot.update();
  }, 400);
})

riot.route('/user-list', function(tagName) {

  if(riot.enableFadeIn) $('content').removeClass('not-opacity');

  riot.enableFadeIn = true;

  riot.mount('header', 'util-header', {status: 'normal'});
  riot.update();

  $(document).trigger("custom:close");

  //if(riot.enableReloadContent){
    setTimeout(function() {
      $('content').addClass('not-opacity');
      riot.mount('content', 'page-user-list', {content: 'content'});
      riot.update();
    }, 400);
  //}else{
    riot.enableReloadContent = true;
  //}
})

riot.route(function(tagName) {
  window.location.href = './#login';
  /*
  if(riot.enableFadeIn) $('content').removeClass('not-opacity');

  riot.enableFadeIn = true;

  $(document).trigger("custom:close");

  setTimeout(function() {
    $('content').addClass('not-opacity');
    riot.mount('content', 'page-login', {content: 'content'});
    riot.update();
  }, 400);
  */
});

riot.route.start(true);

var tags = riot.mount('app');