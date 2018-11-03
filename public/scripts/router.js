
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


riot.route('/pre-input-profile/*', function(uid) {
  riot.toNextFunction = function(){
    window.location.href = `./#input-profile/${riot.focusedUid}`;
  };
  riot.mount('header', 'util-header', {
    status: 'back_and_next',
    uid: uid,
    label: '項目を選択'
  });
  riot.mount('modal-content', 'page-pre-input-profile', {content: uid});
  riot.update();
})


riot.route('/input-profile/*', function(uid) {
  
  //if(true)
  riot.toSaveFunction = async function(){

    if(riot.focusedUid == "new_person"){
      var invitation = await service.db.collection("invitaions").add({
        name: riot.nameToInvite,
        from: session.user.uid,
        createdAt: new Date(),
      })
      var invitationId = invitation.id;
      riot.invitationId = invitationId;
      var profiles = riot.toSaveProfiles;
      riot.toSaveProfiles = profiles.map(function(e){
        e.invitationId = invitationId;
        return e;
      })
    }

    //  TO DO: 一括書き込みができるbatchをつかおう
    riot.savedCounter = 0;
    $('#loadingForModal').fadeIn(400);
    for(var i=0; i<riot.toSaveProfiles.length; i++){
      var profileObj = riot.toSaveProfiles[i];
      service.db.collection("profiles")
      .add(profileObj)
      .then(function(){
        riot.savedCounter++;
        if(riot.savedCounter == riot.toSaveProfiles.length){
          console.log('saveComp');
          riot.toSaveProfiles = [];
          riot.savedCounter = 0;
          $('#loadingForModal').fadeOut(400);
          if(riot.focusedUid != "new_person"){
            window.history.go(-2);
          }else{
            window.location.href = `./#complete-invitation/${riot.invitationId}`;
          }
        }
      });
    } // for

    // こちらのプロフィールを書いてくれていてpublishされていないprofileを有効にする
    var profileByFromUser = await service.db.collection("profiles")
      .where("from", "==", riot.focusedUid)
      .where("to", "==", session.user.uid)
      .where("publish", "==", false)
      .get().then(function(querySnapshot) {
        var profiles = [];
        querySnapshot.forEach(function(doc) {
          profiles.push({
            data: doc.data(),
            id: doc.id,
          })
        });
        return profiles;
      });

    for(var i=0; i<profileByFromUser.length; i++){
      var doc = profileByFromUser[i];
      service.db.collection("profiles").doc(doc.id).update({publish: true});
    }

    // TO DO: fromからプロフィールを書き込んでもらっていたかどうかによる、いずれかの通知を送る
  }; // toSaveFunction()

  riot.mount('header', 'util-header', {
    status: 'back_and_save',
    uid: uid,
    label: '項目を選択'
  });
  riot.mount('modal-content', 'page-input-profile', {content: uid});
  riot.update();
})

riot.route('/complete-invitation/*', function(invitationId) {
  riot.toCompleteFunction = function(){
    window.location.href = `./#invite-user`;
  };
  riot.mount('header', 'util-header', {
    status: 'complete',
  });
  riot.mount('modal-content', 'page-complete-invitation', {invitationId: invitationId});
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

  riot.mount('header', 'util-header', {
    status: 'normal',
    label: 'リスト'
  });
  riot.update();

  $(document).trigger("custom:close");

  //if(riot.enableReloadContent){
    setTimeout(function() {
      $('content').addClass('not-opacity');
      riot.mount('content', 'page-user-list', {content: 'content'});
      riot.update();
    }, 400);
  //}
  riot.enableReloadContent = true;
  
})

riot.route('/invite-user', function(tagName) {

  if(riot.enableFadeIn) $('content').removeClass('not-opacity');

  riot.enableFadeIn = true;

  riot.toNextFunction = function(){
    window.location.href = `./#pre-input-profile/new_invitation`;
  };
  riot.mount('header', 'util-header', {
    status: 'next',
    label: '招待'
  });
  riot.update();

  $(document).trigger("custom:close");
  
  //if(riot.enableReloadContent){
    setTimeout(function() {
      $('content').addClass('not-opacity');
      riot.mount('content', 'page-invite-user', {content: 'content'});
      riot.update();
    }, 400);
  //}
  riot.enableReloadContent = true;
  
})

riot.route(function(tagName) {

  if(riot.enableFadeIn) $('content').removeClass('not-opacity');

  riot.enableFadeIn = true;

  if(tagName == 'login'){
    $(document).trigger("custom:close");
    setTimeout(function() {
      $('content').addClass('not-opacity');
      riot.mount('content', 'page-login', {content: 'content'});
      riot.update();
    }, 400);
  }else{
    window.location.href = './#login';
  }
  
});

riot.route.start(true);

var tags = riot.mount('app');