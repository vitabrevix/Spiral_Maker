class AnimationManager {
    static timeouts = {};
    
    static scheduleRestart(delay = 1000) {
        // isRunning is a script-level variable (declared with let), not a window property
        if (typeof isRunning === 'undefined' || !isRunning) return;
        
        clearTimeout(this.timeouts.main);
        this.timeouts.main = setTimeout(() => {
            if (typeof restartAnimationIfRunning === 'function') {
                restartAnimationIfRunning();
            }
        }, delay);
    }
    
    static scheduleImageRestart() {
        this.scheduleRestart(300);
    }
    
    static scheduleTextRestart() {
        this.scheduleRestart(300);
    }
}