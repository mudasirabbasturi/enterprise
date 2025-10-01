import axios from "axios";
window.axios = axios;

window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

// import Echo from "laravel-echo";
// import Pusher from "pusher-js";

// window.Pusher = Pusher;

// window.Echo = new Echo({
//   broadcaster: "pusher",
//   key: "5158315c26b8f6732773",
//   cluster: "ap2",
//   forceTLS: true,
// });

// window.Echo.channel("my-channel").listen(".my-event", function (data) {
//   alert(JSON.stringify(data));
// });
