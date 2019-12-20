/**
 * Creates the window for the application.
 *
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
var runApp = function() {
  if (chrome.power) {
    chrome.power.requestKeepAwake('display');
  }
  console.log(config);
  chrome.app.window.create(
      config ?
      'exported_app_view.html' :
      'designer_view.html',
      {
        id: 'KioskDesignerWindow',
        width: 1100,
        height: 720,
        minWidth: 800,
        minHeight: 600
      },
      function(win) {
        if (!this.X) { return; }
        var window = win.contentWindow;
        window.onload = function() {
          this.$addWindow(window);
          var Y = this.X.subWindow(window, 'Kiosk Designer Window');
          this.DOM.init(Y);
        }.bind(this);
        win.onClosed.addListener(function() {
          this.$removeWindow(window);
        }.bind(this));
      }.bind(this));
}.bind(this);

/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/trunk/apps/app.runtime.html
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  runApp();
});


/**
 * Listens for the app restarting then re-creates the window.
 *
 * @see http://developer.chrome.com/trunk/apps/app.runtime.html
 */
chrome.app.runtime.onRestarted.addListener(function() {
  runApp();
});
