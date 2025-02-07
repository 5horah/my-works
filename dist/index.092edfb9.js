/**
 * 360도 제품 뷰어 라이브러리
 * 마우스 드래그나 터치 스와이프로 제품을 360도 회전하여 볼 수 있는 기능 제공
 *
 * @example
 * // 수동 초기화
 * ViewerManager.initialize()
 *
 * // 리소스 정리
 * ViewerManager.cleanup();
 *
 */ const ViewerManager = function() {
    const imageCache = new Map();
    let activeViewers = new Map();
    async function loadImage(url) {
        if (imageCache.has(url)) return imageCache.get(url);
        const img = await new Promise((resolve, reject)=>{
            const image = new Image();
            image.onload = ()=>resolve(image);
            image.onerror = reject;
            image.src = url;
        });
        imageCache.set(url, img);
        return img;
    }
    class Viewer360 {
        constructor(target){
            this.target = target;
            this.images = [];
            this.currentFrame = 0;
            this.previousSection = 0;
            this.isDragging = false;
            this.dragStartX = 0;
            this.config = {
                numFrames: parseInt(target.dataset.viewerNum || "0"),
                numPadding: parseInt(target.dataset.viewerNumPad || "0"),
                baseImageUrl: target.dataset.viewerImage || "",
                imageExtension: target.dataset.viewerImageExtension || "",
                backgroundColor: getComputedStyle(target).getPropertyValue("--viewer-background").trim() || "#ffffff"
            };
            this.canvas = document.createElement("canvas");
            this.ctx = this.canvas.getContext("2d", {
                alpha: false
            });
            this.resizeHandler = this.setupResizeHandler();
            this.hasButtons = target.hasAttribute("data-viewer-button");
            this.autoRotateInterval = null;
            this.init();
        }
        async init() {
            this.target.innerHTML = "";
            this.target.appendChild(this.canvas);
            this.setupCanvas();
            await this.loadImages();
            if (this.hasButtons && !this.target.querySelector(".viewer-control-wrapper")) {
                const wrapper = document.createElement("div");
                wrapper.classList.add("viewer-control-wrapper");
                this.target.appendChild(wrapper);
                this.addControlButtons(wrapper);
            }
            this.bindEvents();
            this.bindControlEvents();
        }
        addControlButtons(wrapper) {
            if (wrapper.querySelector(".viewer-control")) return;
            const createButton = (className, innerHTML)=>{
                const button = document.createElement("button");
                button.className = `viewer-control ${className}`;
                button.innerHTML = innerHTML;
                return button;
            };
            const leftButton = createButton("viewer-control--prev", "\u2190");
            wrapper.appendChild(leftButton);
            const rightButton = createButton("viewer-control--next", "\u2192");
            wrapper.appendChild(rightButton);
        }
        bindControlEvents() {
            const leftButton = this.target.querySelector(".viewer-control--prev");
            const rightButton = this.target.querySelector(".viewer-control--next");
            let rotationInterval = null;
            const rotationDelay = 100;
            const startRotation = (direction)=>{
                if (rotationInterval) return;
                if (this.images.length > 0) {
                    this.rotate(direction);
                    rotationInterval = setInterval(()=>{
                        this.rotate(direction);
                    }, rotationDelay);
                }
            };
            const stopRotation = ()=>{
                if (rotationInterval) {
                    clearInterval(rotationInterval);
                    rotationInterval = null;
                }
            };
            if (leftButton) {
                leftButton.addEventListener("mousedown", ()=>startRotation("left"));
                leftButton.addEventListener("mouseup", stopRotation);
                leftButton.addEventListener("mouseleave", stopRotation);
                leftButton.addEventListener("touchstart", (e)=>{
                    e.preventDefault();
                    startRotation("left");
                });
                leftButton.addEventListener("touchend", stopRotation);
            }
            if (rightButton) {
                rightButton.addEventListener("mousedown", ()=>startRotation("right"));
                rightButton.addEventListener("mouseup", stopRotation);
                rightButton.addEventListener("mouseleave", stopRotation);
                rightButton.addEventListener("touchstart", (e)=>{
                    e.preventDefault();
                    startRotation("right");
                });
                rightButton.addEventListener("touchend", stopRotation);
            }
        }
        setupCanvas() {
            const rect = this.target.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.ctx.imageSmoothingEnabled = true;
            this.renderFrame();
        }
        async loadImages() {
            const loadingDiv = this.createLoadingUI();
            try {
                await Promise.all(Array.from({
                    length: this.config.numFrames
                }, (_, i)=>this.loadSingleImage(i, loadingDiv)));
                loadingDiv.remove();
                this.target.classList.add("viewer-loaded");
                this.renderFrame();
            } catch (error) {
                console.error("Failed to load images:", error);
            }
        }
        async loadSingleImage(index, loadingDiv) {
            const url = `${this.config.baseImageUrl}${String(index + 1).padStart(this.config.numPadding, "0")}.${this.config.imageExtension}`;
            const img = await loadImage(url);
            this.images[index] = img;
            if (loadingDiv) loadingDiv.textContent = `Loading... ${Math.round((index + 1) / this.config.numFrames * 100)}%`;
            return img;
        }
        createLoadingUI() {
            const div = document.createElement("div");
            div.className = "viewer-loading";
            div.textContent = "Loading images...";
            this.target.appendChild(div);
            return div;
        }
        renderFrame() {
            if (!this.images[this.currentFrame]) return;
            const img = this.images[this.currentFrame];
            const { canvas, ctx } = this;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = this.config.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
        rotate(direction) {
            if (!this.images.length || !this.config.numFrames) return;
            const totalFrames = this.config.numFrames;
            if (direction === "left") this.currentFrame = this.currentFrame === 0 ? totalFrames - 1 : this.currentFrame - 1;
            else this.currentFrame = (this.currentFrame + 1) % totalFrames;
            this.previousSection = this.currentFrame;
            this.renderFrame();
        }
        updateFrame(moveDistance) {
            const sectionWidth = this.canvas.width / this.config.numFrames;
            const tempSection = Math.floor(Math.abs(moveDistance) / sectionWidth);
            const currentSection = moveDistance < 0 ? ((this.previousSection + tempSection) % this.config.numFrames + this.config.numFrames) % this.config.numFrames : ((this.previousSection - tempSection) % this.config.numFrames + this.config.numFrames) % this.config.numFrames;
            if (this.currentFrame !== currentSection) {
                this.currentFrame = currentSection;
                this.renderFrame();
            }
        }
        handleDragStart = (e)=>{
            this.isDragging = true;
            this.dragStartX = e.clientX;
        };
        handleTouchStart = (e)=>{
            this.isDragging = true;
            this.dragStartX = e.touches[0].clientX;
            this.dragStartY = e.touches[0].clientY;
            this.isScrolling = undefined;
        };
        handleDragMove = (e)=>{
            if (!this.isDragging) return;
            this.updateFrame(e.clientX - this.dragStartX);
        };
        handleTouchMove = (e)=>{
            if (!this.isDragging) return;
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - this.dragStartX;
            const deltaY = touchY - this.dragStartY;
            if (typeof this.isScrolling === "undefined") this.isScrolling = Math.abs(deltaY) > Math.abs(deltaX);
            if (this.isScrolling) return;
            else {
                e.preventDefault();
                e.stopPropagation();
                this.updateFrame(deltaX);
            }
        };
        handleDragEnd = ()=>{
            if (!this.isDragging) return;
            this.isDragging = false;
            this.previousSection = this.currentFrame;
        };
        bindEvents() {
            this.canvas.addEventListener("mousedown", this.handleDragStart);
            this.canvas.addEventListener("touchstart", this.handleTouchStart);
            window.addEventListener("mousemove", this.handleDragMove);
            window.addEventListener("touchmove", this.handleTouchMove);
            window.addEventListener("mouseup", this.handleDragEnd);
            window.addEventListener("touchend", this.handleDragEnd);
            window.addEventListener("mouseleave", this.handleDragEnd);
        }
        setupResizeHandler() {
            let resizeTimer;
            const handler = ()=>{
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(()=>this.setupCanvas(), 150);
            };
            window.addEventListener("resize", handler);
            return handler;
        }
        destroy() {
            this.canvas.removeEventListener("mousedown", this.handleDragStart);
            this.canvas.removeEventListener("touchstart", this.handleTouchStart);
            window.removeEventListener("mousemove", this.handleDragMove);
            window.removeEventListener("touchmove", this.handleTouchMove);
            window.removeEventListener("mouseup", this.handleDragEnd);
            window.removeEventListener("touchend", this.handleDragEnd);
            window.removeEventListener("mouseleave", this.handleDragEnd);
            window.removeEventListener("resize", this.resizeHandler);
            if (this.hasButtons) {
                const leftButton = this.target.querySelector(".viewer-control--prev");
                const rightButton = this.target.querySelector(".viewer-control--next");
                if (leftButton) leftButton.remove();
                if (rightButton) rightButton.remove();
            }
        }
    }
    class TabComponent {
        constructor(container){
            this.container = container;
            this.events = new Map();
            this.contentWrap = container.querySelector("[data-tab-content-wrap]");
            this.buttons = container.querySelectorAll("[data-tab-button]");
            this.contents = container.querySelectorAll("[data-tab-content]");
            this.containerId = container.id || `tab-container-${Math.random().toString(36).substr(2, 9)}`;
            this.init();
        }
        init() {
            this.setupAccessibility();
            this.updateTab(this.container.getAttribute("data-active-tab") || "0");
            this.bindEvents();
            this.setupContentWrapCSS();
        }
        setupContentWrapCSS() {
            if (this.contentWrap && this.contents.length > 0) {
                const maxHeight = Array.from(this.contents).reduce((max, content)=>{
                    return Math.max(max, content.offsetHeight);
                }, 0);
                this.contentWrap.style.setProperty("--canvas-height", `${maxHeight}px`);
                window.addEventListener("resize", ()=>{
                    const newMaxHeight = Array.from(this.contents).reduce((max, content)=>{
                        return Math.max(max, content.offsetHeight);
                    }, 0);
                    this.contentWrap.style.setProperty("--canvas-height", `${newMaxHeight}px`);
                });
            }
        }
        setupAccessibility() {
            this.container.setAttribute("role", "tablist");
            this.buttons.forEach((button)=>{
                button.setAttribute("role", "tab");
                button.setAttribute("aria-selected", "false");
            });
            this.contents.forEach((content)=>{
                content.setAttribute("role", "tabpanel");
            });
        }
        updateTab(selectedId) {
            this.buttons.forEach((button)=>{
                const isActive = button.getAttribute("data-tab-button") === selectedId;
                button.setAttribute("aria-selected", String(isActive));
                button.setAttribute("data-active", String(isActive));
            });
            this.contents.forEach((content)=>{
                const isActive = content.getAttribute("data-tab-content") === selectedId;
                content.setAttribute("data-active", String(isActive));
            });
            this.container.setAttribute("data-active-tab", selectedId);
            this.reinitializeViewers();
        }
        reinitializeViewers() {
            const containerViewers = activeViewers.get(this.containerId) || [];
            containerViewers.forEach((viewer)=>viewer.destroy());
            const newViewers = Array.from(this.container.querySelectorAll("[data-product-viewer]")).map((element)=>new Viewer360(element));
            activeViewers.set(this.containerId, newViewers);
        }
        bindEvents() {
            this.buttons.forEach((button)=>{
                const handler = ()=>{
                    const index = button.getAttribute("data-tab-button");
                    this.updateTab(index);
                    if (button.id) history.replaceState(null, "", `#${button.id}`);
                };
                button.addEventListener("click", handler);
                this.events.set(button, handler);
            });
        }
        destroy() {
            this.events.forEach((handler, element)=>{
                element.removeEventListener("click", handler);
            });
            this.events.clear();
            const containerViewers = activeViewers.get(this.containerId) || [];
            containerViewers.forEach((viewer)=>viewer.destroy());
            activeViewers.delete(this.containerId);
        }
    }
    function initializeViewers() {
        const standaloneViewers = Array.from(document.querySelectorAll(":not([data-tab-container]) > [data-product-viewer]")).map((element)=>new Viewer360(element));
        activeViewers.set("standalone", standaloneViewers);
        return standaloneViewers;
    }
    function initializeTabs() {
        return Array.from(document.querySelectorAll("[data-tab-container]")).map((element)=>new TabComponent(element));
    }
    function initialize() {
        initializeViewers();
        initializeTabs();
    }
    function cleanup() {
        activeViewers.forEach((viewers)=>{
            viewers.forEach((viewer)=>viewer.destroy());
        });
        activeViewers.clear();
    }
    return {
        initialize,
        cleanup
    };
}();
window.ViewerManager = ViewerManager;

//# sourceMappingURL=index.092edfb9.js.map
