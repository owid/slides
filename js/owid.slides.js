(function() {
    'use strict';

    var owid = {};

    owid.slides = function() {
        function slides() { }

        var totalSlides = Reveal.getTotalSlides();

        function initialize() {
            $(window).on('resize', onResize);
            $(document).on('fullscreenchange', onResize);
            Reveal.addEventListener('slidechanged', onSlideChange);

            $('.controls .fullscreen').on('click', function() {
                $("body").toggleFullScreen();
            });

            $('.controls .prev').on('click', function() {
                Reveal.prev();
            });

            $('.controls .next').on('click', function() {
                Reveal.next();
            });

            $('section > figure').closest('section').addClass('annotated');

            $('section > aside').each(function() {
                // Give the aside elements an inner container
                $(this).html("<div>" + $(this).html() + "</div>");
            });

            $('#title-slide h1').click(function() {
                Reveal.next();
            });

            Reveal.addEventListener('fragmentshown', function(ev) {
                if ($('html').hasClass('fullscreen') && $(ev.fragment).closest('figcaption').length)
                    Reveal.next();
            });

            Reveal.addEventListener('fragmenthidden', function(ev) {
                if ($('html').hasClass('fullscreen') && $(ev.fragment).closest('figcaption').length)
                    Reveal.prev();
            });

            onResize();
            iframeTweaks();
        }

        function onResize() {
            if ($(window).width() >= $(window).height()) {
                $('html').addClass('landscape').removeClass('portrait');                
            } else {
                $('html').addClass('portrait').removeClass('landscape');
            }

            if ($(window).width() < $(window).height() || $('html').hasClass('mobile')) {
                $('html').addClass('slidey');
            } else {
                $('html').removeClass('slidey');
            }

            if ($(document).fullScreen()) 
                $('html').addClass('fullscreen');
            else
                $('html').removeClass('fullscreen');
            
            $('.slides').css('width', (100*(totalSlides+1)) + '%');

            onSlideChange();
        }

        function getTransition(prevSlideIndex, slideIndex) {
            if (prevSlideIndex > slideIndex) {
                var tmp = slideIndex;
                slideIndex = prevSlideIndex;
                prevSlideIndex = tmp;
            }

            var prevSlide = Reveal.getSlide(prevSlideIndex),
                slide = Reveal.getSlide(slideIndex),
                defaultTransition = Reveal.getConfig().transition,
                prevSlideTransition = $(prevSlide).attr('data-transition'),
                slideTransition = $(slide).attr('data-transition');

            if (prevSlideTransition && prevSlideTransition.indexOf('-in') == -1)
                return prevSlideTransition;
            else if (slideTransition && slideTransition.indexOf('-out') == -1)
                return slideTransition;
            else
                return defaultTransition;
        }

        var onTransitionEnd;
        $('.slides').on("webkitTransitionEnd.done oTransitionEnd.done otransitionend.done transitionend.done msTransitionEnd.done", function(ev) {
            $('.slides').data('transitioning', false);      
            if (onTransitionEnd) {
                onTransitionEnd();
                onTransitionEnd = false;
            }
        });                 

        function onSlideChange(event) {
            var slideIndex = Reveal.getIndices().h,
                slide = Reveal.getSlide(slideIndex),
                previousSlide = event && event.previousSlide,
                previousSlideIndex = previousSlide ? $(previousSlide).index() : 0,
                width = $(window).width(),
                $slides = $('.slides'),
                transition = getTransition(previousSlideIndex, slideIndex),
                transform = 'translate(-' + (width*slideIndex) + 'px,0)';

            /*if (!$('html').hasClass('mobile') && transition == 'slide') {
                if ($(slide).attr('data-transition') != 'slide' && (!previousSlide || $(previousSlide).attr('data-transition') != 'slide'))
                    transition = 'none';
            }*/

            if (transition != 'slide') {
                if ($slides.data('transitioning')) {
                    // MISPY: We make non-slide transitions wait for slide transitions to finish
                    // to avoid the feeling of slides jumping all over the places
                    onTransitionEnd = function() {
                        $slides.css('transition', 'none');
                        transformElement($slides.get(0), transform);
                    };
                } else {
                    $slides.css('transition', 'none');                  
                    transformElement($slides.get(0), transform);
                }
            } else {
                onTransitionEnd = null;
                $slides.css('transition', '');
                $slides.data('transitioning', true);
                transformElement($slides.get(0), transform);                
            }

            if ($(slide).hasClass('dark'))
                $('html').addClass('dark');
            else
                $('html').removeClass('dark');

            $('.progress-counter').text(slideIndex+1 + ' of ' + totalSlides);   
        }

        function transformElement(element, transform) {
            element.style.WebkitTransform = transform;
            element.style.MozTransform = transform;
            element.style.msTransform = transform;
            element.style.transform = transform;
        }
    
        function iframeTweaks() {
            // MISPY HACK: Pass touch events through from grapher iframes
            // to allow unimpeded swipe gesture navigation
            $(window).on('message', function(ev) {
                var msg = ev.originalEvent.data;
                if (msg.event == 'touchstart')
                    Reveal.onTouchStart(msg);
                else if (msg.event == 'touchmove')
                    Reveal.onTouchMove($.extend(msg, { preventDefault: function() { } }));
                else if (msg.event == 'touchend')
                    Reveal.onTouchEnd(msg);
            });         

            // MISPY HACK: Prevent iframes from stealing keypresses
            // ... but still allow typing in the grapher chosen select field
            setInterval(function() {
                if ($(document.activeElement).is("iframe")) {
                    try {
                        var $el = $($(Reveal.getCurrentSlide()).find("iframe").get(0).contentDocument.activeElement);
                        if ($el.is(":focus") && $el.closest(".chosen-container").hasClass("chosen-with-drop"))
                            return; // allow input to the Add Country search field
                    } catch (e) { }

                    $("iframe").blur();
                    $(window).focus();
                }
            }, 500);
        }

        initialize();
        return slides;
    };

    window.slides = owid.slides();
})();
