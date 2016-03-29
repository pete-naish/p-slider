var controller = new ScrollMagic.Controller({
  globalSceneOptions: {
      triggerHook: "onLeave"
  }
});

var pinani = new TimelineMax()
    .add(TweenMax.to("[data-index='1']", 1, {transform: "translateY(0)"}))
    .add(TweenMax.to("[data-index='2']", 1, {transform: "translateY(0)"}));

new ScrollMagic.Scene({
  triggerElement: ".p-slider",
  duration: '100%'
})
.setTween(pinani)
.setPin(".p-slider")
.addTo(controller);