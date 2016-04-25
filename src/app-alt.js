var pSlider = (function(window, $, undefined) {
    'use-strict';

    var ui = {
        el: '.p-slider',
        skipSlides: null,
        slides: null,
        slideCount: 0,
        sliderNav: null
    };

    var state = {
        currentSlideIndex: null,
        auto: true,
        timer: undefined,
        timeout: 30000
    };

    function init() {
        initUI();
        initPanelSnap();
        initWaypoints();
        bindEvents();
    }

    function initUI() {
        ui.slides = $(ui.el).find('.p-slider__slide');
        ui.slideCount = ui.slides.length;
        ui.sliderNav = $('<ul class="p-slider-nav">');
        ui.skipSlides = $(ui.el).find('.p-slider__skip-slides');

        $.each(ui.slides, function(i, slide) {
            $(slide).attr('data-panel', i);
            buildSlideButtons(i, slide);
            initVideos(i, slide);
        })
        .promise()
        .done(function() {
            $(ui.el).append(ui.sliderNav);
            
            // fix jquery's inability to render svg
            ui.sliderNav.html(ui.sliderNav.html());
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
                },
                buttons: {
                    $nextButton: $('.p-slider__next-slide')
                },
                wrapAround: true
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
                $(ui.el).toggleClass('on-last-slide', direction === 'down');
            }
        });

        var pageContentWaypoint = new Waypoint({
            element: $('.page-content'),
            offset: '90%',
            handler: function(direction) {
                $(ui.el).toggleClass('has-ended', direction === 'down');

            }
        });

        var headerWaypoint = new Waypoint({
            element: $('.page-content'),
            offset: ui.skipSlides.outerHeight() + $('header').outerHeight(),
            handler: function(direction) {
                $('header').toggleClass('not-fixed', direction === 'down');

                if (direction === 'up') {
                    // console.log($(ui.sliderNav).find('[data-panel="'+ state.currentSlideIndex +'"]'));
                    $(ui.sliderNav).find('[data-panel="'+ state.currentSlideIndex +'"]').trigger('click');
                }
            }
        });

        $.each(ui.slides, function(i, slide) {
            new Waypoint({
                element: slide,
                offset: '50%',
                handler: function(direction) {
                    $(slide).addClass('active');
                }
            });

            new Waypoint({
                element: slide,
                handler: function(direction) {
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
        })
            .append($('<svg>', {
                class: 'p-slider-nav__progress',
                xmlns: 'http://www.w3.org/2000/svg',
                width: 30,
                height: 30,
                viewBox: '0 0 30 30',
                version: '1.1'
            })
                .append($('<circle>', {
                    r: 13.5,
                    cx: 15,
                    cy: 15,
                    fill: 'transparent',
                    'stroke-dasharray': 85,
                    'stroke-dashoffset': 0
                }))
                .append($('<circle>', {
                    class: 'p-slider-nav__progress-bar',
                    r: 13.5,
                    cx: 15,
                    cy: 15,
                    fill: 'transparent',
                    'stroke-dasharray': 85,
                    'stroke-dashoffset': 85
                }))
            )
        )
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
                setAnimationDuration($('.p-slider-nav__button.active'), video.duration);
            }

            // unbind this after first run, as restarting video (in playVideo func)
            // causes the canplaythrough event to be fired every time the slide is viewed
            $(video).off('canplaythrough').parent().addClass('has-loaded');
        })
        .on('ended', function() {
            if (state.auto) {
                goToNextSlide();
            }
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

        $('.p-slider__button, .p-slider__cta, .p-slider-nav__button').on('click.resetTimer', resetAutoTimer);
        $(window).on('mousewheel.resetTimer', resetAutoTimer);
    }

    function activateAutoTimer() {
        state.timer = setTimeout(function() {
            var currentVideo = ui.slides[state.currentSlideIndex].video;

            state.auto = true;

            if ((currentVideo && currentVideo.ended) || !currentVideo) {
                goToNextSlide();
            }
        }, state.timeout);
    }

    function resetAutoTimer() {
        console.log('called');
        state.auto = false;

        if (state.timer) {
            clearTimeout(state.timer); 
            state.timer = undefined;
        }

        activateAutoTimer();
    }

    function setAnimationDuration($el, val) {
        console.log(val);
        var $circle = $el.find('.p-slider-nav__progress-bar');

        $circle.css({
            'transition-duration': val + 's'
        });
    }

    // function updateSlideProgress(val, $el) {
    //     var $circle = $el.find('.p-slider-nav__progress-bar');
    //     var r = $circle.attr('r');
    //     var c = Math.PI * (r * 2);
    //     var pct;

    //     if (val < 0) {
    //         val = 0;
    //     } else if (val > 100) {
    //         val = 100;
    //     }
        
    //     pct = ((100 - val) / 100) * c;

    //     $circle.css({
    //         'stroke-dashoffset': pct
    //     });
    // }

    function goToNextSlide() {
        if (!$(ui.el).hasClass('has-ended')) {
            $('.p-slider__next-slide').trigger('click');
        }
    }

    function updateActiveSlide(slide) {
        state.currentSlideIndex = $(slide).addClass('has-displayed').index();

        setAnimationDuration($('.p-slider-nav__button'), 0);

        // pause and set each video back to the first frame
        $.each(ui.slides, function(i, slide) {
            if (slide.video) {
                slide.video.pause();
                slide.video.currentTime = 0;
            }
        });

        if (slide.video && slide.video.hasLoaded) {
            setAnimationDuration($('.p-slider-nav__button.active'), slide.video.duration);
            slide.video.play();
        }
    }

    return {
        init: init,
        ui: ui
    };

})(window, jQuery);

pSlider.init();