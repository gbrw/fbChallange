// مؤقت اللعبة

class GameTimer {
    constructor(duration, onTick, onTimeout) {
        this.duration = duration;
        this.remaining = duration;
        this.onTick = onTick;
        this.onTimeout = onTimeout;
        this.timerId = null;
        this.startTime = null;
        this.isPaused = false;
    }
    
    start() {
        if (this.timerId !== null) return;
        
        this.isPaused = false;
        this.startTime = Date.now();
        
        this.timerId = setInterval(() => {
            if (this.isPaused) return;
            
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.remaining = Math.max(0, this.duration - elapsed);
            
            if (typeof this.onTick === 'function') {
                this.onTick(this.remaining);
            }
            
            if (this.remaining <= 0) {
                this.stop();
                if (typeof this.onTimeout === 'function') {
                    this.onTimeout();
                }
            }
        }, 100);
    }
    
    stop() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            this.startTime = Date.now() - ((this.duration - this.remaining) * 1000);
        }
    }
    
    reset(newDuration = null) {
        this.stop();
        this.duration = newDuration !== null ? newDuration : this.duration;
        this.remaining = this.duration;
        if (typeof this.onTick === 'function') {
            this.onTick(this.remaining);
        }
    }
}