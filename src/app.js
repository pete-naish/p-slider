var pSlider = (function(window, $, undefined) {
    var controller;
    var wipeAnimation;
    var scene; 

    var ui = {
        el: '.p-slider',
        skipSlides: null,
        slides: null,
        slideCount: 0,
        sliderNav: null,
        slideButtons: null
    };

    var state = {
        currentSlide: null,
        scrolling: false
    };

    function init() {
        initUI();
        initController();
        initAnimation();
        initScene();
        bindEvents();
    }

    function initUI() {
        ui.slides = $(ui.el).find('.p-slider__slide');
        ui.slideCount = ui.slides.length;
        ui.sliderNav = $(ui.el).find('.p-slider-nav');
        ui.skipSlides = $(ui.el).find('.p-slider__skip-slides');

        $.each(ui.slides, function(i, slide) {
            setZindexes(i, slide);
            buildSlideButtons(i, slide);
            initVideos(i, slide);
        });

        ui.slideButtons = $(ui.sliderNav).find('.p-slider-nav__item');

        setTimeout(function() {
            $(ui.el).removeClass('is-loading');
            updateActiveSlide(ui.slides[0]);
        }, 500);
    }

    function setZindexes(i, slide) {
        $(slide).css('z-index', ui.slideCount - i);

        $(ui.sliderNav).add(ui.skipSlides).css('z-index', ui.slideCount + 1);
        $('header').css('z-index', ui.slideCount + 2);
    }

    function buildSlideButtons(i, slide) {
        $('<li>', {
            class: 'p-slider-nav__item'
        })
        .append($('<button>', {
            class: 'p-slider-nav__button',
            text: i
        }))
        .appendTo(ui.sliderNav);
    }

    function initVideos(i, slide) {
        var videoUri = $(slide).data('video');

        if (videoUri) {
            $(slide).vide({
                mp4: videoUri,
                webm: '',
                ogv: '',
                poster: ''
            }, {
                posterType: 'none',
                loop: false,
                autoplay: false,
                className: 'p-slider__video'
            });

            slide.video = $(slide).data('vide').getVideoObject();

            bindVideoEvents(slide.video);
        }
    }

    function bindVideoEvents(video) {
        $(video).on('canplaythrough', function(e) {
            var slide = $(video).parents('.p-slider__slide');
            var playFirstSlide = slide.index() === 0 && slide.hasClass('is-active');

            video.hasLoaded = true;

            if (playFirstSlide) {
                video.play
            }

            $(video).off('canplaythrough').parent().addClass('has-loaded'); // unbind this after first run, as restarting video (in playVideo func) causes the canplaythrough event to be fired every time the slide is viewed
        })
        .on('error', function(e) {
            video.load();
            video.play();
        });
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
                    autoKill: false
                },
                onComplete: function() {
                    setTimeout(function() {
                        scene.on('progress.SnapScroll', snapScroll);
                        state.scrolling = false;
                    }, 500);
                }
            });
        });
    }

    function initAnimation() {
        wipeAnimation = new TimelineMax();

        $.each(ui.slides, function(i, slide) {
            var nextSlideOverlay = $(slide).next().find('.p-slider__overlay');

            wipeAnimation
                .add([
                    TweenMax.fromTo(slide, 5000, {
                        y: '0'
                    }, {
                        y: '-100%',
                        onComplete: function() {
                            if (i < ui.slideCount - 1) { // don't run on last slide
                                updateActiveSlide(ui.slides[i + 1]); // activate next slide
                            }
                        },
                        onReverseComplete: function() {
                            updateActiveSlide(slide);
                        }
                    }),
                    TweenMax.fromTo(nextSlideOverlay, 5000, {
                        backgroundColor: 'rgba(0, 0, 0, 1)'
                    }, {
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        delay: 500
                    })
                ])
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
        scene
        .on('progress.SnapScroll', snapScroll)
        .on('end', endSlider);

        ui.skipSlides.on('click.skipSlides', function(e) {
            var target = $($(this).attr('href'));

            e.preventDefault();

            scene.off('progress.SnapScroll');

            $('html, body').animate({
                scrollTop: target.offset().top
            }, 2000, function() {
                scene.on('progress.SnapScroll', snapScroll);                
            });
        });

        ui.slideButtons.on('click.navigateToSlide', '.p-slider-nav__button', function(e) {
            var slideNum = $(this).text();
            var newPos = ($(window).height() / ui.slideCount) * slideNum;

            e.preventDefault();

            scene.off('progress.SnapScroll');
            controller.scrollTo(newPos);
        });
    }

    function snapScroll() {
        var direction = controller.info('scrollDirection');
        var currentIndex = $(state.currentSlide).index();
        var newIndex = direction === 'FORWARD' ? currentIndex + 1 : currentIndex - 1;
        var newPos = ($(window).height() / ui.slideCount) * newIndex;

        if (!state.scrolling) {
            controller.scrollTo(newPos);
            state.scrolling = true;
        }
    }

    function updateActiveSlide(slide) {
        var slideIndex = $(slide).index();

        state.currentSlide = slide;

        $(ui.slides).add(ui.slideButtons).removeClass('is-active');
        $(state.currentSlide).addClass('has-displayed').add(ui.slideButtons[slideIndex]).addClass('is-active');

        $.each(ui.slides, function(i, slide) { // pause and set each video back to the first frame
            slide.video.pause();
            slide.video.currentTime = 0;
        });

        if (slide.video && slide.video.hasLoaded) {
            slide.video.play();
        }
    }

    function endSlider() {
        state.currentSlide = null;

        $(ui.slides).add(ui.slideButtons).removeClass('is-active');
    }

    return {
        init: init
    }

})(window, jQuery);

pSlider.init();