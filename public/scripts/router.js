
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

riot.route('/user-list-modal', function() {
  riot.mount('header', 'util-header', {status: 'back'});
  riot.mount('modal-content', 'page-user-list');
  riot.update();
})

riot.route('/invite-user-modal', function() {
  riot.toNextFunction = function(){
    window.location.href = `./#pre-input-profile/new_invitation`;
  };
  riot.mount('header', 'util-header', {
    status: 'back_and_next',
    label: '招待'
  });
  riot.update();

  //riot.mount('header', 'util-header', {status: 'back'});
  riot.mount('modal-content', 'page-invite-user');
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

    if(profileByFromUser[0]!=undefined){
      for(var i=0; i<riot.toSaveProfiles.length; i++){
        riot.toSaveProfiles[i].publish = true;
      }
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


    var focusedUser = await service.db.collection('users').doc(riot.focusedUid).get();
    focusedUser = focusedUser.data();
    
    var inputedCaterories = [];
    for(var i=0; i<riot.toSaveProfiles.length; i++){
      var tmp = {
        'label': riot.toSaveProfiles[i].label,
        'categoryId': riot.toSaveProfiles[i].categoryId,
      }
      inputedCaterories.push(tmp);
    }

    
    // 向こうからのプロフィールで今publishしたものがなかった場合 ＝ 一方的に書いた場合
    if(profileByFromUser[0]==undefined && riot.focusedUid != "new_person"){
      
      var notificationObj = {
        from: session.user.uid,
        to: riot.focusedUid,
        type: 'receive_profile',
        text: `${session.user.name}があなたのプロフィールを書いてくれました。${session.user.name}のプロフィールを書くと受け取ったプロフィールを確認することができます。`,
        inputedCaterories: inputedCaterories,
        href: `./#users/${session.user.uid}`,
        read: false,
        createdAt: new Date(),
      };
      await service.db.collection('notifications').add(notificationObj);

      // みんなのプロフィールを書いてみようというリコメンドを出す
      notificationObj = {
        to: session.user.uid,
        type: 'recommendation',
        text: `プロフィールを送信しました。他の人のプロフィールも書いて、あなたのプロフィールも充実させましょう。`,
        href: `./#user-list-modal`,
        read: false,
        createdAt: new Date(),
      };
      await service.db.collection('notifications').add(notificationObj);

    }else if(profileByFromUser[0] && riot.focusedUid != "new_person"){
      // お互いがプロフィールを書いたので公開されました。
      var notificationObj = {
        from: session.user.uid,
        to: riot.focusedUid,
        type: 'publish_profile',
        text: `${session.user.name}があなたのプロフィールを書いてくれたので、お互いのプロフィールが反映されました。`,
        inputedCaterories: inputedCaterories,
        href: `./#users/${riot.focusedUid}`,
        read: false,
        createdAt: new Date(),
      };
      await service.db.collection('notifications').add(notificationObj);

      notificationObj = {
        to: session.user.uid,
        type: 'publish_profile',
        text: `プロフィールを書いたのであなたと${focusedUser.name}のプロフィールが反映されました。他の人のプロフィールも書いて、あなたのプロフィールも充実させましょう。`,
        href: `./#user-list-modal`,
        read: false,
        createdAt: new Date(),
      };
      await service.db.collection('notifications').add(notificationObj);


    }else if(riot.focusedUid != "new_person"){

    }

    riot.mount('footer', 'util-footer');
    riot.update();


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
    riot.mount('content', 'page-login', {label: ''});
    riot.update();
  }, 400);
})

riot.route('/loginWithInvitation/*', function(invitationId) {
  
  if(riot.enableFadeIn) $('content').removeClass('not-opacity');

  riot.enableFadeIn = true;

  $(document).trigger("custom:close");

  setTimeout(function() {
    $('content').addClass('not-opacity');
    riot.mount('content', 'page-login-with-invitation', {content: invitationId});
    riot.update();
  }, 400);
})

riot.route('/user-list', function(tagName) {

  if(riot.enableFadeIn) $('content').removeClass('not-opacity');

  riot.enableFadeIn = true;

  riot.mount('header', 'util-header', {
    status: 'normal',
    label: 'プロフィールリスト'
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


riot.route('/notification', function(tagName) {

  if(riot.enableFadeIn) $('content').removeClass('not-opacity');

  riot.enableFadeIn = true;

  riot.toNextFunction = function(){
    window.location.href = `./#pre-input-profile/new_invitation`;
  };
  riot.mount('header', 'util-header', {
    status: 'normal',
    label: '通知'
  });
  riot.update();

  $(document).trigger("custom:close");
  
  //if(riot.enableReloadContent){
    setTimeout(function() {
      $('content').addClass('not-opacity');
      riot.mount('content', 'page-notification', {content: 'content'});
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