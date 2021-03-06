/* FPS Tutorial: http://codetheory.in/controlling-the-frame-rate-with-requestanimationframe/
 * 
 * Example:
 * rloop = new RenderLoop(function(dt){
 *    console.log(`${rloop.fps} ${dt}`);
 * },10).start();
 */

class RenderLoop {
    constructor(callback, fps) {
        let oThis = this;
        this.msLastFrame = null; // The time on Miliseconds of the last frame.
        this.callback = callback; // What function to call for each frame.
        this.isActive = false; // Control the on/off state of the render loop.
        this.fps = 0; // Save the value of how fast the loop is going.

        if (!fps && fps > 0) { // Build a run method that limits the framerate
            this.msFpsLimit = 1000; // Calculate how many milliseconds per frame in one second of time.

            this.run = () => {
                // Calculate the Deltatime between frames and the FPS currently.
                let msCurrent = performance.now();
                let msDelta = (msCurrent - this.msLastFrame);
                let deltaTime = msDelta / 1000.0; // What fraction of a single second is the delta time

                if (msDelta >= this.msFpsLimit) { // Now execute frame since the time has elapsed.
                    this.fps = Math.floor(1 / deltaTime);
                    this.msLastFrame = msCurrent;
                    this.callback(deltaTime);
                }

                if (this.isActive) {
                    window.requestAnimationFrame(this.run);
                }
            };
        } else { // Else build a run method thats optimised as much as possible.
            this.run = () => {
                // Calculate the Deltatime between frames and the FPS currently.
                let msCurrent = performance.now(); // Gives the whole number of how many milliseconds since the dawn of time!
                let deltaTime = (msCurrent - this.msLastFrame) / 1000.0; // ms between frames,  Then / by 1 second to get the fraction of a second.

                // Now execute frame since the time has elapsed.
                this.fps = Math.floor(1 / deltaTime); // Time it took to generate one frame, divide 1 by that to get how many frames in one second.
                this.msLastFrame = msCurrent;

                this.callback(deltaTime);
                if (this.isActive) {
                    window.requestAnimationFrame(this.run);
                }
            }
        }
    }

    start() {
        this.isActive = true;
        this.msLastFrame = performance.now();
        window.requestAnimationFrame(this.run);
        return this;
    }

    stop() {
        this.isActive = false;
    }
}