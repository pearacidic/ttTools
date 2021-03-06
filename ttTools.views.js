ttTools.views = {

  menu : {
    render : function () {
      $('<div class="menuItem">ttTools</div>').click(function (e) {
        ttTools.views.settings.render();
      }).insertBefore($('div#menuh').children().last());
    }
  },

  settings : {
    render : function () {
      util.showOverlay(util.buildTree(this.tree()));
      $('div.settingsOverlay.modal').append(ttTools.donateButton());

      $('<style/>', {
        type : 'text/css',
        text : "\
        div.field.settings { padding:10px 20px; }\
        div.field.settings .ui-slider {\
          height:0.5em;\
          margin:10px 0 3px;\
        }\
        div.field.settings .ui-slider .ui-slider-handle {\
          width:0.9em;\
          height:0.9em;\
        }\
        #autoDJDisplay, #autoAwesomeDisplay { text-align:center; }\
      "}).appendTo($('div.settingsOverlay.modal'));

      $('#autoDJDelay').slider({
        max   : 5000,
        min   : 0,
        step  : 100,
        value : ttTools.autoDJDelay,
        slide : function (event, ui) {
          ttTools.autoDJDelay = ui.value;
          $('#autoDJDisplay').text(ui.value/1000 + ' s');
        }
      });
      $('#autoAwesomeDelay').slider({
        max   : 60000,
        min   : 0,
        step  : 1000,
        value : ttTools.autoAwesomeDelay,
        slide : function (event, ui) {
          ttTools.autoAwesomeDelay = ui.value;
          $('#autoAwesomeDisplay').text(ui.value/1000 + ' s');
        }
      });
    },

    tree : function () {
      return ['div.settingsOverlay.modal', {},
        ['div.close-x', {
          event : {
            click : util.hideOverlay
          }
        }],
        ['h1', 'ttTools'],
        ['div', {}, ttTools.release],
        ['br'],
        ['div.fields', {},
          ['div.field.settings', {},
            ['div', {}, 'Auto DJ Delay'],
            ['div#autoDJDelay', {}],
            ['div#autoDJDisplay', {}, ttTools.autoDJDelay/1000 + ' s'],
            ['br'],
            ['div', {}, 'Auto Awesome Delay'],
            ['div#autoAwesomeDelay', {}],
            ['div#autoAwesomeDisplay', {}, ttTools.autoAwesomeDelay/1000 + ' s']
          ],
        ]
      ];
    }
  },

  toolbar : {
    render : function () {
      turntable.playlist.setPlaylistHeightFunc = turntable.playlist.setPlaylistHeight;
      turntable.playlist.setPlaylistHeight = function (a) {
        var a = this.setPlaylistHeightFunc(a);
        $(turntable.playlist.nodes.root).find(".queueView .songlist").css({
            height: Math.max(a - 120, 55)
        });
        return a;
      }
      turntable.playlist.setPlaylistHeight($('div.chat-container').css('top').replace('px', ''));

      $('<style/>', {
        type : 'text/css',
        text : "\
        div.resultsLabel {\
          top:65px !important;\
          height:20px !important;\
          padding-top:7px !important;\
          background-color:#CCC !important;\
        }\
        div.songlist {\
          font-size:0.5em;\
          top:95px !important;\
        }\
        #playlistTools {\
          left:0;\
          right:0;\
          top:65px;\
          height:2em;\
          padding:2px 0;\
          position:absolute;\
        }\
        #playlistTools label {\
          font-size:10px;\
          text-shadow:none;\
        }\
        #playlistTools button { width:20px; }\
        #playlistTools button .ui-button-text { padding:11px; }\
        #playlistTools div, #playlistTools button { float:left; }\
        #switches { margin:0 5px; }\
        #switches ui-button-text { padding:.4em; }\
      "}).appendTo(document.head);

      $(util.buildTree(this.tree())).insertAfter(
        $('form.playlistSearch')
      );

      $('#switches').buttonset();

      $('#autoDJ').click(function (e) {
        var room = ttTools.getRoom();
        ttTools.autoDJ = !ttTools.autoDJ;
        if(ttTools.autoDJ && !room.isDj() && room.djIds.length < room.maxDjs) {
          room.becomeDj();
        }
      }).prop('checked', ttTools.autoDJ).button('refresh');

      $('#autoAwesome').click(function (e) {
        ttTools.autoAwesome = !ttTools.autoAwesome;
        if(ttTools.autoAwesome) {
          turntable.whenSocketConnected(function () {
            ttTools.getRoom().connectRoomSocket('up');
          });
        }
      }).prop('checked', ttTools.autoAwesome).button('refresh');

      $('#userList').button({
        text  : false,
        icons : {
          primary : 'ui-icon-person'
        }
      }).click(function (e) {
        var userDialog = $('#usersDialog');
        if (userDialog.dialog('isOpen')) {
          userDialog.dialog('close');
        } else {
          userDialog.dialog('open');
        }
      });

      $('#showTheLove').button({
        text  : false,
        icons : {
          primary: 'ui-icon-heart'
        }
      }).click(function (e) {
        ttTools.showTheLove();
      });

      $('#resetPlayer').button({
        text  : false,
        icons : {
          primary: 'ui-icon-refresh'
        }
      }).click(function (e) {
        ttTools.resetPlayer();
      });

      $('#exportQueue').button({
        text  : false,
        icons : {
          primary : 'ui-icon-disk'
        }
      }).click(function (e) {
        util.hideOverlay();
        ttTools.portability.exportSongs();
      });
    },

    tree : function () {
      return ['div#playlistTools', {},
        ['div#switches', {},
          ['input#autoDJ.ui-icon.ui-icon-person', { type : 'checkbox', title: 'Auto DJ' }],
          ['label', { 'for' : 'autoDJ' }, 'DJ Next'],
          ['input#autoAwesome', { type : 'checkbox', title: 'Auto Awesome' }],
          ['label', { 'for' : 'autoAwesome' }, 'Up-Vote'],
        ],
        ['button#userList', { title: 'User List' }],
        ['button#showTheLove', { title: 'Show The Love' }],
        ['button#resetPlayer', { title: 'Reset Player' }],
        ['button#exportQueue', { title : 'Export Playlist' }]
      ];
    }
  },

  users : {
    render : function () {
      $('<div/>', {
        id : 'usersDialog'
      }).append(
        $('<table/>', {
          id      : 'usersList',
          'class' : 'ui-widget ui-widget-content'
        })
      ).appendTo(document.body);

      $('#usersDialog').dialog({
        autoOpen      : false,
        closeOnEscape : true,
        title         : 'Users',
        width         : '500',
        height        : '300',
        open          : ttTools.views.users.update,
        show          : 'slide'
      });
      
      $('<style/>', {
        type : 'text/css',
        text : "\
        #usersList {\
          width:100%;\
          text-shadow:none;\
          font-size:14px;\
        }\
        #usersList .time { text-align: right; }\
        #usersList .upvoter { background-color:#aea; }\
        #usersList .downvoter { background-color:#eaa; }\
        #usersList .currentDj { background-color:#ccf; }\
        #usersList .user { font-weight: bold; cursor: pointer; }\
        #usersList .user .ui-icon { display:inline-block; }\
        #ui-dialog-title-usersDialog { width:100%; text-align:right; }\
        #ui-dialog-title-usersDialog .ui-icon { display:inline-block; }\
        #ui-dialog-title-usersDialog .vote { float:left; }\
        #ui-dialog-title-usersDialog .vote.up { color:#aea; padding-right:10px; }\
        #ui-dialog-title-usersDialog .vote.down { color:#eaa; }\
      "}).appendTo($('div.#usersDialog'));
    },

    update : function () {
      var usersDialog = $('#usersDialog');
      if (!usersDialog.dialog('isOpen')) { return; }
      setTimeout(ttTools.views.users.update, 1000);

      var room = ttTools.getRoom();

      usersDialog.dialog(
        'option',
        'title',
        "<span class='usercount'>" + Object.keys(room.users).length + "</span>\
        <span class='usercount ui-icon ui-icon-person'></span>\
        <span class='vote ui-icon ui-icon-triangle-1-n'></span>\
        <span class='vote up'>" + ttTools.upvotes + "</span>\
        <span class='vote ui-icon ui-icon-triangle-1-s'></span>\
        <span class='vote down'>" + ttTools.downvotes + "</span>"
      );
      $('#ui-dialog-title-usersDialog').parent().css('padding', '5px 30px 0 10px');

      var usersList = $('#usersList').html(
        '<tbody><tr>' +
        '<th>Name</th>' +
        '<th>Message</th>' +
        '<th>Vote</th>' +
        '</tr></tbody>'
      );

      var nameAlpha = function (a, b) {
        if (!room.users[a]) { return 1; }
        if (!room.users[b]) { return -1; }
        a = room.users[a].name.toLowerCase();
        b = room.users[b].name.toLowerCase();
        if (a < b) { return -1; }
        if (a > b) { return 1; }
        return 0;
      };

      if (room.currentDj) {
        usersList.find('tbody').append(
          $(util.buildTree(ttTools.views.users.rowForUser(room.users[room.currentDj])))
        );
      }

      room.upvoters.sort(nameAlpha);
      $(room.upvoters).each(function (index, uid) {
        if (room.users[uid]) {
          usersList.find('tbody').append(
            $(util.buildTree(ttTools.views.users.rowForUser(room.users[uid])))
          );
        }
      });

      room.downvoters.sort(nameAlpha);
      $(room.downvoters).each(function (index, uid) {
        if (room.users[uid]) {
          usersList.find('tbody').append(
            $(util.buildTree(ttTools.views.users.rowForUser(room.users[uid])))
          );
        }
      });

      var users = Object.keys(room.users).sort(nameAlpha);
      $(users).each(function (index, uid) {
        var currentDj = uid == room.currentDj;
        var upvoter = $.inArray(uid, room.upvoters) > -1;
        var downvoter = $.inArray(uid, room.downvoters) > -1;
        if (!currentDj && !upvoter && !downvoter) {
          usersList.find('tbody').append(
            $(util.buildTree(ttTools.views.users.rowForUser(room.users[uid])))
          );
        }
      });
    },

    rowForUser : function (user) {
      var room = ttTools.getRoom();
      var dj = $.inArray(user.userid, room.djIds) > -1 ? ['div', { 'class':'ui-icon ui-icon-volume-on' }] : null;
      var mod = $.inArray(user.userid, room.moderators) > -1 ? ['div', { 'class':'ui-icon ui-icon-alert' }] : null;
      var state = user.userid == room.currentDj ? 'currentDj' : '';
      state += $.inArray(user.userid, room.upvoters) > -1 ? 'upvoter' : '';
      state += $.inArray(user.userid, room.downvoters) > -1 ? 'downvoter' : '';
      return ['tr', { 'class' : state },
        ['td', {
          'class' : 'user',
          event : {
            click : function (e) {
              ttTools.getRoomManager().toggle_listener(user.userid)
            }
          }
        }, mod, dj, user.name],
        ['td', { 'class' : 'time' }, this.timestamp(ttTools.userActivityLog[user.userid].message)],
        ['td', { 'class' : 'time' }, this.timestamp(ttTools.userActivityLog[user.userid].vote)]
      ];
    },

    timestamp : function (time) {
      var date = new Date(util.now() - time);
      var mins = date.getUTCMinutes() < 10 ? '0' + date.getUTCMinutes() : date.getUTCMinutes();
      var secs = date.getUTCSeconds() < 10 ? '0' + date.getUTCSeconds() : date.getUTCSeconds();
      return date.getUTCHours() + ':' + mins + ':' + secs;
    }
  },

  chat : {
    render : function () {
      $('<style/>', {
        type : 'text/css',
        text : "\
        .message.marker {\
          border-bottom:1px solid #00f;\
          background-color:#D2E6FC !important;\
        }\
      "}).appendTo($(document.head));
      this.update();
    },

    update : function () {
      $('.messages .message').unbind('click').click(function (e) {
        var element = $(this);
        element.toggleClass('marker');
      });
    }
  }
}
