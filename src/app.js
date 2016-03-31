var pSlider = (function(window, undefined) {
    var controller,
        wipeAnimation,
        scene;

    var ui = {
        el: '.p-slider',
        skipSlides: null,
        slides: null,
        sliderControls: null,
        slideAnchors: null
    };

    var state = {
        currentSlide: null
    }

    function init() {
        initUI();
        initController();
        initAnimation();
        initScene();
        bindEvents();
    }

    function initUI() {
        ui.slides = $(ui.el).find('.p-slider__slide');
        ui.skipSlides = $(ui.el).find('.p-slider__skip-slides');
        ui.sliderControls = $(ui.el).find('.p-slider__controls');

        buildSlideAnchors();

        updateActiveSlide(ui.slides[0]);
    }

    function buildSlideAnchors() {
        $.each(ui.slides, function(i) {
            var listItem = $('<li class="p-slider__dot"><button class="p-slider__dot-button">' + i + '</button></li>');

            ui.sliderControls.append(listItem);
        });

        ui.slideAnchors = $(ui.sliderControls).find('.p-slider__dot');
    }

    function initController() {
        controller = new ScrollMagic.Controller({
            globalSceneOptions: {
                triggerHook: "onLeave"
            }
        });

        controller.scrollTo(function(pos) {
            TweenMax.to(window, 1, {
                scrollTo: {
                    y: pos,
                    autoKill: true
                }
            });
        });
    }

    function initAnimation() {
        wipeAnimation = new TimelineMax();

        $.each(ui.slides, function(i, slide) {
            wipeAnimation.add(TweenMax.to(slide, 2000, {y: '0'}));

            wipeAnimation.add(TweenMax.fromTo(slide, 5000, {y: '0'}, {
                y: '-100%',
                onStart: function() {
                    updateActiveSlide(slide);
                },
                onReverseComplete: function() {
                    updateActiveSlide(slide);
                }
            }));
        });
    }

    function initScene() {
        scene = new ScrollMagic.Scene({
            triggerElement: ui.el,
            duration: '100%'
        })
        .setTween(wipeAnimation)
        .setPin(ui.el, {
            pushFollowers: false
        })
        .addTo(controller);
    }

    function bindEvents() {
        scene.on('progress', function (event) {
            var progress = event.progress.toFixed(2);
            var direction = controller.info('scrollDirection');
            var slide1 = progress > 0.15 && progress < 0.33;
            var slide2 = progress > 0.48 && progress < 0.66;
            var newPos;
            // var slide3 = progress > 0.63 && progress < 0.66;

            if (direction === 'FORWARD') {
                if (slide1) { // first slide
                    newPos = ($(window).height() / ui.slides.length) * 1;
                    controller.scrollTo(newPos);
                    // scene.progress(0.33);
                } else if (slide2) {
                    newPos = ($(window).height() / ui.slides.length) * 2;
                    controller.scrollTo(newPos);
                    // controller.scrollTo('#' + ui.slides[2].id);
                }
            } else if (direction === 'REVERSE') {
                
            }

        });

        scene.on('end', function(event) {
            endSlider();
        });

        ui.skipSlides.on('click.skipSlides', function(e) {
            var target = $($(this).attr('href'));

            e.preventDefault();

            $('html, body').animate({
                scrollTop: target.offset().top
            }, 2000);
        });

        ui.slideAnchors.on('click.navigateToSlide', function(e) {
            var slideNum = $(this).text();
            var newPos = ($(window).height() / ui.slides.length) * slideNum;            

            e.preventDefault();
            controller.scrollTo(newPos);
        });
    }

    function updateActiveSlide(slide) {
        var slideIndex = $(slide).index();

        state.currentSlide = slide;

        $(ui.slides).add(ui.slideAnchors).removeClass('is-active');
        $(state.currentSlide).add(ui.slideAnchors[slideIndex]).addClass('is-active');
    }

    function endSlider() {
        state.currentSlide = null;

        $(ui.slides).add(ui.slideAnchors).removeClass('is-active');

        TweenMax.to(ui.skipSlides, '.5', {bottom: - ui.skipSlides.outerHeight()});
    }

    return {
        init: init,
        ui: ui
    }
})(window);

pSlider.init();