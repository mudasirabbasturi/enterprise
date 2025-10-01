// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js"
);

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrVBtDTx4CGveCf6fT2E74wSUgwFwwqEU",
  authDomain: "enterprise-event-trigger.firebaseapp.com",
  projectId: "enterprise-event-trigger",
  storageBucket: "enterprise-event-trigger.firebasestorage.app",
  messagingSenderId: "32159744301",
  appId: "1:32159744301:web:484d7aa9d7560e78d213a4",
  measurementId: "G-10R9PLTF0G",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  console.log("Received background message ", payload);

  // Customize notification here
  const notificationTitle = payload.notification?.title;
  const notificationOptions = {
    body: payload.notification?.body,
    icon: "/firebase-logo.png", // optional
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});
