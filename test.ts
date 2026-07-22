// Tests for Adafruit HT16K33 Alphanumeric Display Extension

// 1. Initialize Display (Address 112 = 0x70)
alphaDisplay.initializeAlphanumericDisplay(112)

// 2. Set Display Brightness (Max 15)
alphaDisplay.setBrightness(15)

// 3. Show static string (<= 4 chars)
alphaDisplay.showString("cpx")
basic.pause(1000)

// 4. Show right-aligned numbers
alphaDisplay.showNumber(7)
basic.pause(1000)

alphaDisplay.showNumber(1234)
basic.pause(1000)

// 5. Test Blink Rate (Rate 2 = 1Hz)
alphaDisplay.setBlinkRate(2)
basic.pause(2000)

// Turn off blinking
alphaDisplay.setBlinkRate(0)

// 6. Test Shift Interval and Auto-Scrolling String
alphaDisplay.setShiftInterval(200)
alphaDisplay.showString("hello world")
basic.pause(1000)

// 7. Clear the display
alphaDisplay.clear()
