var pSlider = (function(window, undefined) {
    var slides,
        controller,
        wipeAnimation,
        scene,
        scrolling = false;

    var ui = {
        el: '.p-slider',
        skipSlides: null,
        slides: []
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
        slides = $(ui.el).find('.p-slider__slide');

        slides.each(function(i, slide) {
            ui.slides[i] = slide;
            $(slide).attr('id', 'slide' + i);
        });

        ui.skipSlides = $(ui.el).find('.p-slider__skip-slides');

        $(ui.slides[0]).addClass('is-active');

        // console.log('ui', ui);
    }

    function initController() {
        controller = new ScrollMagic.Controller({
            globalSceneOptions: {
                triggerHook: "onLeave"
            }
        });

        controller.scrollTo(function(pos) {
            console.log(pos);
            TweenMax.to(window, 5, {
                scrollTo: {
                    y: pos,
                    // autoKill: true,
                    onComplete: function() {
                        console.log('complete');
                    }
                }
            });
        });
    }

    function initAnimation() {
        wipeAnimation = new TimelineMax();

        $.each(ui.slides, function(i, slide) {
            wipeAnimation.add(TweenMax.fromTo(slide, '10', {y: '0'}, {
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
            // console.log(event);
            var progress = event.progress.toFixed(2);
            var direction = controller.info('scrollDirection');
            var slide1 = progress > 0.15 && progress < 0.33;
            var slide2 = progress > 0.48 && progress < 0.66;
            // var slide3 = progress > 0.63 && progress < 0.66;
            console.log(progress);
            console.log(event.scrollDirection);

            if (direction === 'FORWARD') {
                if (slide1) { // first slide
                    // controller.scrollTo('#' + ui.slides[1].id);
                    // scene.progress(0.33);
                } else if (slide2) {
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
    }

    function updateActiveSlide(slide) {
        state.currentSlide = slide;

        slides.removeClass('is-active');
        $(slide).addClass('is-active');
    }

    function endSlider() {
        state.currentSlide = null;

        slides.removeClass('is-active');
        TweenMax.to(ui.skipSlides, '.5', {bottom: - ui.skipSlides.outerHeight()});
    }

    return {
        init: init
    }
})(window);

pSlider.init();