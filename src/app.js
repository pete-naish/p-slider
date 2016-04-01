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
        slideButtons: null,
        videoCount: 0
    };

    var state = {
        currentSlide: null,
        playableVideos: 0
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
            var poster = $(slide).data('poster');

            if (videoUri) {
                ui.videoCount++;

                $(slide).vide({
                    mp4: videoUri,
                    webm: '',
                    ogv: '',
                    poster: poster
                }, {
                    posterType: 'jpg',
                      loop: false,
                      autoplay: false,
                      className: 'p-slider__video' // Add custom CSS class to Vide div
                });

                slide.video = $(slide).data('vide').getVideoObject();

                bindVideoEvents(slide.video);

            } else if (poster) {
                $(slide).css('background-image', 'url(' + poster + ')');
            }
        });
    }

    function bindVideoEvents(video) {
        $(video).on('canplay', function(e) {
            state.playableVideos++;

            if (state.playableVideos === ui.videoCount) { // if all videos have loaded 
                $('body').removeClass('p-slider-loading');
                $(video).parent().addClass('has-loaded');
            }
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
                    onStart: function() {
                        updateActiveSlide(slide);
                    },
                    onComplete: function() {
                        console.log('slide complete', i);
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
        // scene.on('progress.SnapScroll', function (event) {
        //     var progress = event.progress.toFixed(2);
        //     var direction = controller.info('scrollDirection');
        //     var slide1 = progress > 0.15 && progress < 0.33;
        //     var slide2 = progress > 0.48 && progress < 0.66;
        //     var newPos;

        //     if (direction === 'FORWARD') {
        //         if (slide1) { // first slide
        //             newPos = ($(window).height() / ui.slideCount) * 1;
        //             controller.scrollTo(newPos);
        //         } else if (slide2) {
        //             newPos = ($(window).height() / ui.slideCount) * 2;
        //             controller.scrollTo(newPos);
        //         }
        //     } else if (direction === 'REVERSE') {
                
        //     }
        // });

        // scene.on('progress.enableSnapScroll', function() {
        //     scene.on('progress.SnapScroll'); 
        // });

        scene.on('progress.SnapScroll', function() {
            var direction = controller.info('scrollDirection');
            var currentIndex = $(state.currentSlide).index();
            var newPos;

            if (direction === 'FORWARD') {
                // newPos = ($(window).height() / ui.slideCount) * (currentIndex + 1);
                // controller.scrollTo(newPos);
            } else if (direction === 'REVERSE') {
                // newPos = ($(window).height() / ui.slideCount) * (currentIndex - 1);
                // controller.scrollTo(newPos);
            }
        });

        scene.on('end', endSlider);

        ui.skipSlides.on('click.skipSlides', function(e) {
            var target = $($(this).attr('href'));

            e.preventDefault();

            scene.off('progress.SnapScroll');

            $('html, body').animate({
                scrollTop: target.offset().top
            }, 2000);
        });

        ui.slideButtons.on('click.navigateToSlide', '.p-slider-nav__button', function(e) {
            var slideNum = $(this).text();
            var newPos = ($(window).height() / ui.slideCount) * slideNum;

            e.preventDefault();

            scene.off('progress.SnapScroll');
            controller.scrollTo(newPos);
        });
    }

    function updateActiveSlide(slide) {
        var slideIndex;

        state.currentSlide = slide;
        slideIndex = $(state.currentSlide).index();

        $(ui.slides).add(ui.slideButtons).removeClass('is-active');
        $(state.currentSlide).add(ui.slideButtons[slideIndex]).addClass('is-active');

        if (state.playableVideos === ui.videoCount && slide.video) {
            // slide.video.currentTime = 0;
            console.log(slide.video.currentTime);
            slide.video.play();
        }
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