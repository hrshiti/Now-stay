import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let activeLenis = null;

const shouldDisableSmoothScroll = () => {
    if (typeof window === 'undefined') return true;

    const ua = window.navigator.userAgent || '';
    const isTouchDevice = 'ontouchstart' in window || window.navigator.maxTouchPoints > 0;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isEmbeddedWebView =
        ua.includes('FlutterWebView') ||
        window.flutter_inappwebview !== undefined ||
        window.flutter !== undefined;

    return isTouchDevice || isIOS || isEmbeddedWebView;
};

export const useLenis = (disabled = false) => {
    useEffect(() => {
        if (disabled || shouldDisableSmoothScroll()) return;

        if (activeLenis) {
            window.lenis = activeLenis;
            return;
        }

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
            lerp: 0.08,
            touchMultiplier: 2,
        });

        lenis.on('scroll', ScrollTrigger.update);

        const update = (time) => {
            lenis.raf(time * 1000);
        };

        gsap.ticker.add(update);
        gsap.ticker.lagSmoothing(0);
        ScrollTrigger.config({ ignoreMobileResize: true });

        window.lenis = lenis;
        activeLenis = lenis;

        return () => {
            if (lenis) {
                lenis.destroy();
                gsap.ticker.remove(update);
            }
            window.lenis = null;
            activeLenis = null;
        };
    }, [disabled]);
};
