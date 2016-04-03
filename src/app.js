var pSlider = (function(window, undefined) {
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

        setZindexes();
        // initVideos();
        initLocalVideos();
        buildSlideAnchors();
        updateActiveSlide(ui.slides[0]);
    }

    function setZindexes() {
        $.each(ui.slides, function(i, slide) {
            $(slide).css('z-index', ui.slideCount - i);
        });

        $(ui.sliderNav).add(ui.skipSlides).css('z-index', ui.slideCount + 1);
    }

    function initVideos() {
        $.each(ui.slides, function(i, slide) {
            var videoId = $(slide).data('video');

            if (videoId) {
                $(slide).YTPlayer({
                    videoId: videoId,
                    // pauseOnScroll: true,
                    // repeat: false,
                    playerVars: {
                        modestBranding: 1,
                        rel: 0
                    },
                    callback: function() {
                        slide.player = $(slide).data('ytPlayer').player;

                        slide.player.addEventListener('onStateChange', function(event) {
                            console.log("Player State Change", event);
                            if (!event.data) {
                                // var currentIndex = $(state.currentSlide).index();
                                // var newPos = ($(window).height() / ui.slideCount) * (currentIndex + 1);
                                // controller.scrollTo(newPos);
                            }
                        });
                    }
                });
            }
        });        
    }

    function initLocalVideos() {
        $.each(ui.slides, function(i, slide) {
            var videoUri = $(slide).data('video');

            if (videoUri) {
                $(slide).vide({
                    mp4: videoUri,
                    webm: '',
                    ogv: '',
                    poster: ''
                }, {
                    posterType: '',
                    loop: false,
                    autoplay: false,
                    className: 'p-slider__video'
                });

                slide.video = $(slide).data('vide').getVideoObject();

                bindVideoEvents(slide.video);
            }
        });
    }

    function bindVideoEvents(video) {
        $(video).on('canplay', function(e) {
            video.hasLoaded = true;

            $(video).parent().addClass('has-loaded');
        })
        .on('error', function(e) {
            console.log('error');
            video.load();
        });

    }

    function buildSlideAnchors() {
        $.each(ui.slides, function(i) {
            var listItem = $('<li class="p-slider-nav__item"><button class="p-slider-nav__button">' + i + '</button></li>');

            ui.sliderNav.append(listItem);
        });

        ui.slideButtons = $(ui.sliderNav).find('.p-slider-nav__item');
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
            wipeAnimation
                .add(TweenMax.to(slide, 2000, {y: '0'}))
                .add(TweenMax.fromTo(slide, 5000, {y: '0'}, {
                    y: '-100%',
                    onComplete: function() {
                        updateActiveSlide(ui.slides[i + 1]); // activate next slide
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
        scene.on('progress.SnapScroll', snapScroll);

        scene.on('end', endSlider);

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
        var newPos;

        if (direction === 'FORWARD') {
            console.log('forward');
            // newPos = ($(window).height() / ui.slideCount) * (currentIndex + 1);
            // controller.scrollTo(newPos);
        } else if (direction === 'REVERSE') {
            console.log('reverse');
            // newPos = ($(window).height() / ui.slideCount) * (currentIndex - 1);
            // controller.scrollTo(newPos);
        }
    }

    function updateActiveSlide(slide) {
        var slideIndex = $(slide).index();

        state.currentSlide = slide;

        $(ui.slides).add(ui.slideButtons).removeClass('is-active');
        $(state.currentSlide).add(ui.slideButtons[slideIndex]).addClass('is-active');

        console.log(slide.video && slide.video.hasLoaded);

        if (slide.video && slide.video.hasLoaded) {
            console.log('play video');
            playVideo(slide.video);
        }
    }

    function playVideo(video) {
        video.currentTime = 0;
        video.play();
    }

    function endSlider() {
        state.currentSlide = null;

        $(ui.slides).add(ui.slideButtons).removeClass('is-active');

        TweenMax.to(ui.skipSlides, '.5', {bottom: - ui.skipSlides.outerHeight()});
    }

    return {
        init: init,
        ui: ui
    }
})(window);

pSlider.init();