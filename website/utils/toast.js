import Notify from "simple-notify";
// https://www.npmjs.com/package/simple-notify

export function toast(status, title, text) {
  function pushNotify() {
    new Notify({
      status: status,
      title: title,
      text: text,
      effect: "fade",
      speed: 300,
      customClass: null,
      customIcon: null,
      showIcon: true,
      showCloseButton: true,
      autoclose: true,
      autotimeout: 7000,
      gap: 20,
      distance: 20,
      type: 1,
      position: "right bottom"
    });
  }

  pushNotify();
}
