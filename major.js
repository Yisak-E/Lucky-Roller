// --- Configuration ---
        const totalSegments = 16;
        const segmentAngle = 360 / totalSegments;
        const colors = [
            '#FF5733', '#33FF57', '#3357FF', '#F333FF',
            '#FF33A1', '#33FFF5', '#F5FF33', '#FF8C33',
            '#8C33FF', '#33FF8C', '#FF3380', '#8033FF',
            '#33A1FF', '#A1FF33', '#EF4444', '#10B981'
        ];

        // --- State ---
        let currentRotation = 0;
        let isSpinning = false;
        const wheelGroup = document.getElementById('wheel-group');
        const resultMessageDiv = document.getElementById('resultMessage');

        // --- Initialization ---
        function initWheel() {
            let svgContent = '';
            
            for (let i = 0; i < totalSegments; i++) {
                // Calculate angles in degrees
                const startAngle = i * segmentAngle; 
                const endAngle = (i + 1) * segmentAngle;

                // Convert to radians for coordinates
                // We shift by -90 degrees (Math.PI/2) so index 1 starts at 12 o'clock,
                // but standard trigonometry starts at 3 o'clock (0 rads). 
                // Let's just use standard 0 rads = 3 o'clock and handle the pointer logic later.
                const r = 95; // Radius
                const x1 = 100 + r * Math.cos(Math.PI * startAngle / 180);
                const y1 = 100 + r * Math.sin(Math.PI * startAngle / 180);
                const x2 = 100 + r * Math.cos(Math.PI * endAngle / 180);
                const y2 = 100 + r * Math.sin(Math.PI * endAngle / 180);

                // Create the slice path (M=Move to center, L=Line to edge, A=Arc, Z=Close path)
                const pathData = `M100,100 L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`;

                // Calculate text position (midpoint of the slice)
                const midAngle = startAngle + (segmentAngle / 2);
                const textRadius = 75; // Slightly closer to center
                const tx = 100 + textRadius * Math.cos(Math.PI * midAngle / 180);
                const ty = 100 + textRadius * Math.sin(Math.PI * midAngle / 180);

                // SVG String construction
                svgContent += `
                    <g>
                        <path d="${pathData}" fill="${colors[i % colors.length]}" stroke="#fff" stroke-width="1" />
                        <text x="${tx}" y="${ty}" fill="#fff" font-size="10" font-weight="bold" 
                              text-anchor="middle" dominant-baseline="middle" 
                              transform="rotate(${midAngle + 90}, ${tx}, ${ty})">
                            ${i + 1}
                        </text>
                    </g>
                `;
            }
            wheelGroup.innerHTML = svgContent;
        }

        // --- Game Logic ---
        function spinWheel() {
            if (isSpinning) return;

            const guessInput = document.getElementById('guessInput');
            const userGuess = parseInt(guessInput.value);

            // Validation
            if (!userGuess || userGuess < 1 || userGuess > 16) {
                showResult("Please enter a number between 1 and 16!", "text-red-500");
                resultMessageDiv.classList.remove('opacity-0');
                guessInput.focus();
                return;
            }

            // Reset UI
            isSpinning = true;
            document.getElementById('spinBtn').disabled = true;
            resultMessageDiv.classList.add('opacity-0'); // Hide old result
            
            // Random Spin Calculation
            // Minimum 3 full spins (1080 deg) + random segment offset
            const extraSpins = 360 * (3 + Math.random() * 2); 
            const randomOffset = Math.floor(Math.random() * 360);
            
            // New total rotation
            currentRotation += extraSpins + randomOffset;
            
            // Apply CSS Transform
            wheelGroup.style.transform = `rotate(${currentRotation}deg)`;

            // Wait for animation to finish (4s match CSS transition)
            setTimeout(() => {
                calculateWinner(currentRotation, userGuess);
                isSpinning = false;
                document.getElementById('spinBtn').disabled = false;
            }, 4000);
        }

        function calculateWinner(totalRotation, userGuess) {
            // Pointer is physically at Top (-90 degrees or 270 degrees in SVG space)
            // But our segments are drawn starting from 0 degrees (3 o'clock) going clockwise.
            // 
            // When the wheel rotates +R degrees (clockwise), the coordinate system shifts.
            // We need to find which segment is currently aligned with 270 degrees (Top).
            
            // Normalize the current rotation to [0, 360)
            const normalizedRotation = totalRotation % 360;
            
            // The angle of the pointer relative to the rotated wheel "0" mark:
            // PointerAngle - RotationAngle
            // Top is 270 degrees.
            let effectiveAngle = (270 - normalizedRotation) % 360;
            if (effectiveAngle < 0) effectiveAngle += 360;

            // Determine index (0-15)
            const winningIndex = Math.floor(effectiveAngle / segmentAngle);
            const winningNumber = winningIndex + 1;

            // Display Result
            resultMessageDiv.classList.remove('opacity-0');
            
            if (winningNumber === userGuess) {
                showResult(`🎉 JACKPOT! The number was ${winningNumber}. You win!`, "text-green-600");
                triggerConfetti();
            } else {
                showResult(`Oops! It was ${winningNumber}. Try again!`, "text-slate-700");
            }
        }

        function showResult(text, colorClass) {
            resultMessageDiv.innerHTML = `<p class="text-lg font-bold ${colorClass}">${text}</p>`;
        }

        function triggerConfetti() {
            for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.classList.add('confetti');
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                document.body.appendChild(confetti);
                
                // Cleanup
                setTimeout(() => confetti.remove(), 5000);
            }
        }

        // Run on load
        initWheel();