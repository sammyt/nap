(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD.
    define('window', window)
    define(['window'], factory);
  } else {
    // Browser globals
    root.nap = factory(root);
  }
}(this, function (nap_window) {