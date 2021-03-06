ttTools = {

  loadRetry : 30,
  load : function (retry) {
    if (!turntable
      || !ttTools.getRoom()
    ) {
      if (retry > ttTools.loadRetry) { return alert('Could not load ttTools.'); }
      var callback = function () { ttTools.load(retry++); }
      return setTimeout(callback, 1000);
    }
    ttTools.init();
  },

  init : function() {
    var form = $('div.chat-container form');
    form.find('input').val('I <3 ttTools! http://tttools.egeste.net/');

    $('<link/>', {
      type : 'text/css',
      rel  : 'stylesheet',
      href : 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.1/themes/sunny/jquery-ui.css'
    }).appendTo(document.head);
    
    this.idleTimeOverride();
    this.removeDjOverride();
    this.setCurrentSongOverride();

    this.populateActivityLog();
    this.showChatMessageOverride();
    this.updateVotesOverride();
    this.removeUserOverride();
    this.addUserOverride();

    this.views.menu.render();
    this.views.toolbar.render();
    this.views.users.render();
    this.views.chat.render();

    if (this.database.isSupported()) { this.tags.load(0); }
    if (this.portability.isSupported()) { this.portability.init(); }
  },

  getRoom : function() {
    for (var memberName in turntable) {
      var member = turntable[memberName];
      if (member == null) { continue; }
      if (typeof member != 'object') { continue; }
      if (member.hasOwnProperty('setupRoom')) {
        return member;
      }
    }
    return false;
  },

  getRoomManager : function(room) {
    var room = room ? room : this.getRoom();
    for (var memberName in room) {
      var member = room[memberName];
      if (member == null) { continue; }
      if (typeof member != 'object') { continue; }
      if (member.hasOwnProperty('blackswan')) {
        return member;
      }
    }
    return false;
  },

  idleTimeOverride : function () {
    turntable.idleTime = function () {
      return 0;
    };
  },

  autoDJ      : false,
  autoDJDelay : 2000,
  removeDjOverride : function () {
    var room = this.getRoom();
    room.removeDjFunc = room.removeDj;
    room.removeDj = function (userId) {
      if (userId != this.selfId && !this.isDj() && ttTools.autoDJ) {
        setTimeout(function() {
          room.becomeDj();
          ttTools.autoDJ = false;
          $('#autoDJ').prop('checked', false).button('refresh');
        }, ttTools.autoDJDelay);
      }
      this.removeDjFunc(userId);
    };
  },

  autoAwesome      : false,
  autoAwesomeDelay : 30000,
  setCurrentSongOverride : function () {
    var room = this.getRoom();
    room.setCurrentSongFunc = room.setCurrentSong;
    room.setCurrentSong = function (roomState) {
      this.setCurrentSongFunc(roomState);
      room.downvoters = [];
      ttTools.upvotes = room.upvoters.length;
      ttTools.downvotes = 0;
      if (ttTools.autoAwesome) {
        setTimeout(function() {
          turntable.whenSocketConnected(function() {
            room.connectRoomSocket('up');
          });
        }, ttTools.autoAwesomeDelay);
      }
    };
  },

  userActivityLog : {},
  populateActivityLog : function () {
    var users = Object.keys(this.getRoom().users);
    $(users).each(function (index, uid) {
      ttTools.userActivityLog[uid] = {
        message : util.now(),
        vote    : util.now()
      }
    });
  },

  showChatMessageOverride : function () {
    var room = this.getRoom();
    room.showChatMessageFunc = room.showChatMessage;
    room.showChatMessage = function (uid, name, msg) {
      this.showChatMessageFunc(uid, name, msg);
      ttTools.views.chat.update();
      ttTools.userActivityLog[uid].message = util.now();
    }
  },

  upvotes : 0,
  downvotes : 0,
  updateVotesOverride : function () {
    var room = this.getRoom();
    if (!room.downvoters) { room.downvoters = []; }
    this.upvotes = room.upvoters.length;
    room.updateVotesFunc = room.updateVotes;
    room.updateVotes = function (votes, g) {
      this.updateVotesFunc(votes, g);
      ttTools.upvotes   = votes.upvotes;
      ttTools.downvotes = votes.downvotes;
      if (!this.downvoters) { this.downvoters = []; }
      $(votes.votelog).each(function (index, vote) {
        if (vote[0] != '') {
          ttTools.userActivityLog[vote[0]].vote = util.now();
          if (vote[1] == 'up') {
            var downIndex = $.inArray(vote[0], room.downvoters);
            if (downIndex > -1) { room.downvoters.splice(downIndex, 1); }
          } else {
            room.downvoters.push(vote[0]);
          }
        }
      });
    }
  },

  removeUserOverride : function () {
    var room = this.getRoom();
    room.removeUserFunc = room.removeUser;
    room.removeUser = function (uid) {
      this.removeUserFunc(uid);
      delete ttTools.userActivityLog[uid];
    }
  },

  addUserOverride : function (user) {
    var room = this.getRoom();
    room.addUserFunc = room.addUser;
    room.addUser = function (user) {
      this.addUserFunc(user);
      ttTools.userActivityLog[user.userid] = {
        message : util.now(),
        vote    : util.now()
      }
    }
  },

  showTheLove : function () {
    var room = this.getRoom();
    var roomManager = this.getRoomManager(room);
    var maxOffset = 200 * Object.keys(room.users).length;
    for (user in room.users) {
      setTimeout(function (user) {
        roomManager.show_heart(user);
      }, Math.round(Math.random() * maxOffset), user);
    }
  },

  resetPlayer : function () {
    var room = this.getRoom();
    if (!room.currentSong) { return; }
    turntablePlayer.playSong(
      room.roomId,
      room.currentSong._id,
      room.currentSong.starttime + turntable.clientTimeDelta + 2
    );
  },

  donateButton : function () {
    return "<form action='https://www.paypal.com/cgi-bin/webscr' method='post' target='_blank'>\
      <input type='hidden' name='cmd' value='_s-xclick'>\
      <input type='hidden' name='hosted_button_id' value='ZNTHAXPNKMKBN'>\
      <input type='image' src='https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif' border='0' name='submit' alt='PayPal - The safer, easier way to pay online!'>\
      <img alt='' border='0' src='https://www.paypalobjects.com/en_US/i/scr/pixel.gif' width='1' height='1'>\
      </form>";
  }
}
