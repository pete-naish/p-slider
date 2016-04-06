var pSlider = (function(window, $, undefined) {
    var controller;
    var wipeAnimation;
    var scene = new ScrollMagic.Scene({
            triggerElement: '.p-slider',
            duration: '100%'
        });

    var ui = {
        el: '.p-slider',
        skipSlides: null,
        slides: null,
        slideCount: 0,
        sliderNav: null,
        slideButtons: null
    };

    var state = {
        currentSlide: null
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
            initLocalVideos(i, slide);
        });

        ui.slideButtons = $(ui.sliderNav).find('.p-slider-nav__item');

        setTimeout(function() {
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

    function initLocalVideos(i, slide) {
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
                playVideo(video);
            }

            $(video).off('canplaythrough').parent().addClass('has-loaded'); // unbind this after first run, as restarting video (in playVideo func) causes the canplaythrough event to be fired every time the slide is viewed
        })
        .on('error', function(e) {
            // console.log(e.code);
            // console.log(video.error);
            // $(video).hide();
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
                    autoKill: true
                },
                onComplete: function() {
                    scene.on('progress.SnapScroll', snapScroll);
                }
            });
        });
    }

    function initAnimation() {
        wipeAnimation = new TimelineMax();

        $.each(ui.slides, function(i, slide) {
            // var wrapper = $(slide).find('.p-slider__content-wrapper');

            wipeAnimation
                // .add(TweenMax.to(wrapper, 500, {backgroundColor: 'rgba(0, 0, 0, .1)'}))
                .add(TweenMax.to(slide, 2000, {y: '0'}))
                .add(TweenMax.fromTo(slide, 5000, {y: '0'}, {
                    y: '-100%',
                    onComplete: function() {
                        if (i < ui.slideCount - 1) { // don't run on last slide
                            updateActiveSlide(ui.slides[i + 1]); // activate next slide
                        }
                    },
                    onReverseComplete: function() {
                        updateActiveSlide(slide);
                    }
                }));
        });
    }

    function initScene() {
        // scene = new ScrollMagic.Scene({
        //     triggerElement: ui.el,
        //     duration: '100%'
        // })
        scene
        .setTween(wipeAnimation)
        .setPin(ui.el, {
            pushFollowers: false
        })
        .addTo(controller);
    }

    function bindEvents() {
        scene
        .on('progress.SnapScroll', snapScroll)
        .on('progress.addDirectionClass', addDirectionClass)
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

    function addDirectionClass() {
        var direction = controller.info('scrollDirection');

        $(ui.el).toggleClass('reverse', direction === 'REVERSE');
    }

    function snapScroll() {
        var direction = controller.info('scrollDirection');
        var currentIndex = $(state.currentSlide).index();
        var newPos;

        // console.log('snap!');

        if (direction === 'FORWARD') {
            // console.log('forward');
            // newPos = ($(window).height() / ui.slideCount) * (currentIndex + 1);
            // controller.scrollTo(newPos);
        } else if (direction === 'REVERSE') {
            // console.log('reverse');
            // newPos = ($(window).height() / ui.slideCount) * (currentIndex - 1);
            // controller.scrollTo(newPos);
        }
    }

    function updateActiveSlide(slide) {
        var slideIndex = $(slide).index();

        state.currentSlide = slide;

        $(ui.slides).add(ui.slideButtons).removeClass('is-active');
        $(state.currentSlide).addClass('has-displayed').add(ui.slideButtons[slideIndex]).addClass('is-active');

        $.each(ui.slides, function(i, slide) { // pause and set each video back to the first frame
            pauseVideo(slide.video);
            rewindVideo(slide.video);
        });

        if (slide.video && slide.video.hasLoaded) {
            playVideo(slide.video);
        }
    }

    function playVideo(video) {
        video.play();
    }

    function pauseVideo(video) {
        video.pause();
    }

    function rewindVideo(video) {
        video.currentTime = 0;
    }

    function endSlider() {
        state.currentSlide = null;

        $(ui.slides).add(ui.slideButtons).removeClass('is-active');

        // scene.removePin(true);
    }

    return {
        init: init,
        ui: ui,
        scene: scene
    }
})(window, jQuery);

pSlider.init();