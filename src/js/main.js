(function() {
  "use strict";

  // animate moving between anchor links
  smoothScroll.init({
    selector: "a",
    speed: 500,
    easing: "easeInOutCubic"
  });

  // better external SVG spiresheet support
  svg4everybody();

  // random placeholders for the contact form fields
  var form = document.querySelector(".contact"),
      names = [
        "Paul Bunyan",
        "Luke Skywalker",
        "Jason Bourne",
        "James Bond"
      ],
      messages = [
        "Like what you see? Let me know!",
        "Want to know more? Get in touch!",
        "Hey! Did I tickle your fancy?"
      ];

  form.querySelector("[id='name']").placeholder = randomFromArray(names);
  form.querySelector("[id='message']").placeholder = randomFromArray(messages);

  function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

})();
