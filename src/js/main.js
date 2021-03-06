(function() {

  "use strict";

  // animate moving between anchor hash links
  smoothScroll.init({
    selector: "a",
    speed: 500,
    easing: "easeInOutCubic"
  });

  // better external SVG spritesheet support
  svg4everybody();

  // random placeholders for the contact form fields
  var names = [
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

  document.getElementById("name").placeholder = randomFromArray(names);
  document.getElementById("email").placeholder = document.getElementById("name").placeholder.toLowerCase().replace(" ", ".") + "@domain.tld";
  document.getElementById("message").placeholder = randomFromArray(messages);
  
  // For the luls
  console.log(
    '%cpaulisaweso.me',
    'display: inline-block; padding: .5rem; background-color: #5c1492; color: #fff; border-radius: .25rem; font-family: monospace;'
  );

  function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

})();
