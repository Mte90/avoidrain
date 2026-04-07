export class InputManager {
  constructor() {
    this.direction = { x: 0, y: 0 };
    this.actionPressed = false;
    this.lastDirectionChange = 0;
    this.debounceCooldown = 50;

    // Keyboard state
    this.keys = {
      left: false,
      right: false,
      action: false
    };

    // Touch state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;

    // Event handlers
    this.keyDownHandler = this.keyDownHandler.bind(this);
    this.keyUpHandler = this.keyUpHandler.bind(this);
    this.touchStartHandler = this.touchStartHandler.bind(this);
    this.touchEndHandler = this.touchEndHandler.bind(this);
    this.pointerDownHandler = this.pointerDownHandler.bind(this);
    this.pointerUpHandler = this.pointerUpHandler.bind(this);

    // Bind handlers
    this.bindEvents();
  }

  bindEvents() {
    // Keyboard events
    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);

    // Touch events
    document.addEventListener('touchstart', this.touchStartHandler, { passive: false });
    document.addEventListener('touchend', this.touchEndHandler, { passive: false });

    // Pointer events (fallback for mouse and touch)
    document.addEventListener('pointerdown', this.pointerDownHandler);
    document.addEventListener('pointerup', this.pointerUpHandler);
  }

  unbindEvents() {
    // Keyboard events
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);

    // Touch events
    document.removeEventListener('touchstart', this.touchStartHandler);
    document.removeEventListener('touchend', this.touchEndHandler);

    // Pointer events
    document.removeEventListener('pointerdown', this.pointerDownHandler);
    document.removeEventListener('pointerup', this.pointerUpHandler);
  }

  keyDownHandler(e) {
    const now = performance.now();

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (!this.keys.left) {
          this.keys.left = true;
          this.lastDirectionChange = now;
        }
        this.updateDirection();
        break;

      case 'ArrowRight':
      case 'd':
      case 'D':
        if (!this.keys.right) {
          this.keys.right = true;
          this.lastDirectionChange = now;
        }
        this.updateDirection();
        break;

      case 'Enter':
      case ' ':
      case 'Space':
        if (!this.keys.action) {
          this.keys.action = true;
          this.actionPressed = true;
        }
        break;
    }
  }

  keyUpHandler(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.keys.left = false;
        this.updateDirection();
        break;

      case 'ArrowRight':
      case 'd':
      case 'D':
        this.keys.right = false;
        this.updateDirection();
        break;

      case 'Enter':
      case ' ':
      case 'Space':
        this.keys.action = false;
        this.actionPressed = false;
        break;
    }
  }

  touchStartHandler(e) {
    if (e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  }

  touchEndHandler(e) {
    if (e.changedTouches.length > 0) {
      this.touchEndX = e.changedTouches[0].clientX;
      this.touchEndY = e.changedTouches[0].clientY;
      this.handleSwipe();
    }
  }

  pointerDownHandler(e) {
    if (e.pointerType === 'touch' || e.pointerType === 'mouse') {
      this.touchStartX = e.clientX;
      this.touchStartY = e.clientY;
    }
  }

  pointerUpHandler(e) {
    if (e.pointerType === 'touch' || e.pointerType === 'mouse') {
      this.touchEndX = e.clientX;
      this.touchEndY = e.clientY;
      this.handleSwipe();
    }
  }

  handleSwipe() {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Horizontal swipe detection (must be > vertical movement)
    if (absDeltaX > absDeltaY * 2 && absDeltaX > 30) {
      const now = performance.now();

      if (deltaX > 0) {
        // Swipe right
        this.keys.right = true;
        this.lastDirectionChange = now;
        this.updateDirection();
      } else {
        // Swipe left
        this.keys.left = true;
        this.lastDirectionChange = now;
        this.updateDirection();
      }

      // Reset after swipe
      setTimeout(() => {
        if (deltaX > 0) {
          this.keys.right = false;
        } else {
          this.keys.left = false;
        }
        this.updateDirection();
      }, 150);
    }
  }

  updateDirection() {
    if (this.keys.left && !this.keys.right) {
      this.direction.x = -1;
      this.direction.y = 0;
    } else if (this.keys.right && !this.keys.left) {
      this.direction.x = 1;
      this.direction.y = 0;
    } else {
      this.direction.x = 0;
      this.direction.y = 0;
    }
  }

  getDirection() {
    return this.direction;
  }

  isActionPressed() {
    return this.actionPressed;
  }

  dispose() {
    this.unbindEvents();
    this.keys = {};
    this.direction = { x: 0, y: 0 };
    this.actionPressed = false;
  }
}
