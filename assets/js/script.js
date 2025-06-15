let horseshoeImg;
let clankSound;
let animationActive = false;
let t = 0;
let startPos, controlPos, endPos;
let targetUrl;
let rotation = 0;
let flightRotation = 0;
let canvas;
let hoveredCard;
let soundPlayed = false;
let navigationCompleted = false;

function preload() {
    try {
        horseshoeImg = loadImage('assets/images/horseshoe.svg',
            () => console.log('Horseshoe image loaded'),
            () => console.error('Failed to load horseshoe image')
        );
        clankSound = loadSound('assets/audio/clank.mp3',
            () => console.log('Clank sound loaded'),
            () => console.error('Failed to load clank sound')
        );
    } catch (e) {
        console.error('Error in preload:', e);
    }
}

function setup() {
    // Create a full-screen canvas
    canvas = createCanvas(window.innerWidth, window.innerHeight);
    canvas.position(0, 0);
    canvas.style('position', 'fixed');
    canvas.style('top', '0');
    canvas.style('left', '0');
    canvas.style('z-index', '1000'); // Ensure canvas is on top
    canvas.style('pointer-events', 'none'); // Explicitly set in JS
    // Set sound volume to 50%
    clankSound.setVolume(0.08);
    noLoop(); // Only draw when animation is active
}

function startAnimation(card, url) {
    if (animationActive) return;
    animationActive = true;

    // Use relative URL directly
    targetUrl = url; // e.g., 'pages/body-parts.html'
    console.log('Raw URL:', url);
    console.log('Resolved URL:', new URL(url, window.location.origin).href); // For debugging
    hoveredCard = card;

    // Apply hover state
    hoveredCard.classList.add('hovered');

    // Get the plain-circle position in global coordinates
    const icon = card.querySelector('.card-icon');
    const iconRect = icon.getBoundingClientRect();

    // Account for scroll offset
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Define start, control, and end points for Bezier curve
    startPos = { x: window.innerWidth / 2, y: window.innerHeight }; // Bottom center
    controlPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }; // Middle for curve
    endPos = {
        x: iconRect.left + iconRect.width / 2 + scrollX,
        y: iconRect.top + iconRect.height / 2 + scrollY
    };

    // Log positions and URL for debugging
    console.log('Card:', card.querySelector('h2').textContent);
    console.log('Start Position:', startPos);
    console.log('Control Position:', controlPos);
    console.log('End Position:', endPos);
    console.log('Target URL:', targetUrl);

    // Reset animation variables
    t = 0;
    flightRotation = 0;
    rotation = 0;
    soundPlayed = false;
    navigationCompleted = false;

    // Fallback to force navigation if animation takes too long
    setTimeout(() => {
        if (animationActive && !navigationCompleted) {
            console.warn('Animation timed out, forcing navigation to:', targetUrl);
            completeNavigation();
        }
    }, 4000); // 4-second timeout to account for rotation

    loop(); // Start the animation loop
}

function completeNavigation() {
    if (navigationCompleted) return;
    navigationCompleted = true;

    // Remove hover class
    if (hoveredCard) {
        hoveredCard.classList.remove('hovered');
    }

    // Clean up animation state
    animationActive = false;
    t = 0;
    flightRotation = 0;
    rotation = 0;
    soundPlayed = false;
    noLoop();
    canvas.style('display', 'none'); // Hide canvas

    // Attempt navigation
    console.log('Attempting navigation to:', targetUrl);
    try {
        if (!targetUrl || targetUrl === '#') {
            console.error('Invalid target URL:', targetUrl);
            return;
        }
        window.location.replace(targetUrl); // Use relative URL
    } catch (e) {
        console.error('Navigation failed:', e);
        try {
            window.location.assign(targetUrl); // Fallback
        } catch (err) {
            console.error('Fallback navigation failed:', err);
        }
    }
}

function draw() {
    if (!animationActive) return;

    clear();
    t += 0.02; // Animation speed

    // Play sound at t >= 0.6-rogress
    if (t >= 0.6 && !soundPlayed) {
        clankSound.play();
        soundPlayed = true;
        console.log('Sound played at t:', t);
    }

    if (t > 1) {
        // Post-impact phase
        if (rotation < TWO_PI) {
            // Smoothly decelerate rotation
            let progress = rotation / TWO_PI; // 0 to 1
            let easing = cos((progress * PI) / 2); // Cosine easing: 1 to 0
            rotation += 0.1 * easing; // Scale increment
            push();
            translate(endPos.x, endPos.y);
            rotate(rotation + 3.93); // Continue from ~225°
            image(horseshoeImg, -17, -18, 40, 40);
            pop();
            console.log('Post-impact rotation (radians):', rotation);
        } else {
            // Rotation complete, draw static horseshoe
            push();
            translate(endPos.x, endPos.y);
            rotate(3.93 + TWO_PI); // Fixed at ~225° + 360°
            image(horseshoeImg, -17, -18, 40, 40);
            pop();

            console.log('Animation complete, rotation:', rotation);
            completeNavigation();
        }
        return;
    }

    // Quadratic Bezier curve
    let x = (1 - t) * (1 - t) * startPos.x + 2 * (1 - t) * t * controlPos.x + t * t * endPos.x;
    let y = (1 - t) * (1 - t) * startPos.y + 2 * (1 - t) * t * controlPos.y + t * t * endPos.y;

    // Spinning during flight
    flightRotation = t * 3.93; // Reach ~225° (3.93 radians) at t = 1

    // Draw horseshoe with rotation
    push();
    translate(x, y);
    rotate(flightRotation);
    image(horseshoeImg, -17, -18, 40, 40);
    pop();

    // Log rotation at impact
    if (t > 0.99 && t <= 1) {
        console.log('Rotation at impact (radians):', flightRotation, 'degrees:', flightRotation * 180 / PI);
    }
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}

document.addEventListener('DOMContentLoaded', () => {
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const url = card.getAttribute('href');
            if (!url) {
                console.warn('Navigation blocked for WIP page:', url);
                return; // Optionally alert user or provide feedback
            }
            startAnimation(card, url);
        });
    });
});