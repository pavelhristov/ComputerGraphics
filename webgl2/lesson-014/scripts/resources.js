// Resources.setup(gl, onReady).loadTexture('tex001',url).start();
class Resources {
    // Setup resource object
    static setup(gl, completeHandler) {
        Resources.gl = gl;
        Resources.onComplete = completeHandler;

        return this;
    }

    // Start the download queue
    static start() {
        if (Resources.Queue.length > 0) {
            Resources.loadNextItem();
        }
    }

    //--------------------------------------------------
    // Loading
    static loadTexture(name, src) {
        for (let i = 0; i < arguments.length; i += 2) {
            Resources.Queue.push({
                type: 'img',
                name: arguments[i],
                src: arguments[i + 1]
            });
        }

        return this;
    }

    //--------------------------------------------------
    // Manage Queue
    static loadNextItem() {
        if (Resources.Queue.length === 0) {
            if (Resources.onComplete() != null) {
                Resources.onComplete();
            } else {
                console.log('Resources downloaded, queue complete!')
            }

            return;
        }

        let item = Resources.Queue.pop();
        switch (item.type) {
            case 'img':
                let image = new Image();
                image.queueData = item;
                image.onload = Resources.onDownloadSuccess;
                image.onabort = image.onerror = Resources.onDownloadError;
                image.src = item.src
                break;
            default:
                break;
        }
    }

    //-------------------------------------------------------------------
    // Event Handlers
    static onDownloadSuccess() {
        // Its an image, lets load it up as a texture in gl.
        if (this instanceof Image) {
            let data = this.queueData;
            Resources.gl.fLoadTexture(data.name, this);
        }

        Resources.loadNextItem();
    }

    static onDownloadError() {
        console.log(`Error getting ${this}`);
        Resources.loadNextItem();
    }
}

Resources.Queue = [];
Resources.onComplete = null;
Resources.gl = null;