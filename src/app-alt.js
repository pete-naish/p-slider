var pSlider = (function(window, $, undefined) {
    var ui = {
        el: '.p-slider',
        skipSlides: null,
        slides: null,
        slideCount: 0,
        sliderNav: null
    };

    var state = {
        currentSlideIndex: null
    }

    function init() {
        initUI();
        initPanelSnap();
        initWaypoints();
        bindEvents();
    }

    function initUI() {
        ui.slides = $(ui.el).find('.p-slider__slide');
        ui.slideCount = ui.slides.length;
        ui.sliderNav = $(ui.el).find('.p-slider-nav');
        ui.skipSlides = $(ui.el).find('.p-slider__skip-slides');

        $.each(ui.slides, function(i, slide) {
            $(slide).attr('data-panel', i);
            buildSlideButtons(i, slide);
            initVideos(i, slide);
        });
    }

    function initPanelSnap() {
        $('body').panelSnap({
            panelSelector: '.p-slider__slide',
            $menu: ui.sliderNav,
            menuSelector: 'button',
            navigation: {
                keys: {
                    nextKey: 40,
                    prevKey: 38
                }
            },
            onActivate: function(slide) {
                var targetSlideIndex = slide.index();

                if (slide.length && targetSlideIndex !== state.currentSlideIndex) {
                    updateActiveSlide(ui.slides[targetSlideIndex]);
                }
            }
        });
    }

    function initWaypoints() {
        var endSliderWaypoint = new Waypoint({
            element: $('.page-content'),
            offset: '100%',
            handler: function(direction) {
                $(ui.el).toggleClass('has-ended', direction === 'down');
            }
        });

        var headerWaypoint = new Waypoint({
            element: $('.page-content'),
            offset: ui.skipSlides.outerHeight() + $('header').outerHeight(),
            handler: function(direction) {
                $('header').toggleClass('not-fixed', direction === 'down');
            }
        });

        $.each(ui.slides, function(i, slide) {
            new Waypoint({
                element: slide,
                handler: function(direction) {
                    $(slide).addClass('active'); // add active class based on scroll to make James happy
                    // make sure class is removed on first slide
                    $(ui.el).toggleClass('reverse', direction === 'up' && i);
                }
            });
        });
    }

    function buildSlideButtons(i, slide) {
        $('<li>', {
            class: 'p-slider-nav__item'
        })
        .append($('<button>', {
            class: 'p-slider-nav__button',
            text: i,
            'data-panel': i
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
            var playFirstSlide = slide.index() === 0 && slide.addClass('has-displayed').hasClass('active');

            video.hasLoaded = true;

            if (playFirstSlide) {
                video.play();
            }

            // unbind this after first run, as restarting video (in playVideo func)
            // causes the canplaythrough event to be fired every time the slide is viewed
            $(video).off('canplaythrough').parent().addClass('has-loaded');
        })
        .on('error', function(e) {
            video.load();
            video.play();
        });
    }

    function bindEvents() {
        ui.skipSlides.on('click.skipSlides', function(e) {
            var target = $($(this).attr('href'));

            e.preventDefault();

            $('html, body').animate({
                scrollTop: target.offset().top
            }, 750);
        });
    }

    function updateActiveSlide(slide) {
        state.currentSlideIndex = $(slide).addClass('has-displayed').index();

        // pause and set each video back to the first frame
        $.each(ui.slides, function(i, slide) {
            slide.video.pause();
            slide.video.currentTime = 0;
        });

        if (slide.video && slide.video.hasLoaded) {
            slide.video.play();
        }
    }

    return {
        init: init
    }

})(window, jQuery);

pSlider.init();